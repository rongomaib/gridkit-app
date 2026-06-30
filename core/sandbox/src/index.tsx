import './globals'

import { ResizeObserver } from '@juggle/resize-observer'
import { AdaptiveDpr, useDetectGPU } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Box, useDisclosure } from '@villagekit/ui'
import { Perf } from 'r3f-perf'
import type React from 'react'
import { type FunctionComponent, useMemo, useRef } from 'react'
import { type Box3, Vector3 } from 'three'
import { CameraControls, type CameraControlsRef } from './camera/index'
import { SandboxControls } from './controls/index'
import { AppearanceSettingsProvider, useAppearanceSettings } from './scenery/appearance-context'
import { SceneryGl } from './scenery/index'
import { useDefaultSandboxControlSettings, useSaveSandboxControlSettings } from './settings'

export type SandboxMode = 'default' | 'screenshot'
export type SandboxInfoProps = {
  containerRef?: React.RefObject<HTMLDivElement | null>
}

export type SandboxProps = {
  mode?: SandboxMode
  label: string
  boundingBox: Box3
  isDebug?: boolean
  showParamControls?: boolean
  alwaysShowFullscreenControls?: boolean
  shouldDisplayAxes?: boolean
  InfoComponent?: FunctionComponent<SandboxInfoProps>
}

function SandboxInner(props: React.PropsWithChildren<SandboxProps>) {
  const {
    mode = 'default',
    label,
    boundingBox,
    isDebug = false,
    showParamControls = false,
    alwaysShowFullscreenControls = false,
    shouldDisplayAxes = false,
    InfoComponent,
    children,
  } = props

  const maxTiers = 3
  const gpu = useDetectGPU()

  const defaultSandboxControlSettings = useDefaultSandboxControlSettings()

  const { open: shouldAutoRotate, onToggle: onToggleAutoRotate } = useDisclosure({
    defaultOpen: defaultSandboxControlSettings.shouldAutoRotate,
  })

  const { open: shouldDisplayGrid, onToggle: onToggleDisplayGrid } = useDisclosure({
    defaultOpen: defaultSandboxControlSettings.shouldDisplayGrid,
  })

  useSaveSandboxControlSettings(shouldAutoRotate, shouldDisplayGrid)

  const containerRef = useRef<HTMLDivElement>(null)
  const cameraControlsRef = useRef<CameraControlsRef | null>(null)

  const { settings: appearanceSettings, update: updateAppearance } = useAppearanceSettings()

  const gridLengthInMeters = 0.04

  const center: [number, number, number] = useMemo(() => {
    const centerVector = new Vector3()
    boundingBox.getCenter(centerVector)
    return [centerVector.x, centerVector.y, centerVector.z]
  }, [boundingBox])
  const sceneryCenterInMeters: [number, number] = useMemo(() => [center[0], center[1]], [center])

  const floorLengthInGridUnits = useMemo(() => {
    const size = new Vector3()
    boundingBox.getSize(size)
    const maxHorizontal = Math.max(size.x, size.y)
    return Math.max(100, Math.ceil(maxHorizontal / gridLengthInMeters) + 40)
  }, [boundingBox])

  if (gpu == null) return null
  const perfMax = gpu.tier / maxTiers

  return (
    <Box
      id="sandbox-container"
      role="img"
      aria-label={label}
      ref={containerRef}
      css={{
        '&:hover, &:focus-within': {
          '& .sandbox-controls': {
            opacity: 1,
          },
        },

        backgroundColor: mode === 'default' ? '#0d0a08' : 'inherit',
        height: 'full',
        position: mode === 'screenshot' ? 'fixed' : 'relative',
        width: 'full',
      }}
    >
      <Canvas
        id="scene-container"
        gl={{ preserveDrawingBuffer: true }}
        performance={{
          max: perfMax,
        }}
        shadows
        orthographic
        camera={{
          near: -1000,
          far: 1000,
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
        <color attach="background" args={['#0d0a08']} />
        {isDebug && mode !== 'screenshot' && <Perf />}
        <AdaptiveDpr />
        <SceneryGl
          gridLengthInMeters={gridLengthInMeters}
          centerInMeters={sceneryCenterInMeters}
          floorLengthInGridUnits={floorLengthInGridUnits}
          mode={mode}
          shouldDisplayGrid={shouldDisplayGrid}
          shouldDisplayAxes={shouldDisplayAxes}
          appearanceSettings={appearanceSettings}
        />
        <CameraControls
          ref={cameraControlsRef}
          boundingBox={boundingBox}
          mode={mode}
          shouldAutoRotate={shouldAutoRotate}
        />
        {children}
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
          appearanceSettings={appearanceSettings}
          onUpdateAppearance={updateAppearance}
          // NOTE(mw): before, assembly could be null and this was false.
          //             does this still happen?
          // shouldRenderAssemblyInfo={assembly == null}
        />
      )}
    </Box>
  )
}

export function Sandbox(props: React.PropsWithChildren<SandboxProps>) {
  return (
    <AppearanceSettingsProvider>
      <SandboxInner {...props} />
    </AppearanceSettingsProvider>
  )
}
