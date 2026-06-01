import { CodeMirror, updateCode, updateLanguageExtensions, updateTheme } from '@/editor'
import { EditorSelection, type EditorState } from '@codemirror/state'
import { EditorView, type EditorViewConfig } from '@codemirror/view'
import { useMediaQuery } from '@villagekit/ui'
import type { Variant } from 'codemirror-theme-catppuccin'
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

type EditorContextValue = {
  setParentEl: React.Dispatch<HTMLDivElement>
  code: string
  setCodeToLoad: React.Dispatch<string>
  resetCodeToLoad: React.Dispatch<void>
  setLanguageExtensions: React.Dispatch<NonNullable<EditorViewConfig['extensions']>>
  scrollToLine: (line: number) => void
}

function useEditor(): EditorContextValue {
  const [parentEl, setParentEl] = useState<HTMLDivElement | null>(null)

  const viewRef = useRef<EditorView | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)

  const [code, setCode] = useState<string>('')
  const [codeToLoad, setCodeToLoad] = useState<string | null>(null)
  const resetCodeToLoad = useCallback(() => setCodeToLoad(null), [])

  const [prefersDark] = useMediaQuery(['(prefers-color-scheme: dark)'])
  const theme: Variant = prefersDark ? 'mocha' : 'latte'

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
    viewRef.current = view
    if (codeToLoad != null) {
      updateCode(view, codeToLoad)
      resetCodeToLoad()
    }

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [parentEl])

  // on code to load
  useEffect(() => {
    if (viewRef.current == null) return
    if (codeToLoad == null) return
    updateCode(viewRef.current, codeToLoad)
    resetCodeToLoad()
  }, [codeToLoad, resetCodeToLoad])

  // on theme change
  useEffect(() => {
    if (viewRef.current == null) return
    updateTheme(viewRef.current, theme)
  }, [theme])

  // on language extensions change
  useEffect(() => {
    if (viewRef.current == null) return
    updateLanguageExtensions(viewRef.current, languageExtensions)
  }, [languageExtensions])

  const scrollToLine = useCallback((lineNumber: number) => {
    const view = viewRef.current
    if (view == null) return
    const line = view.state.doc.line(Math.max(1, Math.min(lineNumber, view.state.doc.lines)))
    view.dispatch({
      selection: EditorSelection.range(line.from, line.to),
      effects: EditorView.scrollIntoView(line.from, { y: 'center' }),
    })
    view.focus()
  }, [])

  return {
    setParentEl,
    code,
    setCodeToLoad,
    resetCodeToLoad,
    setLanguageExtensions,
    scrollToLine,
  }
}

const EditorContext = createContext<EditorContextValue | null>(null)

export function EditorProvider(props: React.PropsWithChildren<{}>) {
  const { children } = props
  return <EditorContext.Provider value={useEditor()}>{children}</EditorContext.Provider>
}

export function useEditorContext(): EditorContextValue {
  const context = useContext(EditorContext)
  if (context == null) {
    throw new Error('useEditorContext() must be wrapped with EditorProvider')
  }
  return context
}
