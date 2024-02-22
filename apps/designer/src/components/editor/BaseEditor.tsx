import { useEffect, useRef } from 'react'
import { EditorViewConfig } from '@codemirror/view'
import { Box } from '@villagekit/ui'

import { useEditorContext } from '@/context/editor'

interface BaseEditorProps {
  languageExtensions: NonNullable<EditorViewConfig['extensions']>
}

export function BaseEditor(props: BaseEditorProps) {
  const { languageExtensions } = props

  const { setParentEl, setLanguageExtensions } = useEditorContext()

  const parentRef = useRef(null)
  useEffect(() => {
    setParentEl(parentRef.current)
  }, [setParentEl])

  useEffect(() => {
    setLanguageExtensions(languageExtensions)
  }, [languageExtensions, setLanguageExtensions])

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
