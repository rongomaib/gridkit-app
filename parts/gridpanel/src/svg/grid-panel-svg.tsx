import type { GridPanelHoles } from '../types'
import { PanelSvg } from './panel-svg'

const GRID_SPACING = 40

interface GridPanelSvgProps {
  sizeInGrids: [number, number]
  holes?: GridPanelHoles
}

export function GridPanelSvg(props: GridPanelSvgProps) {
  const { sizeInGrids, holes } = props
  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const panelWidth = GRID_SPACING * sizeInGridsX
  const panelHeight = GRID_SPACING * sizeInGridsY

  const label = `${sizeInGridsX} by ${sizeInGridsY} unit grid panel`

  return (
    <svg
      width={`${panelWidth}mm`}
      height={`${panelHeight}mm`}
      viewBox={`0 0 ${panelWidth} ${panelHeight}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{label}</title>
      <PanelSvg sizeInGrids={sizeInGrids} holes={holes} />
    </svg>
  )
}
