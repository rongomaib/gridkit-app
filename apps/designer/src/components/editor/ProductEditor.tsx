import { useProductContext } from '@/context/product'

import { TypeScriptEditor } from './TypeScriptEditor'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  const product = useProductContext()
  if (product == null) throw new Error('Missing product context')
  const { assembly } = product
  if (assembly == null) throw new Error('Missing product assembly context')
  const { file } = assembly
  const { type: fileType } = file

  if (fileType === 'typescript') {
    return <TypeScriptEditor productType="assembly" />
  }

  throw new Error(`Unexpected product assembly file type: ${fileType}`)
}
