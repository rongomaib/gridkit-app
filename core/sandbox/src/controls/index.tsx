import '../globals'

import { ParameterControls } from '@villagekit/parameters'
import {
  Box,
  HStack,
  Icon,
  IconButton,
  Tooltip,
  VStack,
  useBreakpointValue,
  useMobileFriendlyTooltip,
} from '@villagekit/ui'
import type React from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FaBorderAll,
  FaCompressAlt,
  FaExpandAlt,
  FaMinus,
  FaPlus,
  FaSlidersH,
  FaSyncAlt,
  FaUndoAlt,
} from 'react-icons/fa'
import screenfull from 'screenfull'
import { AssemblyInfo } from '../assembly'
import type { CameraControlsRef } from '../camera'
import { ControlsContextProvider } from './context'
import { Control } from './control'

export interface SandboxControlsProps {
  shouldAutoRotate: boolean
  onToggleAutoRotate: () => void
  shouldDisplayGrid: boolean
  onToggleDisplayGrid: () => void
  cameraControlsRef: React.MutableRefObject<CameraControlsRef | null>
  containerRef: React.RefObject<HTMLDivElement>
  showParameterControls?: boolean
  alwaysShowFullscreenControls?: boolean
  shouldRenderAssemblyInfo?: boolean
}

export function SandboxControls(props: SandboxControlsProps) {
  const {
    shouldAutoRotate,
    onToggleAutoRotate,
    shouldDisplayGrid,
    onToggleDisplayGrid,
    cameraControlsRef,
    containerRef,
    showParameterControls = false,
    alwaysShowFullscreenControls = false,
    shouldRenderAssemblyInfo = true,
  } = props

  const handleZoomIn = useCallback(() => {
    cameraControlsRef.current?.zoomIn()
  }, [cameraControlsRef])

  const handleZoomOut = useCallback(() => {
    cameraControlsRef.current?.zoomOut()
  }, [cameraControlsRef])

  const handleResetView = useCallback(() => {
    cameraControlsRef.current?.reset()
  }, [cameraControlsRef])

  const orientationMediaQuery = useMemo(() => window.matchMedia('(orientation: landscape)'), [])

  const [isFullscreen, setFullscreen] = useState(false)
  const [isLandscape, setLandscape] = useState(orientationMediaQuery.matches)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(screenfull.element === containerRef.current)
    }

    const handleOrientationChange = (event: MediaQueryListEvent) => {
      setLandscape(event.matches)
    }

    if (screenfull.isEnabled) {
      screenfull.on('change', handleFullscreenChange)
    }

    orientationMediaQuery.addEventListener('change', handleOrientationChange)

    return () => {
      if (screenfull.isEnabled) {
        screenfull.off('change', handleFullscreenChange)
      }

      orientationMediaQuery.removeEventListener('change', handleOrientationChange)
    }
  }, [containerRef, orientationMediaQuery])

  const handleToggleFullscreen = useCallback(() => {
    if (containerRef.current == null || !screenfull.isEnabled) {
      return
    }

    if (screenfull.element !== containerRef.current) {
      void screenfull.request(containerRef.current).then(() => {
        // No screen orientation API on Safari so cannot auto-rotate screen
        // @ts-ignore
        if (screen.orientation !== undefined && typeof screen.orientation.lock === 'function') {
          // @ts-ignore
          void screen.orientation.lock('landscape').catch(() => {})
        }
      })
    } else {
      void screenfull.exit()
    }
  }, [containerRef])

  const isMediumScreen = useBreakpointValue({
    base: false,
    md: true,
  })

  const shouldShowFullscreenControls = isFullscreen || alwaysShowFullscreenControls

  const canShowFullscreenControls = isLandscape || isMediumScreen || alwaysShowFullscreenControls

  const controlMargin = shouldShowFullscreenControls && isMediumScreen ? 4 : 2

  /* eslint-disable sort-keys-fix/sort-keys-fix */
  const controlScale = useBreakpointValue({
    base: 0.65,
    md: 0.75,
    lg: 0.85,
    xl: 1,
  })
  /* eslint-enable sort-keys-fix/sort-keys-fix */

  const { onPointerEnterTooltip, onPointerLeaveTooltip, showTooltip } = useMobileFriendlyTooltip()

  return (
    <ControlsContextProvider controlMargin={controlMargin} controlScale={controlScale || 1}>
      <Control left top>
        <VStack spacing="2">
          <IconButton
            icon={<Icon as={FaPlus} boxSize="4" />}
            variant="toolbar"
            size="sm"
            title="Zoom in"
            onClick={handleZoomIn}
          />

          <IconButton
            icon={<Icon as={FaMinus} boxSize="4" />}
            variant="toolbar"
            size="sm"
            title="Zoom out"
            onClick={handleZoomOut}
          />
        </VStack>
      </Control>

      <Control top>
        <HStack spacing="2">
          <IconButton
            icon={<Icon as={FaSyncAlt} boxSize="4" />}
            variant="toolbar"
            size="sm"
            title="Toggle auto-rotate"
            onClick={onToggleAutoRotate}
            sx={shouldAutoRotate ? {} : { _focus: {}, color: 'gray.400' }}
          />

          <IconButton
            icon={<Icon as={FaBorderAll} boxSize="4" />}
            variant="toolbar"
            size="sm"
            title="Toggle grid"
            onClick={onToggleDisplayGrid}
            sx={shouldDisplayGrid ? {} : { _focus: {}, color: 'gray.400' }}
          />

          <IconButton
            icon={<Icon as={FaUndoAlt} boxSize="4" />}
            variant="toolbar"
            size="sm"
            title="Reset view"
            onClick={handleResetView}
          />
        </HStack>
      </Control>

      {shouldShowFullscreenControls && canShowFullscreenControls && shouldRenderAssemblyInfo && (
        <Control bottom sx={{ minWidth: 'md' }}>
          <AssemblyInfo containerRef={containerRef} />
        </Control>
      )}

      {showParameterControls && (
        <>
          <Control
            right
            top
            sx={{
              display: shouldShowFullscreenControls && canShowFullscreenControls ? 'block' : 'none',
              minWidth: 'xs',
              padding: 4,
            }}
          >
            <ParameterControls containerRef={containerRef} />
          </Control>

          {shouldShowFullscreenControls && !canShowFullscreenControls && (
            <Control right top>
              <Tooltip
                label="Rotate the screen to landscape to view the design controls"
                isOpen={showTooltip}
                portalProps={{ containerRef: containerRef }}
              >
                <Box onPointerEnter={onPointerEnterTooltip} onPointerLeave={onPointerLeaveTooltip}>
                  <IconButton
                    title="Design controls placeholder"
                    icon={<Icon as={FaSlidersH} boxSize="4" />}
                    variant="toolbar"
                    size="sm"
                  />
                </Box>
              </Tooltip>
            </Control>
          )}
        </>
      )}

      {screenfull.isEnabled && (
        <Control bottom right>
          <HStack spacing="2">
            <IconButton
              icon={<Icon as={isFullscreen ? FaCompressAlt : FaExpandAlt} boxSize="4" />}
              variant="toolbar"
              size="sm"
              title={`${isFullscreen ? 'Exit' : 'Enter'} full screen`}
              onClick={handleToggleFullscreen}
            />
          </HStack>
        </Control>
      )}
    </ControlsContextProvider>
  )
}
