import { SvgContextProvider, SizeMarkerX } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'
import type { PartSvgProps } from '@villagekit/part'
import type { Beam120Spec } from './creator'

const GRID_SPACING = 40
const BEAM_GU = 3 // 120 mm = 3 × 40 mm

export function PartSvg({ part, displayUnit }: PartSvgProps<Beam120Spec>) {
  const { lengthInGrids } = part
  const system = useTheme()
  const beamColor = system.token('colors.wood.light')
  const grainColor = system.token('colors.wood.dark')

  const beamWidth = GRID_SPACING * lengthInGrids
  const beamHeight = GRID_SPACING * BEAM_GU
  const sizeInGrids: [number, number] = [lengthInGrids, BEAM_GU]
  const lengthMm = lengthInGrids * 40
  const label = `120×120 × ${lengthMm}mm timber post`

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box css={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${(lengthInGrids + 1) * GRID_SPACING} ${(BEAM_GU + 1) * GRID_SPACING}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{label}</title>
          <rect width={beamWidth} height={beamHeight} style={{ fill: beamColor }} />
          {/* grain lines */}
          {Array.from({ length: Math.floor(lengthInGrids / 3) }, (_, i) => (
            <line
              key={i}
              x1={(i * 3 + 1.5) * GRID_SPACING}
              y1={4}
              x2={(i * 3 + 1.5) * GRID_SPACING}
              y2={beamHeight - 4}
              style={{ stroke: grainColor, strokeWidth: 0.8, opacity: 0.35 }}
            />
          ))}
          <SizeMarkerX sizeInGrids={sizeInGrids} />
        </svg>
      </Box>
    </SvgContextProvider>
  )
}
