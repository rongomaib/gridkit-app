import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import {
  ExtractValuesFromParametersOptions,
  ParameterControlsContextProvider,
  ParametersOptions,
  Presets,
} from '@villagekit/parameters'

import { SandboxAssemblyProvider } from './assembly/context'
import { RenderOutput, RenderError, DesignRenderer } from './renders'
import { DesignFile } from '.'
import { DesignInstance } from './types'

type ProviderProps = {
  children: React.ReactNode
}

type SandboxOptions = {
  file: DesignFile
  onLocationUpdate?: (location: Location) => void
}

type SandboxState = DesignInstance<any>

export const SandboxContext = createContext<SandboxState | null>(null)

export function useSandboxContext(): SandboxState {
  const context = useContext(SandboxContext)
  if (context == null) {
    throw new Error('useSandboxContext must be wrapped in SandboxProvider')
  }
  return context
}

export function SandboxProvider(props: SandboxOptions & ProviderProps) {
  const { file, onLocationUpdate, children } = props

  const [render, setRender] = useState<RenderOutput<any>>(null)
  const [renderError, setRenderError] = useState<RenderError>(null)

  const parameters = render?.parameters
  const presets = render?.presets
  const hasParameters = parameters != null
  const hasPresets = presets != null

  const [parameterValues, setParameterValues] = useState<object | null>(null)

  const state = {
    file,
    render,
    renderError,
    parameters,
    presets,
    parameterValues,
  }

  const renderTyped =
    render?.type === 'assembly' ? (
      <SandboxAssemblyProvider assembly={render} parameterValues={parameterValues}>
        {children}
      </SandboxAssemblyProvider>
    ) : (
      children
    )

  const parameterized =
    hasParameters && hasPresets ? (
      <SandboxParameters
        onLocationUpdate={onLocationUpdate}
        parameters={parameters}
        presets={presets}
        setParameterValues={setParameterValues}
      >
        {renderTyped}
      </SandboxParameters>
    ) : (
      renderTyped
    )

  return (
    <SandboxContext.Provider value={state}>
      <DesignRenderer file={file} setRender={setRender} setError={setRenderError} />
      {parameterized}
    </SandboxContext.Provider>
  )
}

type SandboxParametersProps<ParamsOptions extends ParametersOptions> = Pick<
  SandboxOptions,
  'onLocationUpdate'
> &
  ProviderProps & {
    parameters: ParamsOptions
    presets: Presets<ParamsOptions>
    setParameterValues: (
      parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null,
    ) => void
  }

function SandboxParameters<ParamsOptions extends ParametersOptions>(
  props: SandboxParametersProps<ParamsOptions>,
) {
  const { onLocationUpdate, parameters, presets, setParameterValues, children } = props

  useEffect(() => {
    setParameterValues(presets[0].values)
  }, [setParameterValues, presets])

  const handleParamValuesChange = useCallback(
    (_presetId: string, values: ExtractValuesFromParametersOptions<ParamsOptions> | null) => {
      setParameterValues(values)
    },
    [setParameterValues],
  )

  return (
    <ParameterControlsContextProvider
      parameters={parameters}
      presets={presets}
      onChange={handleParamValuesChange}
      onLocationUpdate={onLocationUpdate}
    >
      {children}
    </ParameterControlsContextProvider>
  )
}
