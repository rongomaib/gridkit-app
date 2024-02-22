import './globals'

import { ResizeObserver } from '@juggle/resize-observer'
import { AdaptiveDpr, useContextBridge, useDetectGPU } from '@react-three/drei'
import { Canvas, RootState } from '@react-three/fiber'
import { DesignContext, useDesignContext } from '@villagekit/design'
import { Box, useDisclosure } from '@villagekit/ui'
import { Perf } from 'r3f-perf'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { ACESFilmicToneMapping, Box3, PCFSoftShadowMap, sRGBEncoding, Vector3 } from 'three'

import { AssemblyGl } from './assembly'
import { CameraControls, CameraControlsRef } from './camera'
import { SandboxControls } from './controls'
import { SceneryGl } from './scenery'
import { useDefaultSandboxControlSettings, useSaveSandboxControlSettings } from './settings'

export { AssemblyInfo, AssemblySummary } from './assembly'

export type SandboxMode = 'default' | 'screenshot'

export interface SandboxProps {
  scale?: number
  mode?: SandboxMode
  isDebug?: boolean
  showParameterControls?: boolean
  alwaysShowFullscreenControls?: boolean
}

export function Sandbox(props: SandboxProps) {
  const designContext = useDesignContext()

  if (designContext == null) {
    throw new Error('Missing design context!')
  }

  return <SandboxWithAssemblyProvider {...props} />
}

function SandboxWithAssemblyProvider(props: Omit<SandboxProps, 'model'>) {
  const {
    scale,
    mode = 'default',
    isDebug = false,
    showParameterControls = false,
    alwaysShowFullscreenControls = false,
  } = props

  const { meta } = useDesignContext()

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

  const ContextBridge = useContextBridge(DesignContext)

  const onCanvasCreated = useCallback((state: RootState) => {
    state.gl.toneMapping = ACESFilmicToneMapping
    state.gl.outputEncoding = sRGBEncoding
  }, [])

  if (gpu == null) return null
  const perfMax = gpu.tier / maxTiers

  return (
    <Box
      id="sandbox-container"
      role="img"
      aria-label={meta.label}
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
        onCreated={onCanvasCreated}
        shadows={{ type: PCFSoftShadowMap }}
        orthographic
        camera={{
          near: 0.01,
        }}
        raycaster={{
          params: {
            Line: {
              threshold: 0.005,
            },
          },
        }}
        resize={{ polyfill: ResizeObserver }}
      >
        <ContextBridge>
          <ContainerGl mode={mode} isDebug={isDebug}>
            {meta != null && (
              <ContentGl
                scale={scale}
                mode={mode}
                shouldAutoRotate={shouldAutoRotate}
                shouldDisplayGrid={shouldDisplayGrid}
                cameraControlsRef={cameraControlsRef}
              />
            )}
          </ContainerGl>
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
          showParameterControls={showParameterControls}
          alwaysShowFullscreenControls={alwaysShowFullscreenControls}
          // NOTE(mw): before, assembly could be null and this was false.
          //             does this still happen?
          // shouldRenderAssemblyInfo={assembly == null}
        />
      )}
    </Box>
  )
}

interface ContainerGlProps {
  children: React.ReactNode | Array<React.ReactNode>
  mode: SandboxMode
  isDebug: boolean
}

function ContainerGl(props: ContainerGlProps) {
  const { children, mode, isDebug } = props

  return (
    <>
      {isDebug && mode !== 'screenshot' && <Perf />}
      <AdaptiveDpr />
      {children}
    </>
  )
}

interface ContentGlProps {
  scale?: number
  mode: SandboxMode
  shouldAutoRotate: boolean
  shouldDisplayGrid: boolean
  cameraControlsRef: React.MutableRefObject<CameraControlsRef | null>
}

function ContentGl(props: ContentGlProps) {
  const { scale = 1, mode, shouldAutoRotate, shouldDisplayGrid, cameraControlsRef } = props

  const gridLengthInMeters = 0.04

  const [boundingBox, setBoundingBox] = useState<Box3>(new Box3())
  const center: [number, number, number] = useMemo(() => {
    const centerVector = new Vector3()
    boundingBox.getCenter(centerVector)
    return [centerVector.x, centerVector.y, centerVector.z]
  }, [boundingBox])
  const sceneryCenterInMeters: [number, number] = useMemo(() => [center[0], center[1]], [center])

  const handleBoundingBoxChange = useCallback(
    (nextBoundingBox: Box3) => {
      const scaledBoundingBox = new Box3(
        nextBoundingBox.min.multiplyScalar(scale),
        nextBoundingBox.max.multiplyScalar(scale),
      )
      setBoundingBox(scaledBoundingBox)
    },
    [scale],
  )

  return (
    <>
      <SceneryGl
        gridLengthInMeters={gridLengthInMeters}
        centerInMeters={sceneryCenterInMeters}
        mode={mode}
        shouldDisplayGrid={shouldDisplayGrid}
      />
      <CameraControls
        ref={cameraControlsRef}
        boundingBox={boundingBox}
        mode={mode}
        shouldAutoRotate={shouldAutoRotate}
      />
      <group scale={scale}>
        <AssemblyGl setBoundingBox={handleBoundingBoxChange} />
      </group>
    </>
  )
}
