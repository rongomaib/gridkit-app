import { buildStructuralModel, runSolver } from '@villagekit/analysis'
import type { SolverResult, StructuralModel } from '@villagekit/analysis'
import { useEffect, useRef, useState } from 'react'
import type { Parts } from './types'

export type AnalysisState = {
  structuralModel: StructuralModel | null
  solverResult: SolverResult | null
  isAnalysing: boolean
}

function hasStructuralParts(parts: Parts): boolean {
  for (const p of parts) {
    if (p == null || p === false) continue
    if (Array.isArray(p)) {
      if (hasStructuralParts(p as Parts)) return true
    } else {
      const t = (p as any)?.spec?.type
      if (t === 'timber' || t === 'panel-brace') return true
    }
  }
  return false
}

export function useAnalysis(parts: Parts): AnalysisState {
  const [structuralModel, setStructuralModel] = useState<StructuralModel | null>(null)
  const [solverResult, setSolverResult] = useState<SolverResult | null>(null)
  const [isAnalysing, setIsAnalysing] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    if (!hasStructuralParts(parts)) {
      setStructuralModel(null)
      setSolverResult(null)
      setIsAnalysing(false)
      return
    }

    let model: StructuralModel
    try {
      model = buildStructuralModel(parts as any)
    } catch (err) {
      console.error('[analysis] buildStructuralModel threw:', err)
      return
    }

    setStructuralModel(model)
    console.log(
      `[analysis] model: ${model.nodes.length} nodes, ${model.members.length} members, ` +
        `${model.supports.length} supports, ${model.loadCases.length} load cases`,
    )

    cancelRef.current = false
    setIsAnalysing(true)
    setSolverResult(null)

    runSolver(model).then((result) => {
      if (cancelRef.current) return
      setSolverResult(result)
      setIsAnalysing(false)
      if (result.ok) {
        const lcr0 = result.loadCaseResults[0]
        const dzVals = lcr0?.nodeDisplacements.map((d) => d.DZ) ?? []
        const dxVals = lcr0?.nodeDisplacements.map((d) => d.DX) ?? []
        const minDZ = dzVals.length ? Math.min(...dzVals).toExponential(3) : 'n/a'
        const maxDZ = dzVals.length ? Math.max(...dzVals).toExponential(3) : 'n/a'
        const maxDX = dxVals.length ? Math.max(...dxVals.map(Math.abs)).toExponential(3) : 'n/a'
        console.log(
          `[analysis] solver ok | dead LC: ${lcr0?.nodeDisplacements.length} nodes | DZ [${minDZ}, ${maxDZ}] m | maxDX ${maxDX} m`,
        )
      } else {
        console.error('[analysis] solver error:', result.error)
      }
    })

    return () => {
      cancelRef.current = true
    }
  }, [parts])

  return { structuralModel, solverResult, isAnalysing }
}
