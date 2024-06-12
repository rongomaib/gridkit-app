import { GizmoHelper, GizmoViewport } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import React, { useMemo } from 'react'
import type { SandboxMode } from '../'
import Floor from './floor'
import Lights from './lights'

interface SceneryGlProps {
  centerInMeters: [number, number]
  gridLengthInMeters: number
  mode: SandboxMode
  shouldDisplayGrid: boolean
  shouldDisplayAxes: boolean
}

export function SceneryGl(props: SceneryGlProps) {
  const { centerInMeters, gridLengthInMeters, mode, shouldDisplayGrid, shouldDisplayAxes } = props

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
      <Lights {...lights} />
      <Floor
        {...floor}
        centerInMeters={centerInMeters}
        gridLengthInMeters={gridLengthInMeters}
        shouldDisplayGrid={shouldDisplayGrid && mode !== 'screenshot'}
      />
      {shouldDisplayAxes && mode !== 'screenshot' && (
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#9d4b4b', '#2f7f4f', '#3b5b9d']} labelColor="white" />
        </GizmoHelper>
      )}
    </React.Fragment>
  )
}
