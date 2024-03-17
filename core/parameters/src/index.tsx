export * from './context'
export * from './presets'
export * from './values'

import { FormControl, FormLabel, HStack, Switch, VStack } from '@villagekit/ui'
import type React from 'react'
import { useCallback } from 'react'
import { useHasParams, useSetShowControls, useShowControls } from './context'
import { ParamControlsInternalContextProvider } from './internal-context'
import { PresetControls } from './presets'
import { ParamValueControls } from './values'

export interface ParamControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ParamControls(props: ParamControlsProps) {
  const { containerRef } = props

  const hasParams = useHasParams()

  if (!hasParams) return null

  return (
    <ParamControlsInternalContextProvider containerRef={containerRef}>
      <VStack role="menubar" spacing="4" sx={{ width: '100%' }}>
        <HStack alignItems="baseline" spacing="4" sx={{ width: '100%' }}>
          <PresetControls />

          <ShowControls />
        </HStack>

        <ParamValueControls />
      </VStack>
    </ParamControlsInternalContextProvider>
  )
}

function ShowControls() {
  const showControls = useShowControls()
  const setShowControls = useSetShowControls()

  const handleShowControlsChange = useCallback(
    (ev: React.ChangeEvent<HTMLInputElement>) => {
      setShowControls(ev.target.checked)
    },
    [setShowControls],
  )

  return (
    <FormControl sx={{ flex: 0 }}>
      <FormLabel htmlFor="show-controls">Controls</FormLabel>

      <Switch
        id="show-controls"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={showControls}
        isChecked={showControls}
        onChange={handleShowControlsChange}
        sx={{ marginTop: 2.5 }}
      />
    </FormControl>
  )
}
