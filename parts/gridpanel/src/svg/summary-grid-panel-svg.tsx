import { SvgContextProvider } from '@villagekit/part/base/grid'
import { Box } from '@villagekit/ui'
import { useMemo } from 'react'
import type { GridPanelHoles } from '../types'
import { PanelSvg } from './panel-svg'

const GRID_SPACING = 40

interface SummaryGridPanelSvgProps {
  sizeInGrids: [number, number]
  holes?: GridPanelHoles
  displayUnit?: 'gu' | 'mm'
}

export function SummaryGridPanelSvg(props: SummaryGridPanelSvgProps) {
  const { sizeInGrids, holes, displayUnit = 'gu' } = props
  const [sizeInGridsX, sizeInGridsY] = sizeInGrids

  const maxPanelWidth = GRID_SPACING * 60
  const panelHeight = GRID_SPACING * sizeInGridsY

  const label = useMemo(
    () =>
      displayUnit === 'gu'
        ? `${sizeInGridsX} by ${sizeInGridsY} unit grid panel`
        : `${sizeInGridsX * GRID_SPACING} by ${sizeInGridsY * GRID_SPACING} mm grid panel`,
    [displayUnit, sizeInGridsX, sizeInGridsY],
  )

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box sx={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${maxPanelWidth + GRID_SPACING * 2} ${panelHeight + GRID_SPACING}`}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>{label}</title>
          <PanelSvg sizeInGrids={sizeInGrids} holes={holes} showSizeMarker showShadow />
        </svg>
      </Box>
    </SvgContextProvider>
  )
}
