import { useColorMode } from '@/context/colorMode'
import type { PartMakerSpec } from '@/lib/partMakerTypes'

export interface PartMakerSvgProps {
  spec: PartMakerSpec
}

export function PartMakerSvg({ spec }: PartMakerSvgProps) {
  const { isDark } = useColorMode()

  const bg = isDark ? '#0f172a' : '#ffffff'
  const textPrimary = isDark ? '#e2e8f0' : '#1e293b'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#334155' : '#e2e8f0'

  const lengthMm = spec.previewLengthGrids * spec.gridUnitMm

  return (
    <div
      style={{
        padding: '14px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: bg,
        color: textPrimary,
        fontSize: '13px',
        lineHeight: 1.6,
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontWeight: 600, fontSize: '14px' }}>{spec.displayName}</div>
        <div style={{ fontSize: '11px', color: textMuted, fontFamily: 'monospace', marginTop: '3px' }}>
          {spec.widthMm}×{spec.heightMm}mm · {lengthMm}mm long
          {spec.thicknessMm > 0 ? ` · t=${spec.thicknessMm}mm` : ''}
        </div>
      </div>

      <div style={{ color: textMuted, fontSize: '12px', marginBottom: '14px' }}>
        Custom profile — 2D view not available.
        <br />
        Use the 3D view to verify geometry.
      </div>

      {spec.holeDiameter > 0 && (
        <div
          style={{
            fontSize: '12px',
            color: textMuted,
            borderTop: `1px solid ${borderColor}`,
            paddingTop: '10px',
            fontFamily: 'monospace',
          }}
        >
          ⌀{spec.holeDiameter}mm holes · {spec.holeSpacingMm}mm pitch · {spec.holeEdgeOffsetMm}mm edge · {spec.holeRows} row{spec.holeRows !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
