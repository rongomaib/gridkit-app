import { TextLabelX } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'

const GRID_SPACING = 40
const FASTENER_SPACING = 5

interface SummaryFastenerSvgProps {
  boltDiameter: number
  boltLength: number
  nutDiameter: number
  nutLength: number
  extrusionLength: number
  endDiameter: number
  label: string
}

export function SummaryFastenerSvg(props: SummaryFastenerSvgProps) {
  const { boltDiameter, boltLength, nutDiameter, nutLength, extrusionLength, endDiameter, label } =
    props

  const maxWidth = GRID_SPACING * 60

  const { colors } = useTheme()

  const fastenerStyle = { fill: colors.gray[200] }

  return (
    <Box sx={{ width: '100%' }}>
      <svg
        role="img"
        aria-label={label}
        width="100%"
        viewBox={`-4 0 ${maxWidth + GRID_SPACING * 2} ${GRID_SPACING * 2}`}
        xmlns={'http://www.w3.org/2000/svg'}
      >
        <title>{label}</title>
        <g style={{ filter: 'drop-shadow(0 2px 1px rgba(0, 0, 0, 0.25))' }}>
          <rect
            y={GRID_SPACING * 0.5 - endDiameter * 0.5}
            width={extrusionLength}
            height={endDiameter}
            style={fastenerStyle}
          />

          <rect
            y={GRID_SPACING * 0.5 - boltDiameter * 0.5}
            width={boltLength}
            height={boltDiameter}
            style={fastenerStyle}
          />

          <g transform={`translate(${boltLength + FASTENER_SPACING}, 0)`}>
            <rect
              x={nutLength - extrusionLength}
              y={GRID_SPACING * 0.5 - endDiameter * 0.5}
              width={extrusionLength}
              height={endDiameter}
              style={fastenerStyle}
            />

            <rect
              y={GRID_SPACING * 0.5 - nutDiameter * 0.5}
              width={nutLength}
              height={nutDiameter}
              style={fastenerStyle}
            />
          </g>
        </g>

        <g transform={`translate(0, ${GRID_SPACING})`}>
          <TextLabelX text={label} textAnchor="left" color={colors.gray[500]} x={0} />
        </g>
      </svg>
    </Box>
  )
}
