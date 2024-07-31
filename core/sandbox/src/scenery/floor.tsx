import type { ReactThreeFiber } from '@react-three/fiber'
import { useMemo } from 'react'
import { Color, Vector2, Vector3 } from 'three'
import { Grid } from './grid'

export interface FloorProps {
  gridLengthInMeters?: number
  centerInMeters?: ReactThreeFiber.Vector2
  lengthInGridUnits?: number
  shouldDisplayGrid?: boolean
}

export default Floor

function Floor(props: FloorProps) {
  const {
    gridLengthInMeters = 0.04,
    centerInMeters = [0, 0],
    lengthInGridUnits = 50,
    shouldDisplayGrid = true,
  } = props

  const floorLength = useMemo(() => {
    return gridLengthInMeters * lengthInGridUnits
  }, [gridLengthInMeters, lengthInGridUnits])

  const center = useMemo(() => {
    const vector: Vector2 = (centerInMeters as Vector2).isVector2
      ? (centerInMeters as Vector2)
      : new Vector2(...(centerInMeters as Array<number>))
    // quantize to grid units
    vector.divideScalar(gridLengthInMeters).floor().multiplyScalar(gridLengthInMeters)
    return vector
  }, [gridLengthInMeters, centerInMeters])

  const position = useMemo(() => {
    return new Vector3(
      center.x - 0.5 * gridLengthInMeters,
      center.y - 0.5 * gridLengthInMeters,
      -0.5 * gridLengthInMeters,
    )
  }, [center, gridLengthInMeters])

  return (
    <group name="floor" position={position}>
      {shouldDisplayGrid && (
        <Grid
          axisLength={floorLength}
          smallSize={gridLengthInMeters}
          largeSize={gridLengthInMeters * 10}
          color={new Color('#d9e0e8')}
          // render before shadow floor
          renderOrder={1}
        />
      )}
      <FloorShadow floorLength={floorLength} />
    </group>
  )
}

function FloorShadow({ floorLength }: { floorLength: number }) {
  return (
    <mesh
      receiveShadow
      // render after grid
      renderOrder={2}
    >
      <shadowMaterial
        args={[{ opacity: 0.5 }]}
        // depthWrite needed for z-fighting with grid
        depthWrite={false}
      />
      <planeGeometry args={[2 * floorLength, 2 * floorLength]} />
    </mesh>
  )
}
