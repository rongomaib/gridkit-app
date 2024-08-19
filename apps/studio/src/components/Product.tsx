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
import {
  Box,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDimensions,
} from '@villagekit/ui'
import { useRef } from 'react'
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
          <ProductControls />
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

function ProductControls() {
  const showParamControls = useHasParams()
  const tabListRef = useRef()
  const tabListDimensions = useDimensions(tabListRef)

  return (
    <Tabs>
      <TabList ref={tabListRef}>
        <Tab>Code</Tab>
        {showParamControls && <Tab>Parameters</Tab>}
      </TabList>
      {tabListDimensions && (
        <TabPanels>
          <TabPanel
            sx={{
              padding: 0,
              height: `calc(100vh - ${tabListDimensions.marginBox.height}px)`,
            }}
          >
            <ProductEditor />
          </TabPanel>

          {showParamControls && (
            <TabPanel>
              <ParamControls />
            </TabPanel>
          )}
        </TabPanels>
      )}
    </Tabs>
  )
}

function ProductViewer() {
  const meta = useProductMeta()
  const productError = useProductError()
  const showParamControls = useHasParams()
  const tabListRef = useRef()
  const tabListDimensions = useDimensions(tabListRef)

  if (productError != null) {
    return <ProductErrorDisplay error={productError} />
  }

  return (
    <Tabs>
      <TabList ref={tabListRef}>
        <Tab>View</Tab>
        <Tab>Parts</Tab>
        <Tab>Info</Tab>
      </TabList>
      {tabListDimensions && (
        <TabPanels>
          <TabPanel
            sx={{
              height: `calc(100vh - ${tabListDimensions.marginBox.height}px)`,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Heading as="h2">{meta.label}</Heading>
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ProductView showParamControls={showParamControls} shouldDisplayAxes />
            </Box>
          </TabPanel>
          <TabPanel>
            <ProductSummary displayUnit="gu" groupParts />
          </TabPanel>
          <TabPanel>
            <ProductInfo />
          </TabPanel>
        </TabPanels>
      )}
    </Tabs>
  )
}
