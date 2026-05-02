import { ParamControls, useHasParams } from '@villagekit/parameters'
import {
  ProductErrorDisplay,
  ProductInfo,
  ProductSummary,
  ProductView,
  useHasProduct,
  useProductError,
  useProductMeta,
} from '@villagekit/product'
import { Box, Flex, Heading, Tabs } from '@villagekit/ui'
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
      <Flex css={{ width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.5fr" minSize="0.1fr" asChild>
          <ProductControls />
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box css={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.5fr" minSize="0.1fr">
          <ProductViewer />
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductControls() {
  const showParamControls = useHasParams()

  return (
    <Tabs.Root
      defaultValue="code"
      css={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Tabs.List>
        <Tabs.Trigger value="code">Code</Tabs.Trigger>
        {showParamControls && <Tabs.Trigger value="parameters">Parameters</Tabs.Trigger>}
      </Tabs.List>
      <Tabs.Content value="code" css={{ flex: 1, minHeight: 0, padding: 0 }}>
        <ProductEditor />
      </Tabs.Content>
      {showParamControls && (
        <Tabs.Content value="parameters" css={{ flex: 1, minHeight: 0 }}>
          <ParamControls />
        </Tabs.Content>
      )}
    </Tabs.Root>
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
    <Tabs.Root
      defaultValue="view"
      css={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <Tabs.List>
        <Tabs.Trigger value="view">View</Tabs.Trigger>
        <Tabs.Trigger value="parts">Parts</Tabs.Trigger>
        <Tabs.Trigger value="info">Info</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="view"
        css={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Heading as="h2">{meta.label}</Heading>
        <Box css={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
          <ProductView showParamControls={showParamControls} shouldDisplayAxes />
        </Box>
      </Tabs.Content>
      <Tabs.Content value="parts">
        <ProductSummary displayUnit="gu" groupParts />
      </Tabs.Content>
      <Tabs.Content value="info">
        <ProductInfo />
      </Tabs.Content>
    </Tabs.Root>
  )
}
