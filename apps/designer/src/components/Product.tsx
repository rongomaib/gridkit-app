import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'

import React from 'react'
import { AssemblyInfo, Sandbox, useSandboxContext } from '@villagekit/sandbox'
import { Box, Flex, Heading, VStack } from '@villagekit/ui'
import { Resplit } from 'react-resplit'
import { ParameterControls } from '@villagekit/parameters'

import { useProductContext } from '@/context/product'

import { Loading } from './Loading'
import { ProductEditor } from './ProductEditor'

export default function Product() {
  const product = useProductContext()

  if (product == null) {
    return <Loading />
  }

  if (product.file.type === 'assembly') {
    return <ProductAssembly />
  }

  throw new Error(`Unknown product type: ${product.file.type}`)
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
  return (
    <Resplit.Root direction="vertical" asChild>
      <Flex sx={{ flexDirection: 'column', width: '100%', height: '100%' }}>
        <Resplit.Pane order={0} initialSize="0.8fr" minSize="0.4fr" asChild>
          <VStack sx={{ padding: 3, minWidth: 0 }}>
            <ProductAssemblyTitle />
            <Box sx={{ flexGrow: 1, minHeight: 0, width: '100%' }}>
              <ProductAssemblyGl />
            </Box>
          </VStack>
        </Resplit.Pane>
        <Resplit.Splitter order={1} size="16px" asChild>
          <Box sx={{ backgroundColor: 'gray.100' }} />
        </Resplit.Splitter>
        <Resplit.Pane order={2} initialSize="0.2fr" minSize="0.1fr">
          <VStack spacing={8} sx={{ height: '100%', padding: 3, overflowY: 'auto' }}>
            <ProductAssemblyDetails />
          </VStack>
        </Resplit.Pane>
      </Flex>
    </Resplit.Root>
  )
}

function ProductAssemblyGl() {
  const context = useSandboxContext()

  if (context == null) return <Loading />

  const { renderError } = context
  if (renderError != null)
    return (
      <Box as="code">
        <Box as="pre">{renderError instanceof Error ? renderError.message : renderError}</Box>
      </Box>
    )

  return (
    <React.Suspense fallback={<Loading />}>
      <Sandbox showParameterControls />
    </React.Suspense>
  )
}

function ProductAssemblyTitle() {
  const context = useSandboxContext()

  return <Heading as="h2">{context?.render?.meta?.label}</Heading>
}

function ProductAssemblyDetails() {
  const context = useSandboxContext()

  if (context?.render?.type !== 'assembly') return <Loading />

  return (
    <>
      <ParameterControls />
      <AssemblyInfo />
    </>
  )
}
