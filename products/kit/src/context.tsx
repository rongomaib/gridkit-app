import {
  type ExtractValuesFromParams,
  type Params,
  useClearParams,
  useParamsValues,
  useUpdateParams,
} from '@villagekit/parameters'
import {
  type PartCreator,
  type PartGlValue,
  type PartState,
  calculateBoundingBoxForAll,
  calculateGlValueForAll,
  calculateStateForAll,
  getPartVariants,
} from '@villagekit/part'
import type {
  ProductError,
  ProductTypeProviderProps,
  // useUpdateProductError,
} from '@villagekit/product'
import { map, uniq } from 'lodash-es'
import pDebounce from 'p-debounce'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Box3 } from 'three'
import { getPartCreatorsFromKitParts } from './helpers'
import { generatePartsForPlugins } from './plugins'
import { useRender } from './renders/index'
// import { partsSchema } from './schema'
import type { Parts, Plugins, ProductKitRender } from './types'

import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'

type ProductKitState = {
  boundingBox: Box3
  isLoading: boolean
  partValues: Array<PartGlValue>
  parts: Array<PartState>
}

function useProductKit(): ProductKitState {
  const render = useRender()

  const clearParams = useClearParams()
  const updateParams = useUpdateParams()
  useEffect(() => {
    if (render == null) return
    if (render.type === 'static') {
      clearParams()
    } else {
      const { parameters: params, presets } = render
      updateParams(params, presets)
    }
  }, [render, clearParams, updateParams])

  const paramsValues = useParamsValues()

  // @ts-ignore
  const { isLoading, parts } = useParts({ render, paramsValues })

  const partValues = usePartValues(parts)
  const boundingBox = useBoundingBox(partValues)

  return {
    boundingBox,
    isLoading,
    partValues,
    parts,
  }
}

export const ProductKitContext = createContext<ProductKitState | null>(null)

export function ProductKitProvider(props: ProductTypeProviderProps) {
  const { children } = props
  const value = useProductKit()
  return <ProductKitContext.Provider value={value}>{children}</ProductKitContext.Provider>
}

export function useProductKitContext(): ProductKitState {
  const context = useContext(ProductKitContext)
  if (context == null) {
    throw new Error('useProductKitContext must be wrapped in ProductKitProvider')
  }
  return context
}

type UsePartsOptions<Ps extends Params> = {
  render: ProductKitRender<Ps> | null
  paramsValues: ExtractValuesFromParams<Ps> | null
  updateProductError: (error: ProductError) => void
}

type UsePartsValue = Pick<ProductKitState, 'isLoading' | 'parts'>

const noPlugins: Plugins = []

function useParts<Ps extends Params>(options: UsePartsOptions<Ps>): UsePartsValue {
  const { render, paramsValues } = options

  // const updateProductError = useUpdateProductError()

  const partVariants = useMemo(() => getPartVariants(), [])

  const [kitParts, setKitParts] = useState<Parts>([])
  useEffect(() => {
    if (render == null) return
    if (render.type === 'static') {
      validateThenSet(render.parts)
    } else {
      if (paramsValues == null) return
      render.parts(paramsValues, partVariants).then((parts) => {
        validateThenSet(parts)
      })
    }

    function validateThenSet(parts: Parts) {
      setKitParts(parts)
      // TODO fix
      /*
      partsSchema.safeParseAsync(parts).then((result) => {
        if (result.success) {
          setKitParts(result.data)
        } else {
          updateProductError({
            type: 'error:validation',
            errors: {
              parts: result.error,
            },
          })
        }
      })
      */
    }
  }, [render, paramsValues, partVariants /*, updateProductError */])

  const [partCreators, setPartCreators] = useState<Array<PartCreator>>([])
  const [isLoading, setLoading] = useState(false)

  const { plugins = noPlugins } = render ?? {}
  const generatePluginParts = useMemo(() => {
    return pDebounce((partCreators: Array<PartCreator>) => {
      return generatePartsForPlugins(plugins, partCreators)
    }, 500)
  }, [plugins])

  useEffect(() => {
    const kitPartCreators = getPartCreatorsFromKitParts(kitParts)
    setPartCreators(kitPartCreators)

    let isCancelled = false

    setLoading(true)

    void generatePluginParts(kitPartCreators).then((generatedParts) => {
      if (!isCancelled && generatedParts.length > 0) {
        setPartCreators([...kitPartCreators, ...generatedParts])
      }

      setLoading(false)
    })

    return () => {
      isCancelled = true
    }
  }, [kitParts, generatePluginParts])

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

/*
function assertRender<Ps extends Params>(
  render: ProductKitRender<any>,
): asserts render is ProductKitRender<Ps> {
  // TODO
}

function assertParamsValues<Ps extends Params>(
  _render: ProductKitRender<Ps>,
  paramsValues: ParamsValues,
): asserts paramsValues is ExtractValuesFromParams<Ps> {
  // TODO
}
*/
