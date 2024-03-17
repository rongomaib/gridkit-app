import { useEditorContext } from '@/context/editor'
import { getTypeScriptExtensions } from '@/editor/typescript'
import { useProductMeta } from '@villagekit/product'
import { Box } from '@villagekit/ui'
import { useEffect, useRef } from 'react'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  const { exports } = useProductMeta()
  const { setParentEl, setLanguageExtensions } = useEditorContext()

  useEffect(() => {
    if (exports.endsWith('.ts')) {
      getTypeScriptExtensions().then((languageExtensions) => {
        setLanguageExtensions(languageExtensions)
      })
    } else {
      throw new Error(`Unexpected product exports file extension: ${exports}`)
    }
  }, [exports, setLanguageExtensions])

  const parentRef = useRef(null)
  useEffect(() => {
    setParentEl(parentRef.current)
  }, [setParentEl])

  return (
    <Box
      ref={parentRef}
      sx={{
        width: '100%',
        height: '100vh',

        '.cm-editor': {
          height: '100%',
        },

        '.cm-scroller': {
          height: '100%',
          overflowY: 'auto',
        },
      }}
    />
  )
}
