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
}

export function SceneryGl(props: SceneryGlProps) {
  const { centerInMeters, gridLengthInMeters, mode, shouldDisplayGrid } = props

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
    </React.Fragment>
  )
}
