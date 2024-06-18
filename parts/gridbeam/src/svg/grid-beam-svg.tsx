import { BeamSvg } from './beam-svg'

const GRID_SPACING = 40

interface GridBeamSvgProps {
  sizeInGrids: number
}

export function GridBeamSvg(props: GridBeamSvgProps) {
  const { sizeInGrids } = props

  const beamWidth = GRID_SPACING * sizeInGrids
  const beamHeight = GRID_SPACING

  const label = `${sizeInGrids} unit grid beam`

  return (
    <svg
      width={`${beamWidth}mm`}
      height={`${beamHeight}mm`}
      viewBox={`0 0 ${beamWidth} ${beamHeight}`}
      xmlns={'http://www.w3.org/2000/svg'}
    >
      <title>{label}</title>
      <BeamSvg sizeInGrids={sizeInGrids} />
    </svg>
  )
}
