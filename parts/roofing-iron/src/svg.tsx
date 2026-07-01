import { SvgContextProvider, SizeMarkerX, SizeMarkerY } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'
import type { PartSvgProps } from '@villagekit/part'
import type { RoofingIronSpec } from './creator'

const GRID_SPACING = 40

export function PartSvg({ part, displayUnit }: PartSvgProps<RoofingIronSpec>) {
  const { widthInGrids, slopedLengthGu, pitchDeg } = part
  const system = useTheme()
  const sheetColor = system.token('colors.gray.200')
  const ribColor = system.token('colors.gray.400')
  const accentColor = system.token('colors.accentB.500')

  const sheetWidth = GRID_SPACING * widthInGrids
  const sheetHeight = GRID_SPACING * slopedLengthGu
  const sizeInGrids: [number, number] = [widthInGrids, slopedLengthGu]
  const widthMm = widthInGrids * 40
  const lengthMm = Math.round(slopedLengthGu * 40)
  const label = `${widthMm}×${lengthMm}mm roofing iron (${pitchDeg}°)`

  // corrugation ribs — one every ~150 mm (3.75 gu), drawn as thin vertical stripes
  const ribSpacingGu = 3.75
  const ribs: React.ReactNode[] = []
  for (let x = ribSpacingGu; x < widthInGrids; x += ribSpacingGu) {
    ribs.push(
      <line
        key={x}
        x1={x * GRID_SPACING}
        y1={0}
        x2={x * GRID_SPACING}
        y2={sheetHeight}
        style={{ stroke: ribColor, strokeWidth: 2, opacity: 0.4 }}
      />,
    )
  }

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box css={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${(widthInGrids + 1) * GRID_SPACING} ${(slopedLengthGu + 1) * GRID_SPACING}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{label}</title>
          <rect width={sheetWidth} height={sheetHeight} style={{ fill: sheetColor }} />
          {ribs}
          <text
            x={sheetWidth / 2}
            y={sheetHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{ fill: accentColor, fontSize: GRID_SPACING * 2, opacity: 0.5, fontWeight: 'bold' }}
          >
            {pitchDeg}°
          </text>
          <SizeMarkerX sizeInGrids={sizeInGrids} />
          <SizeMarkerY sizeInGrids={sizeInGrids} />
        </svg>
      </Box>
    </SvgContextProvider>
  )
}
