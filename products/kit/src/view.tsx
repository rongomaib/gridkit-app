import { PartsGlForAll } from '@villagekit/part'
import { type ProductViewProps, useProductMeta } from '@villagekit/product'
import { Sandbox } from '@villagekit/sandbox'
import { Flex, Spinner } from '@villagekit/ui'
import { Suspense } from 'react'
import { ProductKitContext, useProductKitContext } from './context'

export function ProductKitView(props: ProductViewProps) {
  const { ...sandboxProps } = props

  const meta = useProductMeta()

  const { boundingBox, partValues: partGlValues } = useProductKitContext()

  return (
    <Suspense fallback={<Loading />}>
      <Sandbox
        label={meta.label}
        boundingBox={boundingBox}
        bridgeContexts={[ProductKitContext]}
        {...sandboxProps}
      >
        <PartsGlForAll partGlValues={partGlValues} />
      </Sandbox>
    </Suspense>
  )
}

function Loading() {
  return (
    <Flex alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Flex>
  )
}
