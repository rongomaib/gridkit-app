import { useThree } from '@react-three/fiber'
import { Fragment, memo, useEffect, useMemo, useRef } from 'react'
import type { DirectionalLight } from 'three'
import type { AppearanceSettings } from './appearance-context'

const LIGHT_RADIUS = 20

// Scene is Z-up (floor is CircleGeometry in XY plane, no rotation).
// Azimuth orbits around Z in the XY ground plane; elevation lifts toward +Z.
function sphericalToCartesian(azimuthDeg: number, elevationDeg: number): [number, number, number] {
  const az = (azimuthDeg * Math.PI) / 180
  const el = (elevationDeg * Math.PI) / 180
  return [
    LIGHT_RADIUS * Math.cos(el) * Math.cos(az),  // X
    LIGHT_RADIUS * Math.cos(el) * Math.sin(az),  // Y
    LIGHT_RADIUS * Math.sin(el),                  // Z = up
  ]
}

export interface LightsProps {
  shadows: false | { size: number }
  appearanceSettings: AppearanceSettings
}

export default memo(Lights)

function Lights(props: LightsProps) {
  const { shadows, appearanceSettings } = props
  const { scene } = useThree()

  const keyLightPosition = useMemo(
    () => sphericalToCartesian(appearanceSettings.keyLightAzimuth, appearanceSettings.keyLightElevation),
    [appearanceSettings.keyLightAzimuth, appearanceSettings.keyLightElevation],
  )

  const keyLightRef = useRef<DirectionalLight>(null)

  // DirectionalLight.target must be in the scene for shadow direction to update
  useEffect(() => {
    const light = keyLightRef.current
    if (!light) return
    scene.add(light.target)
    return () => { scene.remove(light.target) }
  }, [scene])

  // Refresh shadow when position changes
  useEffect(() => {
    const light = keyLightRef.current
    if (!light) return
    light.position.set(...keyLightPosition)
    light.target.position.set(0, 0, 0)
    light.target.updateMatrixWorld()
    light.shadow.needsUpdate = true
  }, [keyLightPosition])

  const shadowProps = useMemo(() => {
    if (!shadows) return {}
    const cameraSize = 20
    return {
      castShadow: true,
      'shadow-bias': -0.0001,
      'shadow-camera-near': 0.1,
      'shadow-camera-far': 100,
      'shadow-camera-bottom': -cameraSize,
      'shadow-camera-left': -cameraSize,
      'shadow-camera-right': cameraSize,
      'shadow-camera-top': cameraSize,
      'shadow-mapSize-height': shadows.size,
      'shadow-mapSize-width': shadows.size,
    }
  }, [shadows])

  return (
    <Fragment>
      {appearanceSettings.ambientIntensity > 0 && (
        <ambientLight intensity={appearanceSettings.ambientIntensity} />
      )}

      <directionalLight
        ref={keyLightRef}
        color={appearanceSettings.keyLightColor}
        intensity={appearanceSettings.keyLightIntensity}
        position={keyLightPosition}
        {...shadowProps}
      />
    </Fragment>
  )
}
