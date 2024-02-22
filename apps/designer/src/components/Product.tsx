import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'

import { DesignWrapper } from '@villagekit/design'
import React from 'react'
import { AssemblyInfo, Sandbox } from '@villagekit/sandbox'
import { Box, Flex, Heading, VStack } from '@villagekit/ui'
import { Resplit } from 'react-resplit'
import { ParameterControls } from '@villagekit/parameters'

import { useProductContext } from '@/context/product'

import { Loading } from './Loading'
import { ProductEditor } from './editor/ProductEditor'

export default function Product() {
  const product = useProductContext()

  if (product == null) {
    return <Loading />
  }

  if (product.meta.type === 'assembly') {
    return <ProductAssembly />
  }

  throw new Error(`Unknown product type: ${product.meta.type}`)
}

function ProductAssembly() {
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
          <ProductAssemblyViewer />
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductAssemblyViewer() {
  const product = useProductContext()
  if (product == null) return <Loading />
  const { meta, assembly } = product
  if (assembly == null) return <Loading />
  const { render } = assembly

  if (render == null) return <Loading />
  if (render.type === 'error') {
    const error = render.error
    const errorString = typeof error === 'string' ? error : error.message
    return (
      <Box>
        <code>
          <pre>{errorString}</pre>
        </code>
      </Box>
    )
  }

  const design = {
    meta,
    assembly: render.assembly,
  }

  return (
    <DesignWrapper design={design}>
      <Resplit.Root direction="vertical" asChild>
        <Flex sx={{ flexDirection: 'column', width: '100%', height: '100%' }}>
          <Resplit.Pane order={0} initialSize="0.8fr" minSize="0.4fr" asChild>
            <VStack sx={{ padding: 3, minWidth: 0 }}>
              <Heading as="h2">{product.meta.label}</Heading>
              <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
                <React.Suspense fallback={<Loading />}>
                  <Sandbox showParameterControls />
                </React.Suspense>
              </Box>
            </VStack>
          </Resplit.Pane>
          <Resplit.Splitter order={1} size="16px" asChild>
            <Box sx={{ backgroundColor: 'gray.100' }} />
          </Resplit.Splitter>
          <Resplit.Pane order={2} initialSize="0.2fr" minSize="0.1fr">
            <VStack spacing={8} sx={{ height: '100%', padding: 3, overflowY: 'auto' }}>
              <ParameterControls />
              <AssemblyInfo />
            </VStack>
          </Resplit.Pane>
        </Flex>
      </Resplit.Root>
    </DesignWrapper>
  )
}
