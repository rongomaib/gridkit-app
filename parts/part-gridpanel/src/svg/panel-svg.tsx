import { SizeMarkerX, SizeMarkerY } from '@villagekit/part/base/grid'
import { useTheme } from '@villagekit/ui'
import { getEveryHolePosition } from '../helpers'
import type { GridPanelHoles } from '../types'

const GRID_SPACING = 40

interface PanelSvgProps {
  sizeInGrids: [number, number]
  holes?: GridPanelHoles
  showSizeMarker?: boolean
  showShadow?: boolean
  minHolesForSizeMarker?: number
}

export function PanelSvg(props: PanelSvgProps) {
  const {
    sizeInGrids,
    holes = true,
    showSizeMarker = false,
    showShadow = false,
    minHolesForSizeMarker = 0,
  } = props
  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const panelWidth = GRID_SPACING * sizeInGridsX
  const panelHeight = GRID_SPACING * sizeInGridsY

  const { colors } = useTheme()

  const holePositions = holes === true ? getEveryHolePosition(sizeInGrids) : holes

  return (
    <>
      <rect
        width={panelWidth}
        height={panelHeight}
        style={{
          fill: colors.wood.light,
          filter: showShadow ? 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5))' : undefined,
        }}
      />
      {holePositions !== false &&
        holePositions.map(([holeXIndex, holeYIndex]) => (
          <circle
            key={`${holeXIndex}-${holeYIndex}`}
            id={`hole-${holeXIndex}-${holeYIndex}`}
            cx={GRID_SPACING * 0.5 + holeXIndex * GRID_SPACING}
            cy={GRID_SPACING * 0.5 + holeYIndex * GRID_SPACING}
            r={4}
            style={{ fill: colors.wood.dark }}
          />
        ))}

      {showSizeMarker && sizeInGridsX >= minHolesForSizeMarker && (
        <SizeMarkerX sizeInGrids={sizeInGrids} />
      )}
      {showSizeMarker && sizeInGridsY >= minHolesForSizeMarker && (
        <SizeMarkerY sizeInGrids={sizeInGrids} />
      )}
    </>
  )
}
