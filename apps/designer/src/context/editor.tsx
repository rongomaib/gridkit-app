import constate from 'constate'
import { useColorModeValue } from '@villagekit/ui'
import { createRef, useCallback, useEffect, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, EditorViewConfig } from '@codemirror/view'
import { Variant } from 'codemirror-theme-catppuccin'

import { CodeMirror, updateCode, updateTheme } from '@/editor'

function useEditor() {
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null)

  const [view, setView] = useState<EditorView | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)

  const [code, setCode] = useState<string>('')
  const [codeToLoad, setCodeToLoad] = useState<string | null>(null)
  const resetCodeToLoad = useCallback(() => setCodeToLoad(null), [])

  const theme = useColorModeValue<Variant>('latte', 'mocha') as Variant

  const [languageExtensions, setLanguageExtensions] = useState<
    NonNullable<EditorViewConfig['extensions']>
  >([])

  // on init
  // biome-ignore lint/correctness/useExhaustiveDependencies:
  useEffect(() => {
    if (parentEl == null) return

    const state =
      editorState != null
        ? editorState
        : CodeMirror({
            code,
            setCode,
            setState: setEditorState,
            theme,
            languageExtensions,
          })

    const view = new EditorView({ state, parent: parentEl })
    setView(view)

    return () => {
      view.destroy()
      setView(null)
    }
  }, [parentEl])

  // on code to load
  useEffect(() => {
    if (view == null) return
    if (codeToLoad == null) return
    updateCode(view, codeToLoad)
    resetCodeToLoad()
  }, [view, codeToLoad, resetCodeToLoad])

  // on theme change
  useEffect(() => {
    if (view == null) return
    updateTheme(view, theme)
  }, [view, theme])

  return {
    setParentEl,
    code,
    setCodeToLoad,
    resetCodeToLoad,
    setLanguageExtensions,
  }
}

export const [EditorProvider, useEditorContext] = constate(useEditor)
