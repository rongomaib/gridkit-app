import { ExtractValuesFromParametersOptions, ParametersOptions } from '@villagekit/parameters'
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
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Box3 } from 'three'
import {
  AssemblyPlugin,
  DesignParts,
  designPartsSchema,
  generatePartsForPlugins,
  getPartCreatorsFromDesignParts,
} from '@villagekit/design'

import { DesignRenderAssembly, ExtendDesignValidationErrors } from '../types'

type SandboxAssemblyOptions<ParamsOptions extends ParametersOptions> = {
  assembly: DesignRenderAssembly<ParamsOptions>
  parameterValues: ParamsOptions extends never
    ? null
    : ExtractValuesFromParametersOptions<ParamsOptions>
  extendValidationErrors: ExtendDesignValidationErrors
}

type SandboxAssemblyState = {
  boundingBox: Box3
  isLoading: boolean
  partValues: Array<PartGlValue>
  parts: Array<PartState>
}

function useSandboxAssembly<ParamsOptions extends ParametersOptions>(
  props: SandboxAssemblyOptions<ParamsOptions>,
): SandboxAssemblyState {
  const { isLoading, parts } = useParts(props)

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    boundingBox,
    isLoading,
    partValues,
    parts,
  }
}

export const SandboxAssemblyContext = createContext<SandboxAssemblyState | null>(null)

export function SandboxAssemblyProvider(
  props: SandboxAssemblyOptions<any> & { children: React.ReactNode },
) {
  const { children, ...options } = props
  const value = useSandboxAssembly(options)
  return <SandboxAssemblyContext.Provider value={value}>{children}</SandboxAssemblyContext.Provider>
}

export function useSandboxAssemblyContext(): SandboxAssemblyState {
  const context = useContext(SandboxAssemblyContext)
  if (context == null) {
    throw new Error('useSandboxAssemblyContext must be wrapped in SandboxAssemblyProvider')
  }
  return context
}

type UsePartsValue = Pick<SandboxAssemblyState, 'isLoading' | 'parts'>

const noPlugins: Array<AssemblyPlugin> = []

function useParts<ParamsOptions extends ParametersOptions>(
  options: SandboxAssemblyOptions<ParamsOptions>,
): UsePartsValue {
  const { assembly, parameterValues, extendValidationErrors } = options

  const partVariants = useMemo(() => getPartVariants(), [])

  const [assemblyParts, setAssemblyParts] = useState<DesignParts>([])
  useEffect(() => {
    if (parameterValues == null) return
    assembly.assembly(parameterValues, partVariants).then((parts) => {
      const result = designPartsSchema.safeParse(parts)
      if (result.success) {
        setAssemblyParts(result.data)
        extendValidationErrors({ assembly: null })
      } else {
        extendValidationErrors({ assembly: result.error })
      }
    })
  }, [assembly, parameterValues, partVariants, extendValidationErrors])

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
