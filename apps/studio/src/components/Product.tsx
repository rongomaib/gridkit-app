import { ParamControls, useHasParams } from '@villagekit/parameters'
import {
  ProductErrorDisplay,
  ProductInfo,
  ProductView,
  useHasProduct,
  useProductError,
  useProductMeta,
} from '@villagekit/product'
import { Box, Flex, Heading, VStack } from '@villagekit/ui'
import { Resplit } from 'react-resplit'
import { Loading } from './Loading'
import { ProductEditor } from './ProductEditor'

export default function Product() {
  const hasProduct = useHasProduct()

  if (!hasProduct) {
    return <Loading />
  }

  return (
    <Resplit.Root direction="horizontal" asChild>
      <Flex sx={{ width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.5fr" minSize="0.1fr" asChild>
          <ProductEditor />
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.5fr" minSize="0.1fr">
          <ProductViewer />
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductViewer() {
  const meta = useProductMeta()
  const productError = useProductError()
  const showParamControls = useHasParams()

  if (productError != null) {
    return <ProductErrorDisplay error={productError} />
  }

  return (
    <Resplit.Root direction="vertical" asChild>
      <Flex sx={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.8fr" minSize="0.4fr" asChild>
          <VStack sx={{ padding: 3, minWidth: 0 }}>
            <Heading as="h2">{meta.label}</Heading>
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ProductView showParamControls={showParamControls} shouldDisplayAxes />
            </Box>
          </VStack>
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.2fr" minSize="0.1fr">
          <VStack spacing={8} sx={{ height: '100%', padding: 3, overflowY: 'auto' }}>
            {showParamControls && <ParamControls />}
            <ProductInfo />
          </VStack>
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}
