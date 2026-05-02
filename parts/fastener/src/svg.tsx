import { TextLabelX } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'
import type { FastenerSpec } from './creator'
import { fastenerVariants } from './variants'

const GRID_SPACING = 40
const FASTENER_SPACING = 5

interface FastenerSvgProps {
  part: FastenerSpec
}

export function FastenerSvg(props: FastenerSvgProps) {
  const { part } = props
  const { variantId } = part
  const variant = fastenerVariants[variantId]!
  const {
    boltDiameter,
    boltLabel,
    boltLength,
    endDiameter,
    extrusionLength,
    nutDiameter,
    nutLength,
  } = variant

  // TODO: would be great to have some formatting functions for util-units
  const boltsLabel = boltLabel
  const nutsLabel = 'nut'
  const label = `${boltLength.value}${boltLength.unit.symbol} ${boltsLabel} + ${nutLength.value}${nutLength.unit.symbol} ${nutsLabel}`

  return (
    <Box css={{ width: '100%' }}>
      <svg
        role="img"
        aria-label={label}
        width="100%"
        viewBox={`-4 0 ${62 * GRID_SPACING} ${2 * GRID_SPACING}`}
        xmlns={'http://www.w3.org/2000/svg'}
      >
        <title>{label}</title>
        <FastenerSvgContent
          boltDiameter={boltDiameter.value}
          boltLength={boltLength.value}
          nutDiameter={nutDiameter.value}
          nutLength={nutLength.value}
          extrusionLength={extrusionLength.value}
          endDiameter={endDiameter.value}
          label={label}
        />
      </svg>
    </Box>
  )
}

type FastenerSvgContentProps = {
  boltDiameter: number
  boltLength: number
  nutDiameter: number
  nutLength: number
  extrusionLength: number
  endDiameter: number
  label: string
}

function FastenerSvgContent(props: FastenerSvgContentProps) {
  const { boltDiameter, boltLength, endDiameter, extrusionLength, nutDiameter, nutLength, label } =
    props

  const system = useTheme()
  const fastenerColor = system.token('colors.gray.200')
  const labelColor = system.token('colors.gray.500')
  const fastenerStyle = { fill: fastenerColor }

  return (
    <>
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
        <TextLabelX text={label} textAnchor="start" color={labelColor} x={0} />
      </g>
    </>
  )
}
