export * from './context'
export * from './presets'
export * from './values'

import { FormControl, FormLabel, HStack, Switch, VStack } from '@villagekit/ui'
import type React from 'react'
import { useCallback } from 'react'
import { useHasParameters, useSetShowControls, useShowControls } from './context'
import { ParameterControlsInternalContextProvider } from './internal-context'
import { PresetControls } from './presets'
import { ParameterValueControls } from './values'

export interface ParameterControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ParameterControls(props: ParameterControlsProps) {
  const { containerRef } = props

  const hasParameters = useHasParameters()

  if (!hasParameters) return null

  return (
    <ParameterControlsInternalContextProvider containerRef={containerRef}>
      <VStack role="menubar" spacing="4" sx={{ width: '100%' }}>
        <HStack alignItems="baseline" spacing="4" sx={{ width: '100%' }}>
          <PresetControls />

          <ShowControls />
        </HStack>

        <ParameterValueControls />
      </VStack>
    </ParameterControlsInternalContextProvider>
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
