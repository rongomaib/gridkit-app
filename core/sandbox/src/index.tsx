import './globals'

import { ResizeObserver } from '@juggle/resize-observer'
import { AdaptiveDpr, useContextBridge, useDetectGPU } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Box, useDisclosure } from '@villagekit/ui'
import { Perf } from 'r3f-perf'
import type React from 'react'
import { type FunctionComponent, useMemo, useRef } from 'react'
import { type Box3, Vector3 } from 'three'
import { CameraControls, type CameraControlsRef } from './camera/index'
import { SandboxControls } from './controls/index'
import { SceneryGl } from './scenery/index'
import { useDefaultSandboxControlSettings, useSaveSandboxControlSettings } from './settings'

export type SandboxMode = 'default' | 'screenshot'
export type SandboxInfoProps = {
  containerRef?: React.RefObject<HTMLDivElement>
}

export type SandboxProps = {
  mode?: SandboxMode
  label: string
  boundingBox: Box3
  isDebug?: boolean
  showParamControls?: boolean
  alwaysShowFullscreenControls?: boolean
  shouldDisplayAxes?: boolean
  bridgeContexts?: Array<React.Context<any>>
  InfoComponent?: FunctionComponent<SandboxInfoProps>
}

export function Sandbox(props: React.PropsWithChildren<SandboxProps>) {
  const {
    mode = 'default',
    label,
    boundingBox,
    isDebug = false,
    showParamControls = false,
    alwaysShowFullscreenControls = false,
    shouldDisplayAxes = false,
    bridgeContexts = [],
    InfoComponent,
    children,
  } = props

  const maxTiers = 3
  const gpu = useDetectGPU()

  const defaultSandboxControlSettings = useDefaultSandboxControlSettings()

  const { isOpen: shouldAutoRotate, onToggle: onToggleAutoRotate } = useDisclosure({
    defaultIsOpen: defaultSandboxControlSettings.shouldAutoRotate,
  })

  const { isOpen: shouldDisplayGrid, onToggle: onToggleDisplayGrid } = useDisclosure({
    defaultIsOpen: defaultSandboxControlSettings.shouldDisplayGrid,
  })

  useSaveSandboxControlSettings(shouldAutoRotate, shouldDisplayGrid)

  const containerRef = useRef<HTMLDivElement>(null)
  const cameraControlsRef = useRef<CameraControlsRef | null>(null)

  const ContextBridge = useContextBridge(...bridgeContexts)

  const gridLengthInMeters = 0.04

  const center: [number, number, number] = useMemo(() => {
    const centerVector = new Vector3()
    boundingBox.getCenter(centerVector)
    return [centerVector.x, centerVector.y, centerVector.z]
  }, [boundingBox])
  const sceneryCenterInMeters: [number, number] = useMemo(() => [center[0], center[1]], [center])

  if (gpu == null) return null
  const perfMax = gpu.tier / maxTiers

  return (
    <Box
      id="sandbox-container"
      role="img"
      aria-label={label}
      ref={containerRef}
      sx={{
        ':hover, :focus-within': {
          '.sandbox-controls': {
            opacity: 1,
          },
        },

        backgroundColor: mode === 'default' ? 'gray.50' : 'inherit',
        height: 'full',
        position: mode === 'screenshot' ? 'fixed' : 'relative',
        width: 'full',
      }}
    >
      <Canvas
        id="scene-container"
        performance={{
          max: perfMax,
        }}
        shadows
        orthographic
        camera={{
          near: 0.01,
        }}
        raycaster={{
          // @ts-ignore
          params: {
            Line: {
              threshold: 0.005,
            },
          },
        }}
        resize={{ polyfill: ResizeObserver }}
      >
        <ContextBridge>
          {isDebug && mode !== 'screenshot' && <Perf />}
          <AdaptiveDpr />
          <SceneryGl
            gridLengthInMeters={gridLengthInMeters}
            centerInMeters={sceneryCenterInMeters}
            mode={mode}
            shouldDisplayGrid={shouldDisplayGrid}
            shouldDisplayAxes={shouldDisplayAxes}
          />
          <CameraControls
            ref={cameraControlsRef}
            boundingBox={boundingBox}
            mode={mode}
            shouldAutoRotate={shouldAutoRotate}
          />
          {children}
        </ContextBridge>
      </Canvas>

      {mode === 'default' && (
        <SandboxControls
          shouldAutoRotate={shouldAutoRotate}
          onToggleAutoRotate={onToggleAutoRotate}
          shouldDisplayGrid={shouldDisplayGrid}
          onToggleDisplayGrid={onToggleDisplayGrid}
          cameraControlsRef={cameraControlsRef}
          containerRef={containerRef}
          showParamControls={showParamControls}
          alwaysShowFullscreenControls={alwaysShowFullscreenControls}
          InfoComponent={InfoComponent}
          // NOTE(mw): before, assembly could be null and this was false.
          //             does this still happen?
          // shouldRenderAssemblyInfo={assembly == null}
        />
      )}
    </Box>
  )
}
