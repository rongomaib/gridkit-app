import { ParametersOptions } from '@villagekit/parameters'
import {
  calculateBoundingBoxForAll,
  calculateGlValueForAll,
  calculateStateForAll,
  getPartVariants,
  PartCreator,
  PartGlValue,
  PartState,
} from '@villagekit/part'
import { map, uniq } from 'lodash-es'
import pDebounce from 'p-debounce'
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Box3 } from 'three'

import {
  AssemblyPlugin,
  DesignInstance,
  DesignInstanceParameterized,
  DesignInstanceStatic,
  DesignParts,
  generatePartsForPlugins,
  getPartCreatorsFromDesignParts,
} from './'

type DesignContextPropsStatic = Omit<DesignInstanceStatic, 'type'>
type DesignContextPropsParameterized<ParamsOptions extends ParametersOptions> = Omit<
  DesignInstanceParameterized<ParamsOptions>,
  'type'
>

type DesignContextTypeBase = {
  boundingBox: Box3
  isLoading: boolean
  partValues: Array<PartGlValue>
  parts: Array<PartState>
}

type DesignContextTypeStatic = DesignContextTypeBase & DesignInstanceStatic
type DesignContextTypeParameterized<ParamsOptions extends ParametersOptions> =
  DesignContextTypeBase & DesignInstanceParameterized<ParamsOptions>

export type DesignContextType = DesignContextTypeStatic | DesignContextTypeParameterized<any>

function useAssemblyStatic(props: DesignContextPropsStatic): DesignContextTypeStatic {
  const { assembly, meta } = props
  const { type } = assembly

  // memoized because options will be used as a reference check
  const usePartsOptions = useMemo(
    () => ({
      assembly,
      meta,
      type,
    }),
    [type, meta, assembly],
  )
  const { isLoading, parts } = useParts(usePartsOptions)

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    assembly,
    boundingBox,
    isLoading,
    meta,
    partValues,
    parts,
    type,
  }
}

function useAssemblyParameterized<ParamsOptions extends ParametersOptions>(
  props: DesignContextPropsParameterized<ParamsOptions>,
): DesignContextTypeParameterized<ParamsOptions> {
  const { assembly, meta, parameterValues } = props
  const { type } = assembly

  // memoized because options will be used as a reference check
  const usePartsOptions = useMemo(
    () => ({
      assembly,
      meta,
      parameterValues,
      type,
    }),
    [type, meta, assembly, parameterValues],
  )
  const { isLoading, parts } = useParts(usePartsOptions)

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    assembly,
    boundingBox,
    isLoading,
    meta,
    parameterValues,
    partValues,
    parts,
    type,
  }
}

// Manually setting up the context here insetad of using constate
// so that we can bridge it into the r3f renderer with useContextBridge
// Ref: https://github.com/pmndrs/drei#usecontextbridge
// The exports below mimic what constate would export
export const DesignContext = createContext<any>(null)

export type DesignContextProviderProps = {
  children: React.ReactNode | Array<React.ReactNode>
}

export function DesignContextProviderStatic(
  props: DesignContextProviderProps & DesignContextPropsStatic,
) {
  const { children, ...rest } = props

  const value = useAssemblyStatic(rest)

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
}

export function DesignContextProviderParameterized<ParamsOptions extends ParametersOptions,>(
  props: DesignContextProviderProps & DesignContextPropsParameterized<ParamsOptions>,
) {
  const { children, ...rest } = props

  const value = useAssemblyParameterized(rest)

  return <DesignContext.Provider value={value}>{children}</DesignContext.Provider>
}

export function useDesignContext(): DesignContextType {
  return useContext(DesignContext)
}

type UsePartsOptions = DesignInstance
type UsePartsValue = Pick<DesignContextTypeBase, 'isLoading' | 'parts'>

const noPlugins: Array<AssemblyPlugin> = []

function useParts(options: UsePartsOptions): UsePartsValue {
  const partVariants = useMemo(() => getPartVariants(), [])

  const [assemblyParts, setAssemblyParts] = useState<DesignParts>([])
  useEffect(() => {
    switch (options.type) {
      case 'static':
        setAssemblyParts(options.assembly.parts)
        break
      case 'parameterized': {
        const parameterValues = options.parameterValues != null ? options.parameterValues : []
        const parts = options.assembly.createParts(parameterValues, partVariants)
        if (parts instanceof Promise) {
          parts.then(setAssemblyParts)
        } else {
          setAssemblyParts(parts)
        }
        break
      }
    }
  }, [options, partVariants])

  const [partCreators, setPartCreators] = useState<Array<PartCreator>>([])
  const [isLoading, setLoading] = useState(false)

  const {
    assembly: { plugins = noPlugins },
  } = options
  const generatePluginParts = useMemo(() => {
    return pDebounce((partCreators: Array<PartCreator>) => {
      return generatePartsForPlugins(plugins, partCreators)
    }, 500)
  }, [plugins])

  useEffect(() => {
    const assemblyPartCreators = getPartCreatorsFromDesignParts(assemblyParts)
    setPartCreators(assemblyPartCreators)

    let isCancelled = false

    setLoading(true)

    void generatePluginParts(assemblyPartCreators).then((generatedParts) => {
      if (!isCancelled && generatedParts.length > 0) {
        setPartCreators([...assemblyPartCreators, ...generatedParts])
      }

      setLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [assemblyParts, generatePluginParts])

  const partStates = useMemo(() => {
    return calculateStateForAll(partCreators)
  }, [partCreators])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // Ensure all parts have unique ids
      const duplicatePartIds = uniq(
        map(partStates, 'id').filter((partId, i, a) => a.indexOf(partId) !== i),
      )

      if (duplicatePartIds.length > 0) {
        throw new Error(`Parts with duplicate ids found: ${duplicatePartIds.join(', ')}`)
      }
    }
  }, [partStates])

  return { isLoading, parts: partStates }
}

function usePartValues(partStates: Array<PartState>): Array<PartGlValue> {
  return useMemo(() => {
    return calculateGlValueForAll(partStates)
  }, [partStates])
}

function useBoundingBox(partGlValues: Array<PartGlValue>): Box3 {
  return useMemo(() => {
    return calculateBoundingBoxForAll(partGlValues)
  }, [partGlValues])
}
