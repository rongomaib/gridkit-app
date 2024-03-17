import { assign, setup } from 'xstate'
import type { ProductError } from './errors'
import type { ProductData, ProductModule } from './types'

export type ProductMachineInput = ProductData & {
  Products: Array<ProductModule>
}

export type ProductMachineContext = ProductMachineInput & {
  Product: ProductModule
  error: ProductError | null
}

export type ProductMachineEvent =
  | { type: 'updateInput'; input: ProductMachineInput }
  | { type: 'updateError'; error: ProductError | null }

export const productMachine = setup({
  types: {} as {
    context: ProductMachineContext
    input: ProductMachineInput
    events: ProductMachineEvent
  },
}).createMachine({
  id: 'product',
  context: ({ input }) => getContextFromInput(input),
  on: {
    updateInput: {
      actions: assign(({ event: { input } }) => getContextFromInput(input)),
    },
    updateError: {
      actions: assign({
        error: ({ event: { error } }) => error,
      }),
    },
  },
})

function getContextFromInput(input: ProductMachineInput): ProductMachineContext {
  const { Products, meta } = input
  const Product = Products.find((P) => P.id === meta.type)
  if (Product == null) {
    throw new Error(`Unknown product type: ${meta.type}`)
  }
  return {
    ...input,
    Product,
    error: null,
  }
}
