import type { ProductModule } from '@villagekit/product'
import { ProductKitProvider } from './context'
import { ProductKitInfo } from './info'
import { ProductKitSummary } from './summary'
import { ProductKitView } from './view'

export { ProductKitContext } from './context'
export { registerPlugin } from './plugins'
export { AnalysisPanel } from './analysis-panel'
export { BomPanel } from './bom-panel'
export type {
  Params,
  Part,
  Parts,
  Plugins,
  Plugin,
  PluginIds,
  PartsFn,
  Preset,
  Presets,
} from './types'

export const ProductKitModule: ProductModule = {
  id: 'kit',
  components: {
    ProductProvider: ProductKitProvider,
    ProductView: ProductKitView,
    ProductSummary: ProductKitSummary,
    ProductInfo: ProductKitInfo,
  },
}
