import { SvgContextProvider, SizeMarkerX, SizeMarkerY } from '@villagekit/part/base/grid'
import { Box, useTheme } from '@villagekit/ui'
import type { PartSvgProps } from '@villagekit/part'
import type { RoofPanelSpec } from './creator'

const GRID_SPACING = 40

export function PartSvg({ part, displayUnit }: PartSvgProps<RoofPanelSpec>) {
  const { widthInGrids, lengthInGrids, pitchDeg } = part
  const system = useTheme()
  const panelColor = system.token('colors.wood.light')
  const lineColor = system.token('colors.wood.dark')
  const accentColor = system.token('colors.accentB.500')

  const panelWidth = GRID_SPACING * widthInGrids
  const panelHeight = GRID_SPACING * lengthInGrids
  const sizeInGrids: [number, number] = [widthInGrids, lengthInGrids]
  const widthMm = widthInGrids * 40
  const lengthMm = Math.round(lengthInGrids * 40)
  const label = `${widthMm}×${lengthMm}mm roof panel (${pitchDeg}°)`

  // framing lines at every 5 gu along the length
  const framingLines: React.ReactNode[] = []
  for (let y = 5; y < lengthInGrids; y += 5) {
    framingLines.push(
      <line
        key={y}
        x1={0}
        y1={y * GRID_SPACING}
        x2={panelWidth}
        y2={y * GRID_SPACING}
        style={{ stroke: lineColor, strokeWidth: 0.8, opacity: 0.3 }}
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
          viewBox={`-4 0 ${(widthInGrids + 1) * GRID_SPACING} ${(lengthInGrids + 1) * GRID_SPACING}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{label}</title>
          <rect width={panelWidth} height={panelHeight} style={{ fill: panelColor }} />
          {framingLines}
          <text
            x={panelWidth / 2}
            y={panelHeight / 2}
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
