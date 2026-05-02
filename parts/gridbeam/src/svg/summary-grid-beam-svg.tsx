import { SvgContextProvider } from '@villagekit/part/base/grid'
import { Box } from '@villagekit/ui'
import type { GridBeamSpec } from '../creator'
import { BeamSvg } from './beam-svg'

const GRID_SPACING = 40

interface SummaryGridBeamSvgProps {
  part: GridBeamSpec
  displayUnit?: 'gu' | 'mm'
}

export function SummaryGridBeamSvg(props: SummaryGridBeamSvgProps) {
  const { part, displayUnit = 'gu' } = props
  const { lengthInGrids } = part

  const label = `${lengthInGrids} unit grid beam`

  return (
    <SvgContextProvider displayUnit={displayUnit}>
      <Box css={{ width: '100%' }}>
        <svg
          role="img"
          aria-label={label}
          width="100%"
          viewBox={`-4 0 ${62 * GRID_SPACING} ${2 * GRID_SPACING}`}
          xmlns={'http://www.w3.org/2000/svg'}
        >
          <title>{label}</title>
          <BeamSvg sizeInGrids={lengthInGrids} showSizeMarker showShadow />
        </svg>
      </Box>
    </SvgContextProvider>
  )
}
