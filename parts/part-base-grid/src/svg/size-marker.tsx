import { useTheme } from '@villagekit/ui'
import { useSvgContext } from './context'
import { LabelX, LabelY } from './label'

const GRID_SPACING = 40
const MARKER_Y_OFFSET = 24
const MARKER_X_OFFSET = 24

interface SizeMarkerProps {
  sizeInGrids: [number, number]
  shouldPadEnds?: boolean
  isGrayscale?: boolean
}

export function SizeMarkerX(props: SizeMarkerProps) {
  const { sizeInGrids, shouldPadEnds = false, isGrayscale = false } = props

  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const { colors } = useTheme()

  const lineStyle = {
    opacity: 0.5,
    stroke: isGrayscale ? colors.gray[400] : colors.accentB[500],
    strokeWidth: 2,
  }

  const { displayUnit } = useSvgContext()

  const markerXPadding = displayUnit === 'mm' ? 42 : 32

  const endPadding = shouldPadEnds ? markerXPadding : 0

  return (
    <g transform={`translate(0, ${sizeInGridsY * GRID_SPACING})`}>
      <line
        x1={endPadding}
        y1={MARKER_Y_OFFSET}
        x2={sizeInGridsX * (GRID_SPACING * 0.5) - markerXPadding}
        y2={MARKER_Y_OFFSET}
        style={lineStyle}
      />

      <LabelX
        value={sizeInGridsX}
        color={isGrayscale ? colors.gray[500] : colors.accentB[500]}
        x={sizeInGridsX * GRID_SPACING * 0.5}
      />

      <line
        x1={sizeInGridsX * (GRID_SPACING * 0.5) + markerXPadding}
        y1={MARKER_Y_OFFSET}
        x2={sizeInGridsX * GRID_SPACING - endPadding}
        y2={MARKER_Y_OFFSET}
        style={lineStyle}
      />
    </g>
  )
}

export function SizeMarkerY(props: SizeMarkerProps) {
  const { sizeInGrids } = props

  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const { colors } = useTheme()

  const lineStyle = {
    opacity: 0.5,
    stroke: colors.accentB[500],
    strokeWidth: 2,
  }

  const markerYPadding = 32

  return (
    <g transform={`translate(${sizeInGridsX * GRID_SPACING}, 0)`}>
      <line
        x1={MARKER_X_OFFSET}
        y1={0}
        x2={MARKER_X_OFFSET}
        y2={sizeInGridsY * (GRID_SPACING * 0.5) - markerYPadding}
        style={lineStyle}
      />

      <LabelY
        value={sizeInGridsY}
        color={colors.accentB[500]}
        y={sizeInGridsY * GRID_SPACING * 0.5}
      />

      <line
        x1={MARKER_X_OFFSET}
        y1={sizeInGridsY * (GRID_SPACING * 0.5) + markerYPadding}
        x2={MARKER_X_OFFSET}
        y2={sizeInGridsY * GRID_SPACING}
        style={lineStyle}
      />
    </g>
  )
}
