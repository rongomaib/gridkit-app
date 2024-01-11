export * from './context'
export * from './presets'
export * from './values'

import { FormControl, FormLabel, HStack, Switch, VStack } from '@villagekit/ui'
import React from 'react'

import { useParameterControlsContext } from './context'
import { ParameterControlsInternalContextProvider } from './internal-context'
import { PresetControls } from './presets'
import { ParameterValueControls } from './values'

export interface ParameterControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ParameterControls(props: ParameterControlsProps) {
  const { containerRef } = props

  const {
    parameters,
    presets,
    currentPresetId,
    currentValues,
    showControls,
    handleSetShowControls,
    handlePresetChange,
    handleCustomValuesChange,
  } = useParameterControlsContext()

  return (
    <ParameterControlsInternalContextProvider containerRef={containerRef}>
      <VStack role="menubar" spacing="4" sx={{ width: '100%' }}>
        <HStack alignItems="baseline" spacing="4" sx={{ width: '100%' }}>
          <PresetControls
            currentPresetId={currentPresetId}
            presets={presets}
            onPresetChange={handlePresetChange}
          />

          <FormControl sx={{ flex: 0 }}>
            <FormLabel htmlFor="show-controls">Controls</FormLabel>

            <Switch
              id="show-controls"
              role="menuitem"
              aria-haspopup="menu"
              aria-expanded={showControls}
              isChecked={showControls}
              onChange={handleSetShowControls}
              sx={{ marginTop: 2.5 }}
            />
          </FormControl>
        </HStack>

        {showControls && currentValues != null && (
          <ParameterValueControls
            parameters={parameters}
            values={currentValues}
            onChange={handleCustomValuesChange}
          />
        )}
      </VStack>
    </ParameterControlsInternalContextProvider>
  )
}
