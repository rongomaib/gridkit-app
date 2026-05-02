import { SizeMarkerX } from '@villagekit/part/base/grid'
import { useTheme } from '@villagekit/ui'
import type React from 'react'
import { useMemo } from 'react'

const GRID_SPACING = 40

interface BeamSvgProps {
  sizeInGrids: number
  x?: number
  showSizeMarker?: boolean
  showShadow?: boolean
  minHolesForSizeMarker?: number
  shouldPadEnds?: boolean
  isGrayscale?: boolean
}

export function BeamSvg(props: BeamSvgProps) {
  const {
    sizeInGrids,
    x = 0,
    showSizeMarker = false,
    showShadow = false,
    minHolesForSizeMarker = 0,
    shouldPadEnds = false,
    isGrayscale = false,
  } = props

  const beamWidth = GRID_SPACING * sizeInGrids
  const beamHeight = GRID_SPACING

  const system = useTheme()
  const grayBeam = system.token('colors.gray.200')
  const grayHole = system.token('colors.gray.600')
  const woodBeam = system.token('colors.wood.light')
  const woodHole = system.token('colors.wood.dark')

  const sizeInGrids2d = useMemo<[number, number]>(() => [sizeInGrids, 1], [sizeInGrids])

  const holes: Array<React.ReactElement> = new Array(sizeInGrids)
  for (let holeIndex = 0; holeIndex < sizeInGrids; holeIndex++) {
    holes[holeIndex] = (
      <circle
        key={holeIndex}
        cy={GRID_SPACING * 0.5}
        cx={GRID_SPACING * 0.5 + holeIndex * GRID_SPACING}
        r={4}
        style={{ fill: isGrayscale ? grayHole : woodHole }}
      />
    )
  }

  return (
    <g transform={`translate(${x}, 0)`}>
      <rect
        width={beamWidth}
        height={beamHeight}
        style={{
          fill: isGrayscale ? grayBeam : woodBeam,
          filter: showShadow ? 'drop-shadow(0 2px 2px rgba(0, 0, 0, 0.5))' : undefined,
        }}
      />

      {holes}

      {showSizeMarker && sizeInGrids >= minHolesForSizeMarker && (
        <SizeMarkerX
          sizeInGrids={sizeInGrids2d}
          shouldPadEnds={shouldPadEnds}
          isGrayscale={isGrayscale}
        />
      )}
    </g>
  )
}
