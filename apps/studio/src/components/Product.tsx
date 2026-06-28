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
import { AnalysisPanel, BomPanel } from '@villagekit/product-kit'
import { Box, Flex, Heading, Tabs } from '@villagekit/ui'
import { useRef, useState } from 'react'
import { Loading } from './Loading'
import { ProductChat } from './ProductChat'
import { ProductEditor } from './ProductEditor'

export default function Product() {
  const hasProduct = useHasProduct()
  const [leftWidth, setLeftWidth] = useState(400)
  const isDragging = useRef(false)

  if (!hasProduct) {
    return <Loading />
  }

  return (
    <Flex css={{ width: '100%', height: '100%', flexDirection: 'row' }}>
      <Box
        css={{
          width: `${leftWidth}px`,
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <ProductControls />
      </Box>
      <Box
        onPointerDown={(e) => {
          isDragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          if (!isDragging.current) return
          setLeftWidth((w) => Math.max(200, w + e.movementX))
        }}
        onPointerUp={(e) => {
          isDragging.current = false
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        onPointerCancel={(e) => {
          isDragging.current = false
          e.currentTarget.releasePointerCapture(e.pointerId)
        }}
        css={{
          width: '8px',
          flexShrink: 0,
          height: '100%',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          borderLeft: '1px solid',
          borderRight: '1px solid',
          borderColor: 'gray.200',
          transition: 'background-color 0.2s',
          '&:hover, &:active': {
            backgroundColor: 'gray.100',
          },
        }}
      />
      <Box css={{ flex: 1, height: '100%', minWidth: 0 }}>
        <ProductViewer />
      </Box>
    </Flex>
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
        <Tabs.Trigger value="chat">Chat</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="code"
        css={{
          flex: 1,
          minHeight: 0,
          padding: 0,
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <ProductEditor />
      </Tabs.Content>
      {showParamControls && (
        <Tabs.Content value="parameters" css={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <ParamControls />
        </Tabs.Content>
      )}
      <Tabs.Content value="chat" css={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <ProductChat />
      </Tabs.Content>
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
        <Tabs.Trigger value="analysis">Analysis</Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content
        value="view"
        css={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
      >
        <Heading as="h2">{meta.label}</Heading>
        <Box css={{ flexGrow: 1, minHeight: 0, width: '100%', position: 'relative' }}>
          <Box css={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ProductView showParamControls={showParamControls} shouldDisplayAxes />
          </Box>
          <BomPanel />
        </Box>
      </Tabs.Content>
      <Tabs.Content
        value="parts"
        css={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px' }}
      >
        <ProductSummary displayUnit="gu" groupParts />
      </Tabs.Content>
      <Tabs.Content value="info">
        <ProductInfo />
      </Tabs.Content>
      <Tabs.Content value="analysis" css={{ flex: 1, minHeight: 0 }}>
        <AnalysisPanel />
      </Tabs.Content>
    </Tabs.Root>
  )
}
