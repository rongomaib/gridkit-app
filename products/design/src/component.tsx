import {
  ExtractValuesFromParametersOptions,
  ParameterControlsContextProvider,
  ParametersOptions,
} from '@villagekit/parameters'
import React, { useCallback, useState } from 'react'

import {
  Design,
  DesignAssemblyParameterized,
  DesignAssemblyStatic,
  DesignContextProviderParameterized,
  DesignContextProviderStatic,
  DesignMeta,
} from './'

export interface DesignWrapperProps {
  design: Design
  children: React.ReactNode | Array<React.ReactNode>
  onLocationUpdate?: (location: Location) => void
}

export function DesignWrapper(props: DesignWrapperProps) {
  const { design, children, onLocationUpdate } = props
  const { meta, assembly } = design

  switch (assembly.type) {
    case 'static':
      return (
        <DesignStatic meta={meta} assembly={assembly}>
          {children}
        </DesignStatic>
      )
    case 'parameterized':
      return (
        <DesignParameterized
          meta={meta}
          assembly={assembly}
          onLocationUpdate={onLocationUpdate}
        >
          {children}
        </DesignParameterized>
      )
  }
}

interface DesignHandlerProps {
  meta: DesignMeta
  children: React.ReactNode | Array<React.ReactNode>
}

interface DesignStaticProps extends DesignHandlerProps {
  assembly: DesignAssemblyStatic
}

function DesignStatic(props: DesignStaticProps) {
  return <DesignContextProviderStatic {...props} />
}

interface DesignParameterizedProps extends DesignHandlerProps {
  assembly: DesignAssemblyParameterized<any>
  onLocationUpdate?: (location: Location) => void
}

function DesignParameterized(props: DesignParameterizedProps) {
  const { meta, assembly, children, onLocationUpdate } = props

  const { parameterValues, handleParamValuesChange } =
    useAssemblyParameters(assembly)

  return (
    <DesignContextProviderParameterized
      meta={meta}
      assembly={assembly}
      parameterValues={parameterValues}
    >
      <ParameterControlsContextProvider
        parameters={assembly.parameters}
        presets={assembly.presets}
        onChange={handleParamValuesChange}
        onLocationUpdate={onLocationUpdate}
      >
        {children}
      </ParameterControlsContextProvider>
    </DesignContextProviderParameterized>
  )
}

function useAssemblyParameters<ParamsOptions extends ParametersOptions>(
  assembly: DesignAssemblyParameterized<ParamsOptions>,
): {
  parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null
  handleParamValuesChange: (
    presetId: string,
    parameterValues: ExtractValuesFromParametersOptions<ParamsOptions> | null,
  ) => void
} {
  const [parameterValues, setParameterValues] =
    useState<ExtractValuesFromParametersOptions<ParamsOptions> | null>(
      assembly.presets[0].values,
    )
  const handleParamValuesChange = useCallback(
    (
      _presetId: string,
      values: ExtractValuesFromParametersOptions<ParamsOptions> | null,
    ) => {
      setParameterValues(values)
    },
    [],
  )
  return { handleParamValuesChange, parameterValues }
}
