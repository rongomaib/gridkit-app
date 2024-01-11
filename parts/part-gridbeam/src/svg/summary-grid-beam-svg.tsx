import { SvgContextProvider } from '@villagekit/part-base-grid'
import { Box } from '@villagekit/ui'

import { BeamSvg } from './beam-svg'

const GRID_SPACING = 40

interface SummaryGridBeamSvgProps {
  sizeInGrids: number
  displayUnit?: 'gu' | 'mm'
}

export function SummaryGridBeamSvg(props: SummaryGridBeamSvgProps) {
  const { sizeInGrids, displayUnit = 'gu' } = props

  const beamHeight = GRID_SPACING
  const maxBeamWidth = GRID_SPACING * 60

  const label = `${sizeInGrids} unit grid beam`

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box sx={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${maxBeamWidth + GRID_SPACING * 2} ${beamHeight + GRID_SPACING}`}
          xmlns={'http://www.w3.org/2000/svg'}
        >
          <title>{label}</title>
          <BeamSvg sizeInGrids={sizeInGrids} showSizeMarker showShadow />
        </svg>
      </Box>
    </SvgContextProvider>
  )
}
