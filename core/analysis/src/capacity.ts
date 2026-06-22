// Phase 6 - hardware capacity mapping.
// Maps raw solver force demand at structural connections to laser-cut folded-plate tiers.
// Phase 6b adds live + wind + seismic load cases and NZS 1170.5 ULS combinations.
//
// Capacities are indicative preliminary values for NZ SG8 timber construction.
// A chartered engineer must verify all connection designs before construction.

import type { StructuralModel } from './model'
import type { LoadCaseResult, MemberEndForces, SolverResult } from './results'

// -- Connector types -----------------------------------------------------------

export type ConnectorType = 'A' | 'B' | 'C' | 'D'

export type ConnectorSpec = {
  label: string
  description: string
  shearCapacity: number // N - combined resultant shear
  tensionCapacity: number // N - tension/uplift
}

// Indicative capacities for preliminary design.  All require engineering verification.
export const CONNECTOR_SPECS: Record<ConnectorType, ConnectorSpec> = {
  A: {
    label: 'Type A - Standard Strap',
    description: 'Light-duty 3x35mm galv strap, screwed both sides',
    shearCapacity: 8_000,
    tensionCapacity: 6_000,
  },
  B: {
    label: 'Type B - Heavy Plate',
    description: 'Folded 5mm steel plate, M12 bolts each flange',
    shearCapacity: 25_000,
    tensionCapacity: 20_000,
  },
  C: {
    label: 'Type C - Uplift Hold-Down',
    description: 'Post-base anchor plate with M16 hold-down rod to slab',
    shearCapacity: 20_000,
    tensionCapacity: 35_000,
  },
  D: {
    label: 'Type D - Double Heavy Plate',
    description: '2x Type B both sides - engineer to confirm layout',
    shearCapacity: 50_000,
    tensionCapacity: 40_000,
  },
}

// -- ULS load combinations (NZS 1170.5 Table 4.1) ------------------------------

export type UlsCombination = {
  id: string
  label: string
  factors: Record<string, number> // loadCaseId -> factor
}

export const ULS_COMBINATIONS: UlsCombination[] = [
  { id: 'uls1', label: '1.35G', factors: { dead: 1.35 } },
  { id: 'uls2', label: '1.2G + 1.5Q', factors: { dead: 1.2, live: 1.5 } },
  { id: 'uls3', label: '1.2G + 1.5Q + 0.4Wu', factors: { dead: 1.2, live: 1.5, wind_x: 0.4 } },
  { id: 'uls4', label: '0.9G + Wu', factors: { dead: 0.9, wind_x: 1.0 } },
  { id: 'uls5', label: '1.2G + Eu + 0.3Q', factors: { dead: 1.2, seismic_x: 1.0, live: 0.3 } },
]

// Panel height for moment-to-force conversion (fixed at 800 mm).
const PANEL_HEIGHT = 0.8

// -- Demand and BOM types -----------------------------------------------------

export type PanelConnectionDemand = {
  memberId: string
  partId: string
  nodeId: string // the post node this panel end connects to
  end: 'start' | 'end'
  shear: number // resultant N, ULS-factored (governing combination)
  axial: number // N - in-plane panel tension/compression, ULS-factored
  connector: ConnectorType
  utilizationPct: number
  governingCombo: string // label of the governing ULS combination
}

export type BaseConnectionDemand = {
  nodeId: string
  FZ_uls: number // N - from 1.35G for display; positive = downward
  FH_uls: number // N - horizontal resultant, governing ULS combination
  isUplift: boolean
  connector: ConnectorType
  utilizationPct: number
  governingCombo: string
}

export type BomReport = {
  disclaimer: string
  loadCaseId: string
  ulsLabel: string
  panelConnections: PanelConnectionDemand[]
  baseConnections: BaseConnectionDemand[]
  summary: Record<ConnectorType, number>
  globalChecks: {
    totalGravityLoad_N: number
    maxBaseUplift_N: number
    upliftCheckPass: boolean
    note: string
  }
}

// -- Connector selection -------------------------------------------------------

function selectPanelConnector(shear: number, axial: number): ConnectorType {
  const demand = Math.sqrt(shear ** 2 + axial ** 2)
  if (demand <= CONNECTOR_SPECS.A.shearCapacity) return 'A'
  if (demand <= CONNECTOR_SPECS.B.shearCapacity) return 'B'
  if (demand <= CONNECTOR_SPECS.D.shearCapacity) return 'D'
  return 'D' // flag for engineer - demand exceeds tabulated tiers
}

function selectBaseConnector(uplift: number, shear: number): ConnectorType {
  if (uplift > 500) return 'C'
  if (shear <= CONNECTOR_SPECS.A.shearCapacity) return 'A'
  if (shear <= CONNECTOR_SPECS.B.shearCapacity) return 'B'
  return 'D'
}

function utilization(demand: number, capacity: number): number {
  return Math.min(999, Math.round((demand / capacity) * 100))
}

// -- Linear superposition helpers ---------------------------------------------

const FORCE_KEYS = [
  'fx_start',
  'fy_start',
  'fz_start',
  'mx_start',
  'my_start',
  'mz_start',
  'fx_end',
  'fy_end',
  'fz_end',
  'mx_end',
  'my_end',
  'mz_end',
] as const

type ForceKey = (typeof FORCE_KEYS)[number]

function zeroForces(): MemberEndForces {
  return {
    fx_start: 0,
    fy_start: 0,
    fz_start: 0,
    mx_start: 0,
    my_start: 0,
    mz_start: 0,
    fx_end: 0,
    fy_end: 0,
    fz_end: 0,
    mx_end: 0,
    my_end: 0,
    mz_end: 0,
  }
}

// -- Main BOM generator -------------------------------------------------------

export function generateBomReport(model: StructuralModel, result: SolverResult): BomReport {
  // Build lookup: loadCaseId -> per-member results map
  const membersByLcId = new Map<string, Map<string, MemberEndForces>>()
  const lcrByLcId = new Map<string, LoadCaseResult>()
  for (const lcr of result.loadCaseResults) {
    lcrByLcId.set(lcr.loadCaseId, lcr)
    membersByLcId.set(lcr.loadCaseId, new Map(lcr.memberResults.map((r) => [r.memberId, r.forces])))
  }

  // Combined end forces for a member under a ULS combination
  function combinedForces(memberId: string, combo: UlsCombination): MemberEndForces {
    const out = zeroForces()
    for (const [lcId, factor] of Object.entries(combo.factors)) {
      const forces = membersByLcId.get(lcId)?.get(memberId)
      if (!forces) continue
      for (const k of FORCE_KEYS) (out[k as ForceKey] as number) += forces[k as ForceKey] * factor
    }
    return out
  }

  // Combined reactions for a node under a ULS combination
  function combinedReaction(nodeId: string, combo: UlsCombination) {
    let FX = 0
    let FY = 0
    let FZ = 0
    for (const [lcId, factor] of Object.entries(combo.factors)) {
      const lcr = lcrByLcId.get(lcId)
      if (!lcr) continue
      const rxn = lcr.reactions.find((r) => r.nodeId === nodeId)
      if (rxn) {
        FX += rxn.FX * factor
        FY += rxn.FY * factor
        FZ += rxn.FZ * factor
      }
    }
    return { FX, FY, FZ }
  }

  // Panel member end connections - find governing ULS combo per end
  const panelConnections: PanelConnectionDemand[] = []
  for (const m of model.members) {
    if (m.type !== 'panel-brace') continue

    for (const end of ['start', 'end'] as const) {
      const nodeId = end === 'start' ? m.startNodeId : m.endNodeId

      let bestShear = 0
      let bestAxial = 0
      let bestCombo = ULS_COMBINATIONS[0]!

      for (const combo of ULS_COMBINATIONS) {
        const f = combinedForces(m.id, combo)
        const fx = end === 'start' ? f.fx_start : f.fx_end
        const fy = end === 'start' ? f.fy_start : f.fy_end
        const fz = end === 'start' ? f.fz_start : f.fz_end
        const mz = end === 'start' ? f.mz_start : f.mz_end

        const shear = Math.sqrt(fy ** 2 + fz ** 2 + (mz / PANEL_HEIGHT) ** 2)
        const axial = Math.abs(fx)

        if (Math.sqrt(shear ** 2 + axial ** 2) > Math.sqrt(bestShear ** 2 + bestAxial ** 2)) {
          bestShear = shear
          bestAxial = axial
          bestCombo = combo
        }
      }

      const connector = selectPanelConnector(bestShear, bestAxial)
      const demand = Math.sqrt(bestShear ** 2 + bestAxial ** 2)
      const capacity = CONNECTOR_SPECS[connector].shearCapacity

      // Display FZ_uls from 1.35G for the base connection reference row (dead only)
      const deadForces = combinedForces(m.id, ULS_COMBINATIONS[0]!)

      panelConnections.push({
        memberId: m.id,
        partId: m.partId,
        nodeId,
        end,
        shear: Math.round(bestShear),
        axial: Math.round(bestAxial),
        connector,
        utilizationPct: utilization(demand, capacity),
        governingCombo: bestCombo.label,
      })

      // suppress unused warning
      void deadForces
    }
  }

  // Base connections - find governing ULS combo per support node
  const baseConnections: BaseConnectionDemand[] = []
  for (const sup of model.supports) {
    const { nodeId } = sup

    let bestUplift = 0
    let bestFH = 0
    let bestIsUplift = false
    let bestCombo = ULS_COMBINATIONS[0]!

    for (const combo of ULS_COMBINATIONS) {
      const rxn = combinedReaction(nodeId, combo)
      // FZ > 0 = upward reaction (ground pushes post up = post in compression)
      // FZ < 0 = downward reaction from ground = uplift on structure
      const isUplift = rxn.FZ < -500
      const uplift = isUplift ? Math.abs(rxn.FZ) : 0
      const FH = Math.sqrt(rxn.FX ** 2 + rxn.FY ** 2)
      const demand = Math.sqrt(uplift ** 2 + FH ** 2)
      const bestDemand = Math.sqrt(bestUplift ** 2 + bestFH ** 2)

      if (demand > bestDemand) {
        bestUplift = uplift
        bestFH = FH
        bestIsUplift = isUplift
        bestCombo = combo
      }
    }

    // FZ_uls displayed from 1.35G for the table (downward post force = gravity reference)
    const dead1_35 = combinedReaction(nodeId, ULS_COMBINATIONS[0]!)

    const connector = selectBaseConnector(bestUplift, bestFH)
    const demand = Math.sqrt(bestUplift ** 2 + bestFH ** 2)
    const capacity = bestIsUplift
      ? CONNECTOR_SPECS[connector].tensionCapacity
      : CONNECTOR_SPECS[connector].shearCapacity

    baseConnections.push({
      nodeId,
      FZ_uls: Math.round(dead1_35.FZ * 1.35),
      FH_uls: Math.round(bestFH),
      isUplift: bestIsUplift,
      connector,
      utilizationPct: utilization(demand, capacity),
      governingCombo: bestCombo.label,
    })
  }

  // Summary counts
  const summary: Record<ConnectorType, number> = { A: 0, B: 0, C: 0, D: 0 }
  for (const c of panelConnections) summary[c.connector]++
  for (const c of baseConnections) summary[c.connector]++

  // Global checks - worst base uplift across all combinations
  let maxBaseUplift_N = 0
  for (const sup of model.supports) {
    for (const combo of ULS_COMBINATIONS) {
      const rxn = combinedReaction(sup.nodeId, combo)
      if (rxn.FZ < maxBaseUplift_N) maxBaseUplift_N = rxn.FZ
    }
  }

  // Total gravity from 1.35G (dead only reference)
  const dead1_35Rxns = model.supports.map((s) => combinedReaction(s.nodeId, ULS_COMBINATIONS[0]!))
  const totalGravityLoad_N = dead1_35Rxns.reduce((s, r) => s + r.FZ, 0)

  return {
    disclaimer:
      'PRELIMINARY BOM - indicative connector sizes only. Capacities are not code-verified. ' +
      'A chartered structural engineer must confirm all connection designs.',
    loadCaseId: 'uls-combined',
    ulsLabel: 'NZS 1170.5 ULS: 1.35G / 1.2G+1.5Q / 1.2G+1.5Q+0.4Wu / 0.9G+Wu / 1.2G+Eu+0.3Q',
    panelConnections,
    baseConnections,
    summary,
    globalChecks: {
      totalGravityLoad_N: Math.round(totalGravityLoad_N),
      maxBaseUplift_N: Math.round(maxBaseUplift_N),
      upliftCheckPass: maxBaseUplift_N >= -500,
      note:
        'Governing demand taken across 5 NZS 1170.5 ULS combinations. ' +
        'Lateral loads are indicative - engineer must apply site-specific wind speed and seismic hazard.',
    },
  }
}
