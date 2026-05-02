export * from './context'
export * from './presets/index'
export * from './values/index'

import { Field, FormLabel, HStack, Switch, VStack } from '@villagekit/ui'
import type React from 'react'
import { useCallback } from 'react'
import { useHasParams, useSetShowControls, useShowControls } from './context'
import { ParamControlsInternalContextProvider } from './internal-context'
import { PresetControls } from './presets/index'
import { ParamValueControls } from './values/index'

export interface ParamControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ParamControls(props: ParamControlsProps) {
  const { containerRef } = props

  const hasParams = useHasParams()

  if (!hasParams) return null

  return (
    <ParamControlsInternalContextProvider containerRef={containerRef}>
      <VStack role="menubar" gap="4" css={{ width: '100%' }}>
        <HStack alignItems="baseline" gap="4" css={{ width: '100%' }}>
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

  const handleCheckedChange = useCallback(
    (details: { checked: boolean }) => {
      setShowControls(details.checked)
    },
    [setShowControls],
  )

  return (
    <Field.Root css={{ flex: 0 }}>
      <FormLabel htmlFor="show-controls">Controls</FormLabel>

      <Switch.Root
        id="show-controls"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={showControls}
        checked={showControls}
        onCheckedChange={handleCheckedChange}
        css={{ marginTop: 2.5 }}
      >
        <Switch.HiddenInput />
        <Switch.Control>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Root>
    </Field.Root>
  )
}
