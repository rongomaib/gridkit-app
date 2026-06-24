import type { LoadCaseResult, ModelMember, NodeDisplacement, Reaction } from '@villagekit/analysis'
import { useProductKitContext } from './context'

const S = {
  panel: {
    padding: '12px',
    fontSize: '12px',
    fontFamily: 'monospace',
    overflowY: 'auto' as const,
    height: '100%',
  },
  heading: { fontWeight: 'bold', marginBottom: '8px', fontSize: '13px' },
  disclaimer: { color: '#c00', marginBottom: '8px', fontSize: '11px' },
  row: { display: 'flex', gap: '16px', marginBottom: '4px' },
  label: { color: '#666' },
  table: { borderCollapse: 'collapse' as const, width: '100%', marginTop: '8px' },
  th: { borderBottom: '1px solid #ccc', textAlign: 'left' as const, padding: '2px 6px' },
  td: { padding: '2px 6px', borderBottom: '1px solid #eee' },
}

export function AnalysisPanel() {
  const { structuralModel, solverResult, isAnalysing } = useProductKitContext()

  if (structuralModel == null) {
    return <div style={S.panel}>No structural parts (add Beam120, Timber, or PanelBrace).</div>
  }

  const timberCount = structuralModel.members.filter((m: ModelMember) => m.type === 'timber').length
  const panelCount = structuralModel.members.filter(
    (m: ModelMember) => m.type === 'panel-brace',
  ).length

  return (
    <div style={S.panel}>
      <div style={S.disclaimer}>{structuralModel.disclaimer}</div>

      <div style={S.heading}>Topology</div>
      <div style={S.row}>
        <span>
          <span style={S.label}>Nodes </span>
          {structuralModel.nodes.length}
        </span>
        <span>
          <span style={S.label}>Posts </span>
          {timberCount}
        </span>
        <span>
          <span style={S.label}>Panels </span>
          {panelCount}
        </span>
        <span>
          <span style={S.label}>Supports </span>
          {structuralModel.supports.length}
        </span>
      </div>

      <div style={{ marginTop: '12px', ...S.heading }}>Solver</div>
      {isAnalysing && <div>Analysing…</div>}
      {!isAnalysing && solverResult == null && <div style={S.label}>—</div>}
      {solverResult != null && !solverResult.ok && (
        <div style={{ color: '#c00' }}>Error: {solverResult.error}</div>
      )}
      {solverResult?.ok &&
        solverResult.loadCaseResults.map((lcr: LoadCaseResult) => {
          const maxDZ = Math.max(
            ...lcr.nodeDisplacements.map((d: NodeDisplacement) => Math.abs(d.DZ)),
          )
          return (
            <div key={lcr.loadCaseId} style={{ marginBottom: '12px' }}>
              <div style={S.heading}>{lcr.loadCaseId}</div>
              <div style={S.row}>
                <span>
                  <span style={S.label}>Max |δZ| </span>
                  {(maxDZ * 1000).toFixed(2)} mm
                </span>
              </div>
              <div style={S.heading}>Base reactions</div>
              <table style={S.table}>
                <thead>
                  <tr>
                    <th style={S.th}>Node</th>
                    <th style={S.th}>FX (N)</th>
                    <th style={S.th}>FY (N)</th>
                    <th style={S.th}>FZ (N)</th>
                  </tr>
                </thead>
                <tbody>
                  {lcr.reactions.map((r: Reaction) => (
                    <tr key={r.nodeId}>
                      <td style={S.td}>{r.nodeId}</td>
                      <td style={S.td}>{r.FX.toFixed(1)}</td>
                      <td style={S.td}>{r.FY.toFixed(1)}</td>
                      <td style={S.td}>{r.FZ.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        })}
    </div>
  )
}
