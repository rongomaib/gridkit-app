import { Matrix4, Quaternion, Vector3 } from 'three'
import { describe, expect, test } from 'vitest'
import { buildStructuralModel } from '../src/translate'

// Helpers to construct mock part creators matching the AnyCreator duck-type
function makeMatrix(pos: [number, number, number], axis: 'x' | 'y' | 'z'): number[] {
  const m = new Matrix4()
  const q = new Quaternion()
  // Rotate so local +X aligns with the requested world axis
  if (axis === 'z') q.setFromAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
  else if (axis === 'y') q.setFromAxisAngle(new Vector3(0, 0, 1), Math.PI / 2)
  m.compose(new Vector3(...pos), q, new Vector3(1, 1, 1))
  return m.toArray() as number[]
}

function timber(
  id: string,
  pos: [number, number, number],
  axis: 'x' | 'y' | 'z',
  lengthInGrids: number,
) {
  return { id, spec: { type: 'timber', lengthInGrids }, transform: makeMatrix(pos, axis) }
}

function panel(id: string, pos: [number, number, number], axis: 'x' | 'z', lengthInGrids: number) {
  return { id, spec: { type: 'panel-brace', lengthInGrids }, transform: makeMatrix(pos, axis) }
}

// Minimal fixture: 2 vertical posts (3m = 75 gu apart) + 1 horizontal panel (20 gu span)
// Posts at (0,0,0) and (0.8,0,0), both 30 gu tall (1.2 m)
// Panel from (0,0,0.04) to (0.8,0,0.04), 20 gu long
const POST_HEIGHT_GU = 30 // 1.2 m
const PANEL_LEN_GU = 20 // 0.8 m
const PANEL_BOTTOM_Z = 0.04 // 1 gu above base
const POST_X2 = 0.8 // 20 gu in X (matches PANEL_LEN_GU)

describe('buildStructuralModel', () => {
  const parts = [
    timber('t1', [0, 0, 0], 'z', POST_HEIGHT_GU),
    timber('t2', [POST_X2, 0, 0], 'z', POST_HEIGHT_GU),
    panel('p1', [0, 0, PANEL_BOTTOM_Z], 'x', PANEL_LEN_GU),
  ]

  const model = buildStructuralModel(parts)

  test('produces 4 load cases (dead, live, wind_x, seismic_x)', () => {
    expect(model.loadCases.map((lc) => lc.id)).toEqual(['dead', 'live', 'wind_x', 'seismic_x'])
  })

  test('dead load covers all members with downward (-Z) UDL', () => {
    const dead = model.loadCases.find((lc) => lc.id === 'dead')!
    expect(dead.memberDistLoads.length).toBeGreaterThan(0)
    for (const dl of dead.memberDistLoads) {
      expect(dl.direction).toBe('Fz')
      expect(dl.w1).toBeLessThan(0) // downward
    }
  })

  test('live load only on horizontal (panel-brace) members', () => {
    const live = model.loadCases.find((lc) => lc.id === 'live')!
    expect(live.memberDistLoads.length).toBeGreaterThan(0)
    for (const dl of live.memberDistLoads) {
      const m = model.members.find((m) => m.id === dl.memberId)!
      expect(m.type).toBe('panel-brace')
    }
  })

  test('live load magnitude is 1.5 kPa * 0.8 m = 1200 N/m', () => {
    const live = model.loadCases.find((lc) => lc.id === 'live')!
    for (const dl of live.memberDistLoads) {
      expect(Math.abs(dl.w1)).toBeCloseTo(1200, 0)
    }
  })

  test('dead load self-weight matches density * g * area for timber', () => {
    const dead = model.loadCases.find((lc) => lc.id === 'dead')!
    const timberMembers = model.members.filter((m) => m.type === 'timber')
    expect(timberMembers.length).toBeGreaterThan(0)
    for (const m of timberMembers) {
      const dl = dead.memberDistLoads.find((d) => d.memberId === m.id)!
      // 500 kg/m3 * 9.81 m/s2 * 0.0144 m2 = 70.632 N/m (downward)
      expect(Math.abs(dl.w1)).toBeCloseTo(500 * 9.81 * 0.0144, 1)
    }
  })

  test('wind_x load applies nodal forces only (no memberDistLoads)', () => {
    const wind = model.loadCases.find((lc) => lc.id === 'wind_x')!
    expect(wind.memberDistLoads).toHaveLength(0)
  })

  test('seismic_x load has positive base shear (FX > 0)', () => {
    const seismic = model.loadCases.find((lc) => lc.id === 'seismic_x')!
    const totalFX = seismic.nodeLoads.reduce((s, nl) => s + (nl.FX ?? 0), 0)
    expect(totalFX).toBeGreaterThan(0)
  })

  test('supports are at the base plane (z = 0)', () => {
    for (const sup of model.supports) {
      const node = model.nodes.find((n) => n.id === sup.nodeId)!
      expect(node.z).toBeCloseTo(0, 4)
    }
  })

  test('supports have DX DY DZ RZ restrained', () => {
    for (const sup of model.supports) {
      expect(sup.DX).toBe(true)
      expect(sup.DY).toBe(true)
      expect(sup.DZ).toBe(true)
      expect(sup.RZ).toBe(true)
    }
  })

  test('all panel members have panel section area (0.096 m2)', () => {
    const panels = model.members.filter((m) => m.type === 'panel-brace')
    for (const m of panels) {
      expect(m.section.A).toBeCloseTo(0.096, 6)
    }
  })

  test('model carries a disclaimer', () => {
    expect(model.disclaimer).toContain('DESIGN-ITERATION AID')
  })
})
