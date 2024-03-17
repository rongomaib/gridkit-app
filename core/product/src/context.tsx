import {
  ParamsProvider,
  getPresetsSchema,
  paramsSchema,
  useParams,
  usePresets,
} from '@villagekit/parameters'
import { useActorRef, useSelector } from '@xstate/react'
import {
  Fragment,
  type PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'
import type { ActorRefFrom, SnapshotFrom } from 'xstate'
import { ProductTypeProvider } from './components'
import type { ProductError, ProductErrorValidation } from './errors'
import { type ProductMachineInput, productMachine } from './machine'

type ProductProviderProps = PropsWithChildren<
  ProductMachineInput & {
    onLocationUpdate?: (location: Location) => void
  }
>

export const ProductContext = createContext<ActorRefFrom<typeof productMachine> | null>(null)

export function ProductProvider(props: ProductProviderProps) {
  const { children, onLocationUpdate, meta, Products, code } = props

  const input = useMemo(
    () => ({
      meta,
      Products,
      code,
    }),
    [meta, Products, code],
  )

  const actorRef = useActorRef(productMachine, {
    input,
  })

  // handle updateInput
  useEffect(() => {
    actorRef.send({ type: 'updateInput', input })
  }, [actorRef, input])

  return (
    <ProductContext.Provider value={actorRef}>
      <ParamsProvider onLocationUpdate={onLocationUpdate}>
        <ValidateParams />
        <ProductTypeProvider>{children}</ProductTypeProvider>
      </ParamsProvider>
    </ProductContext.Provider>
  )
}

function useProductActor(): ActorRefFrom<typeof productMachine> {
  const actorRef = useContext(ProductContext)
  if (actorRef == null) {
    throw new Error(
      "You used a hook for ProductContext but it's not inside a ProductProvider component",
    )
  }
  return actorRef
}

export const useHasProduct = () => useContext(ProductContext) != null

type ProductSnapshot = SnapshotFrom<typeof productMachine>
const selectProductModule = (snapshot: ProductSnapshot) => snapshot.context.Product
export const useProductModule = () => useSelector(useProductActor(), selectProductModule)
const selectProductMeta = (snapshot: ProductSnapshot) => snapshot.context.meta
export const useProductMeta = () => useSelector(useProductActor(), selectProductMeta)
const selectProductCode = (snapshot: ProductSnapshot) => snapshot.context.code
export const useProductCode = () => useSelector(useProductActor(), selectProductCode)
const selectProductError = (snapshot: ProductSnapshot) => snapshot.context.error
export const useProductError = () => useSelector(useProductActor(), selectProductError)

export const useUpdateProductError = () => {
  const actorRef = useProductActor()
  return useCallback(
    (error: ProductError | null) => {
      actorRef.send({ type: 'updateError', error })
    },
    [actorRef],
  )
}

function ValidateParams() {
  const params = useParams()
  const presets = usePresets()
  const updateProductError = useUpdateProductError()

  useEffect(() => {
    if (params == null || presets == null) return
    const errors: ProductErrorValidation['errors'] = {}
    const paramsResult = paramsSchema.safeParse(params)
    if (!paramsResult.success) errors.params = paramsResult.error

    const presetsSchema = getPresetsSchema(params)
    const presetsResult = presetsSchema.safeParse(presets)
    if (!presetsResult.success) errors.presets = presetsResult.error
    if (!paramsResult.success || !presetsResult.success) {
      updateProductError({
        type: 'error:validation',
        errors,
      })
    }
  }, [params, presets, updateProductError])

  return <Fragment />
}
