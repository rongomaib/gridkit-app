import { CodeMirror, updateCode, updateLanguageExtensions, updateTheme } from '@/editor'
import type { EditorState } from '@codemirror/state'
import { EditorView, type EditorViewConfig } from '@codemirror/view'
import { useColorModeValue } from '@villagekit/ui'
import type { Variant } from 'codemirror-theme-catppuccin'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

type EditorContextValue = {
  setParentEl: React.Dispatch<HTMLDivElement>
  code: string
  setCodeToLoad: React.Dispatch<string>
  resetCodeToLoad: React.Dispatch<void>
  setLanguageExtensions: React.Dispatch<NonNullable<EditorViewConfig['extensions']>>
}

function useEditor(): EditorContextValue {
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
    if (codeToLoad != null) {
      updateCode(view, codeToLoad)
      resetCodeToLoad()
    }

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

  // on language extensions change
  useEffect(() => {
    if (view == null) return
    updateLanguageExtensions(view, languageExtensions)
  }, [view, languageExtensions])

  return {
    setParentEl,
    code,
    setCodeToLoad,
    resetCodeToLoad,
    setLanguageExtensions,
  }
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorContextProvider(props: React.PropsWithChildren<void>) {
  const { children } = props
  return <EditorContext.Provider value={useEditor()}>{children}</EditorContext.Provider>
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext)
  if (context == null) {
    throw new Error('useEditorContext() must be wrapped with EditorContextProvider')
  }
  return context
}
