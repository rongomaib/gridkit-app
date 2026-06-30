import { Environment, GizmoHelper, GizmoViewport, SoftShadows } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React, { useMemo } from 'react'
import type { SandboxMode } from '../'
import type { AppearanceSettings } from './appearance-context'
import { SceneEffects } from './effects'
import Floor from './floor'
import Lights from './lights'

interface SceneryGlProps {
  centerInMeters: [number, number]
  gridLengthInMeters: number
  floorLengthInGridUnits: number
  mode: SandboxMode
  shouldDisplayGrid: boolean
  shouldDisplayAxes: boolean
  appearanceSettings: AppearanceSettings
}

export function SceneryGl(props: SceneryGlProps) {
  const {
    centerInMeters,
    gridLengthInMeters,
    floorLengthInGridUnits,
    mode,
    shouldDisplayGrid,
    shouldDisplayAxes,
    appearanceSettings,
  } = props

  const performance = useThree((state) => state.performance.current)

  const lights = useMemo(() => {
    switch (true) {
      case mode === 'screenshot':
        return {
          shadows: {
            size: 8192,
          },
        }
      case performance > 0.99:
        return {
          shadows: {
            size: 4096,
          },
        }
      case performance > 0.95:
        return {
          shadows: {
            size: 2048,
          },
        }
      case performance > 0.8:
        return {
          shadows: {
            size: 1024,
          },
        }
      case performance > 0.6:
        return {
          shadows: {
            size: 512,
          },
        }
      default:
        return {
          shadows: false as const,
        }
    }
  }, [mode, performance])

  const floor = useMemo(() => {
    return {}
  }, [])

  return (
    <React.Fragment>
      <SoftShadows size={appearanceSettings.shadowSize} samples={appearanceSettings.shadowSamples} focus={0} />
      <Environment preset={appearanceSettings.environmentPreset} background={false} environmentIntensity={appearanceSettings.environmentIntensity} />
      <Lights {...lights} appearanceSettings={appearanceSettings} />
      <Floor
        {...floor}
        centerInMeters={centerInMeters}
        gridLengthInMeters={gridLengthInMeters}
        lengthInGridUnits={floorLengthInGridUnits}
        shouldDisplayGrid={shouldDisplayGrid && mode !== 'screenshot'}
      />
      {shouldDisplayAxes && mode !== 'screenshot' && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
        </GizmoHelper>
      )}
      <SceneEffects appearanceSettings={appearanceSettings} />
    </React.Fragment>
  )
}
