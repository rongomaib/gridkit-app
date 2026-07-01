import { useColorMode } from '@/context/colorMode'
import type { PartMakerSpec } from '@/lib/partMakerTypes'

export interface PartMakerSvgProps {
  spec: PartMakerSpec
}

const PAD = 32
const DIM_OFFSET = 18
const ARROW = 5

function dimLine(
  x1: number, y1: number, x2: number, y2: number,
  label: string, offset: number, axis: 'h' | 'v',
  stroke: string, textFill: string,
) {
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2
  if (axis === 'h') {
    const y = y1 + offset
    return (
      <g key={label}>
        <line x1={x1} y1={y1} x2={x1} y2={y} stroke={stroke} strokeWidth={0.5} />
        <line x1={x2} y1={y1} x2={x2} y2={y} stroke={stroke} strokeWidth={0.5} />
        <line x1={x1 + ARROW} y1={y} x2={x2 - ARROW} y2={y} stroke={stroke} strokeWidth={0.8} markerStart="url(#arr)" markerEnd="url(#arr)" />
        <text x={mx} y={y - 3} textAnchor="middle" fill={textFill} fontSize={8}>{label}</text>
      </g>
    )
  }
  const x = x1 + offset
  return (
    <g key={label}>
      <line x1={x1} y1={y1} x2={x} y2={y1} stroke={stroke} strokeWidth={0.5} />
      <line x1={x1} y1={y2} x2={x} y2={y2} stroke={stroke} strokeWidth={0.5} />
      <line x1={x} y1={y1 + ARROW} x2={x} y2={y2 - ARROW} stroke={stroke} strokeWidth={0.8} markerStart="url(#arr)" markerEnd="url(#arr)" />
      <text x={x - 3} y={my} textAnchor="middle" fill={textFill} fontSize={8} transform={`rotate(-90,${x - 3},${my})`}>{label}</text>
    </g>
  )
}

function SideElevation({
  lengthMm, heightMm, thicknessMm,
  holeDiameter, holeSpacingMm, holeEdgeOffsetMm, holeRows,
  fill, stroke, dimStroke, textFill, svgW, svgH,
}: {
  lengthMm: number; heightMm: number; thicknessMm: number
  holeDiameter: number; holeSpacingMm: number; holeEdgeOffsetMm: number; holeRows: number
  fill: string; stroke: string; dimStroke: string; textFill: string
  svgW: number; svgH: number
}) {
  const drawH = thicknessMm > 0 && thicknessMm < heightMm ? thicknessMm : heightMm
  const scaleX = (svgW - PAD * 2 - DIM_OFFSET) / lengthMm
  const scaleY = (svgH - PAD * 2 - DIM_OFFSET) / drawH
  const scale = Math.min(scaleX, scaleY, 2.5)

  const rw = lengthMm * scale
  const rh = drawH * scale
  const rx = PAD + DIM_OFFSET
  const ry = PAD + (svgH - PAD * 2 - DIM_OFFSET - rh) / 2

  const holes: React.ReactNode[] = []
  if (holeDiameter > 0 && holeSpacingMm > 0) {
    const r = (holeDiameter / 2) * scale
    const count = Math.floor((lengthMm - holeEdgeOffsetMm * 2) / holeSpacingMm) + 1
    for (let col = 0; col < count; col++) {
      const cx = rx + (holeEdgeOffsetMm + col * holeSpacingMm) * scale
      for (let row = 0; row < holeRows; row++) {
        const rowSpacing = rh / (holeRows + 1)
        const cy = ry + rowSpacing * (row + 1)
        holes.push(
          <circle key={`${col}-${row}`} cx={cx} cy={cy} r={Math.max(r, 1.5)} fill="none" stroke={stroke} strokeWidth={0.8} />
        )
      }
    }
  }

  return (
    <>
      <rect x={rx} y={ry} width={rw} height={rh} fill={fill} stroke={stroke} strokeWidth={1} />
      {holes}
      {dimLine(rx, ry + rh, rx + rw, ry + rh, `${lengthMm}`, DIM_OFFSET, 'h', dimStroke, textFill)}
      {dimLine(rx, ry, rx, ry + rh, `${drawH}`, -DIM_OFFSET, 'v', dimStroke, textFill)}
    </>
  )
}

function EndSection({
  widthMm, heightMm, thicknessMm,
  fill, stroke, dimStroke, textFill, svgW, svgH,
}: {
  widthMm: number; heightMm: number; thicknessMm: number
  fill: string; stroke: string; dimStroke: string; textFill: string
  svgW: number; svgH: number
}) {
  const drawW = widthMm
  const drawH = thicknessMm > 0 && thicknessMm < heightMm ? thicknessMm : heightMm
  const scaleX = (svgW - PAD * 2 - DIM_OFFSET) / drawW
  const scaleY = (svgH - PAD * 2 - DIM_OFFSET) / drawH
  const scale = Math.min(scaleX, scaleY, 4)

  const rw = drawW * scale
  const rh = drawH * scale
  const rx = PAD + DIM_OFFSET + (svgW - PAD * 2 - DIM_OFFSET - rw) / 2
  const ry = PAD + (svgH - PAD * 2 - DIM_OFFSET - rh) / 2

  return (
    <>
      <rect x={rx} y={ry} width={rw} height={rh} fill={fill} stroke={stroke} strokeWidth={1} />
      {dimLine(rx, ry + rh, rx + rw, ry + rh, `${drawW}`, DIM_OFFSET, 'h', dimStroke, textFill)}
      {dimLine(rx, ry, rx, ry + rh, `${drawH}`, -DIM_OFFSET, 'v', dimStroke, textFill)}
    </>
  )
}

export function PartMakerSvg({ spec }: PartMakerSvgProps) {
  const { isDark } = useColorMode()

  const bg = isDark ? '#0f172a' : '#ffffff'
  const panelBg = isDark ? '#1e293b' : '#f8fafc'
  const fill = isDark ? '#334155' : '#cbd5e1'
  const stroke = isDark ? '#94a3b8' : '#475569'
  const dimStroke = isDark ? '#60a5fa' : '#2563eb'
  const textFill = isDark ? '#e2e8f0' : '#1e293b'
  const textMuted = isDark ? '#94a3b8' : '#64748b'
  const borderColor = isDark ? '#334155' : '#e2e8f0'

  const lengthMm = spec.previewLengthGrids * spec.gridUnitMm

  const SVG_W = 320
  const SVG_H = 140

  const defs = (
    <defs>
      <marker id="arr" markerWidth={4} markerHeight={4} refX={2} refY={2} orient="auto">
        <path d="M0,0 L4,2 L0,4 Z" fill={dimStroke} />
      </marker>
    </defs>
  )

  return (
    <div
      style={{
        padding: '10px',
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
        backgroundColor: bg,
        color: textFill,
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '10px' }}>
        <div style={{ fontWeight: 600, fontSize: '13px' }}>{spec.displayName}</div>
        <div style={{ fontSize: '10px', color: textMuted, fontFamily: 'monospace', marginTop: '2px' }}>
          {spec.widthMm}×{spec.heightMm}mm · {lengthMm}mm long
          {spec.thicknessMm > 0 ? ` · t=${spec.thicknessMm}mm` : ''}
        </div>
      </div>

      {/* Side elevation */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: textMuted, marginBottom: '4px', fontWeight: 500 }}>SIDE ELEVATION</div>
        <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 4 }}>
          <svg width={SVG_W} height={SVG_H} style={{ display: 'block', maxWidth: '100%' }}>
            {defs}
            <SideElevation
              lengthMm={lengthMm}
              heightMm={spec.heightMm}
              thicknessMm={spec.thicknessMm}
              holeDiameter={spec.holeDiameter}
              holeSpacingMm={spec.holeSpacingMm}
              holeEdgeOffsetMm={spec.holeEdgeOffsetMm}
              holeRows={spec.holeRows}
              fill={fill} stroke={stroke} dimStroke={dimStroke} textFill={textFill}
              svgW={SVG_W} svgH={SVG_H}
            />
          </svg>
        </div>
      </div>

      {/* End section */}
      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: textMuted, marginBottom: '4px', fontWeight: 500 }}>END SECTION</div>
        <div style={{ background: panelBg, border: `1px solid ${borderColor}`, borderRadius: 4 }}>
          <svg width={SVG_W} height={SVG_H} style={{ display: 'block', maxWidth: '100%' }}>
            {defs}
            <EndSection
              widthMm={spec.widthMm}
              heightMm={spec.heightMm}
              thicknessMm={spec.thicknessMm}
              fill={fill} stroke={stroke} dimStroke={dimStroke} textFill={textFill}
              svgW={SVG_W} svgH={SVG_H}
            />
          </svg>
        </div>
      </div>

      {/* Holes info */}
      {spec.holeDiameter > 0 && (
        <div
          style={{
            fontSize: '11px',
            color: textMuted,
            borderTop: `1px solid ${borderColor}`,
            paddingTop: '8px',
            fontFamily: 'monospace',
          }}
        >
          ⌀{spec.holeDiameter}mm holes · {spec.holeSpacingMm}mm pitch · {spec.holeEdgeOffsetMm}mm edge · {spec.holeRows} row{spec.holeRows !== 1 ? 's' : ''}
        </div>
      )}

      <div style={{ fontSize: '10px', color: textMuted, marginTop: '8px', fontStyle: 'italic' }}>
        Dimensions from spec — verify profile shape in 3D view.
      </div>
    </div>
  )
}
