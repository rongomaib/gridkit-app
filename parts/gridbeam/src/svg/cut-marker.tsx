import { LabelX } from '@villagekit/part/base/grid'
import { useTheme } from '@villagekit/ui'

const GRID_SPACING = 40

interface CutMarkerProps {
  cut: number
}

export function CutMarker(props: CutMarkerProps) {
  const { cut } = props

  const cutX = cut * GRID_SPACING
  const cutHeight = GRID_SPACING

  const system = useTheme()
  const labelColor = system.token('colors.primary.400')
  const lineColor = system.token('colors.wood.dark')

  return (
    <>
      <g transform={`translate(0, ${GRID_SPACING})`}>
        <LabelX value={cut} color={labelColor} x={cutX} />
      </g>

      <line
        x1={cutX}
        y1={0}
        x2={cutX}
        y2={cutHeight}
        style={{ stroke: lineColor, strokeWidth: 2 }}
      />
    </>
  )
}
