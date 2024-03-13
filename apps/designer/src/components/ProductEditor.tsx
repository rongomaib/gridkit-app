import { useEffect, useRef } from 'react'
import { Box } from '@villagekit/ui'

import { useProductContext } from '@/context/product'
import { useEditorContext } from '@/context/editor'
import { getTypeScriptExtensions } from '@/editor/typescript'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  const productContext = useProductContext()
  const { setParentEl, setLanguageExtensions } = useEditorContext()

  const language = productContext?.file?.language
  useEffect(() => {
    if (language == null) return
    if (language === 'typescript') {
      getTypeScriptExtensions().then((languageExtensions) => {
        setLanguageExtensions(languageExtensions)
      })
    } else {
      throw new Error(`Unexpected product assembly file language: ${language}`)
    }
  }, [language, setLanguageExtensions])

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
