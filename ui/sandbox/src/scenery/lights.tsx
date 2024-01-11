import { Fragment, memo, useMemo } from 'react'
import { Color } from 'three'

export interface LightsProps {
  shadows:
    | false
    | {
        size: number
      }
}

export default memo(Lights)

function Lights(props: LightsProps) {
  const { shadows } = props

  const shadowProps = useMemo(() => {
    if (!shadows) return {}

    const cameraSize = 5

    return {
      castShadow: true,
      'shadow-bias': -0.000001,
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
      <ambientLight intensity={0.1} />
      <hemisphereLight
        color={new Color(0xb1e1ff)}
        groundColor={new Color(0xb97a20)}
        intensity={0.2}
      />
      <directionalLight
        intensity={0.5}
        position={[10, 30, 50]}
        {...shadowProps}
        onUpdate={(self) => {
          if (self.shadow.map != null) {
            // @ts-ignore
            self.shadow.map.dispose()
            // @ts-ignore
            self.shadow.map = null
          }
        }}
      />
    </Fragment>
  )
}
