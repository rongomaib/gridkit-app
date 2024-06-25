import '@villagekit/part-gridbeam'
import '@villagekit/part-gridpanel'
import '@villagekit/part-fastener'
import '@villagekit/plugin-smart-fasteners'

import { CSSReset, ChakraProvider, theme as baseTheme, extendTheme } from '@villagekit/ui'
import React from 'react'
import { createRoot } from 'react-dom/client'

import { ProductProvider, ProductView } from '@villagekit/product'
import { ProductKitModule } from '@villagekit/product-kit'

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search)
  const metaJson = urlParams.get('meta')
  if (metaJson == null) {
    throw Error('Product.meta not provided!')
  }
  const meta = JSON.parse(atob(metaJson))

  if (window.location.hash === '') {
    throw Error('Product.code not provided!')
  }
  const code = atob(window.location.hash.substring(1))

  const rootEl = document.getElementById('root')
  const root = createRoot(rootEl as HTMLElement)

  root.render(
    <React.StrictMode>
      <Provider>
        <ProductProvider code={code} meta={meta} Products={[ProductKitModule]}>
          <ProductView mode="screenshot" />
        </ProductProvider>
      </Provider>
    </React.StrictMode>,
  )
})

const theme = extendTheme({
  ...baseTheme,
  styles: {
    global: {
      body: {
        bg: 'transparent',
      },
    },
  },
})

function Provider({
  children,
}: {
  children: React.ReactNode | Array<React.ReactNode>
}) {
  return (
    <ChakraProvider theme={theme}>
      <CSSReset />
      {children}
    </ChakraProvider>
  )
}
