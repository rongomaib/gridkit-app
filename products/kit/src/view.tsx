import { PartsGlForAll } from '@villagekit/part'
import { type ProductViewProps, useProductMeta } from '@villagekit/product'
import { Sandbox } from '@villagekit/sandbox'
import { Flex, Spinner } from '@villagekit/ui'
import { Suspense } from 'react'
import { useProductKitContext } from './context'
import { ProductKitInfo } from './info'

export function ProductKitView(props: ProductViewProps) {
  const { ...sandboxProps } = props

  const meta = useProductMeta()

  const { boundingBox, partValues: partGlValues } = useProductKitContext()

  return (
    <Suspense fallback={<Loading />}>
      <Sandbox
        {...sandboxProps}
        label={meta.label}
        boundingBox={boundingBox}
        InfoComponent={ProductKitInfo}
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
