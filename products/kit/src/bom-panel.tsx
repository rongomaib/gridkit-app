// Phase 6 -- hardware BOM panel.
// Displays connector demand summary and per-connection details.
import type { BomReport, ConnectorType } from '@villagekit/analysis'
import { generateBomReport } from '@villagekit/analysis'
import { useMemo, useState } from 'react'
import { useProductKitContext } from './context'

const CONNECTOR_COLORS: Record<ConnectorType, string> = {
  A: '#4caf50',
  B: '#ff9800',
  C: '#f44336',
  D: '#9c27b0',
}

const CONNECTOR_SHORT: Record<ConnectorType, string> = {
  A: 'A -- Standard Strap',
  B: 'B -- Heavy Plate',
  C: 'C -- Hold-Down',
  D: 'D -- Double Heavy',
}

const pill: React.CSSProperties = {
  display: 'inline-block',
  borderRadius: '10px',
  padding: '1px 8px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#fff',
}

export function BomPanel() {
  const { structuralModel, solverResult } = useProductKitContext()
  const [expanded, setExpanded] = useState(false)

  const report: BomReport | null = useMemo(() => {
    if (!structuralModel || !solverResult?.ok) return null
    if (solverResult.loadCaseResults.length === 0) return null
    return generateBomReport(structuralModel, solverResult)
  }, [structuralModel, solverResult])

  if (!report) return null

  const { summary, globalChecks, baseConnections, panelConnections } = report
  const totalConnectors = Object.values(summary).reduce((s, n) => s + n, 0)

  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 5,
        width: expanded ? '340px' : '220px',
        backgroundColor: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(0,0,0,0.12)',
        borderRadius: '12px',
        padding: '10px 14px',
        fontSize: '12px',
        fontFamily: 'system-ui, sans-serif',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '11px', letterSpacing: '0.05em', color: '#333' }}>
          HARDWARE BOM
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1px 8px',
            cursor: 'pointer',
            fontSize: '11px',
            color: '#666',
          }}
        >
          {expanded ? 'less' : 'detail'}
        </button>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {(Object.entries(summary) as [ConnectorType, number][])
          .filter(([, n]) => n > 0)
          .map(([type, count]) => (
            <span
              key={type}
              style={{ ...pill, backgroundColor: CONNECTOR_COLORS[type] }}
              title={CONNECTOR_SHORT[type]}
            >
              {count}x {type}
            </span>
          ))}
        <span style={{ ...pill, backgroundColor: '#607d8b' }}>{totalConnectors} total</span>
      </div>

      {/* Global check */}
      <div
        style={{
          borderTop: '1px solid #eee',
          paddingTop: '6px',
          marginBottom: expanded ? '8px' : 0,
          color: globalChecks.upliftCheckPass ? '#388e3c' : '#c62828',
          fontSize: '11px',
        }}
      >
        <span style={{ fontWeight: 600 }}>{globalChecks.upliftCheckPass ? 'OK' : 'WARN'}</span>
        {' Uplift: '}
        {globalChecks.upliftCheckPass
          ? `OK -- ${(globalChecks.totalGravityLoad_N / 9.81 / 1000).toFixed(1)} kN gravity`
          : `UPLIFT ${Math.round(Math.abs(globalChecks.maxBaseUplift_N) / 9.81)} kg at base`}
      </div>

      {/* Disclaimer */}
      {expanded && (
        <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic', marginBottom: '8px' }}>
          {report.disclaimer}
        </div>
      )}

      {/* Detailed tables */}
      {expanded && (
        <>
          <SectionTitle>Base connections ({baseConnections.length})</SectionTitle>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '11px',
              marginBottom: '8px',
            }}
          >
            <thead>
              <tr style={{ color: '#888' }}>
                <th style={TH}>Node</th>
                <th style={TH}>FZ</th>
                <th style={TH}>FH</th>
                <th style={TH}>Type</th>
                <th style={TH}>Util</th>
              </tr>
            </thead>
            <tbody>
              {baseConnections.map((c) => (
                <tr key={c.nodeId} style={{ color: c.isUplift ? '#c62828' : '#333' }}>
                  <td style={TD}>{c.nodeId}</td>
                  <td style={TD}>
                    {c.isUplift ? 'up' : 'dn'}
                    {Math.round(Math.abs(c.FZ_uls) / 9.81)}kg
                  </td>
                  <td style={TD}>{Math.round(c.FH_uls / 9.81)}kg</td>
                  <td style={TD}>
                    <span style={{ ...pill, backgroundColor: CONNECTOR_COLORS[c.connector] }}>
                      {c.connector}
                    </span>
                  </td>
                  <td style={{ ...TD, color: c.utilizationPct > 80 ? '#c62828' : '#388e3c' }}>
                    {c.utilizationPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionTitle>Panel-end connections ({panelConnections.length})</SectionTitle>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ color: '#888' }}>
                <th style={TH}>Part</th>
                <th style={TH}>End</th>
                <th style={TH}>Shear</th>
                <th style={TH}>Type</th>
                <th style={TH}>Util</th>
              </tr>
            </thead>
            <tbody>
              {panelConnections.map((c, i) => (
                <tr
                  key={`${c.memberId}-${c.end}`}
                  style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                >
                  <td style={TD} title={`${c.memberId} - ${c.governingCombo}`}>
                    {c.partId.replace('panel-brace-', 'p').slice(0, 10)}
                  </td>
                  <td style={TD}>{c.end === 'start' ? 'S' : 'E'}</td>
                  <td style={TD}>{Math.round(c.shear / 9.81)}kg</td>
                  <td style={TD}>
                    <span style={{ ...pill, backgroundColor: CONNECTOR_COLORS[c.connector] }}>
                      {c.connector}
                    </span>
                  </td>
                  <td style={{ ...TD, color: c.utilizationPct > 80 ? '#c62828' : '#388e3c' }}>
                    {c.utilizationPct}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Load combination note */}
      <div style={{ marginTop: '6px', fontSize: '10px', color: '#aaa' }}>{report.ulsLabel}</div>
    </div>
  )
}

const TH: React.CSSProperties = { textAlign: 'left', padding: '2px 4px', fontWeight: 500 }
const TD: React.CSSProperties = { padding: '2px 4px' }

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.05em',
        color: '#555',
        textTransform: 'uppercase',
        marginBottom: '4px',
        marginTop: '8px',
        borderBottom: '1px solid #eee',
        paddingBottom: '2px',
      }}
    >
      {children}
    </div>
  )
}
