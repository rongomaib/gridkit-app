import { useProductModule } from './context'
import type {
  ProductInfoProps,
  ProductSummaryProps,
  ProductTypeProviderProps,
  ProductViewProps,
} from './types'

export function ProductTypeProvider(props: ProductTypeProviderProps) {
  const Product = useProductModule()
  return <Product.components.ProductProvider {...props} />
}

export function ProductView(props: ProductViewProps) {
  const Product = useProductModule()
  return <Product.components.ProductView {...props} />
}

export function ProductSummary(props: ProductSummaryProps) {
  const Product = useProductModule()
  return <Product.components.ProductSummary {...props} />
}

export function ProductInfo(props: ProductInfoProps) {
  const Product = useProductModule()
  return <Product.components.ProductInfo {...props} />
}
