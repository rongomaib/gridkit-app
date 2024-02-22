import { EditorState, Compartment } from '@codemirror/state'
import { basicSetup } from 'codemirror'
import { EditorView, EditorViewConfig } from '@codemirror/view'
import { catppuccin, Variant } from 'codemirror-theme-catppuccin'
import { variants } from '@catppuccin/palette'

import { createDiagnosticTheme, createDiagnosticGutterTheme } from './theme'
import { createIdler } from './idle'

export type CodeMirrorOptions = {
  code: string
  setCode: (code: string) => void
  setState: (state: EditorState) => void
  theme: Variant
  languageExtensions: NonNullable<EditorViewConfig['extensions']>
}

const themeCompartment = new Compartment()
const languageCompartment = new Compartment()

export function CodeMirror(options: CodeMirrorOptions) {
  const { theme, code, setCode, setState, languageExtensions } = options

  const idler = createIdler(
    (view) => {
      const code = view.state.sliceDoc()
      setCode(code)
    },
    {
      delay: 50,
    },
  )

  return EditorState.create({
    doc: code,
    extensions: [
      basicSetup,
      EditorView.updateListener.of((ev) => {
        setState(ev.state)
      }),
      idler,
      themeCompartment.of([
        catppuccin(theme),
        createDiagnosticTheme(variants[theme]),
        createDiagnosticGutterTheme(variants[theme]),
      ]),
      languageCompartment.of(languageExtensions),
    ],
  })
}

export function updateTheme(view: EditorView, theme: Variant) {
  view.dispatch({
    effects: [
      themeCompartment.reconfigure([
        catppuccin(theme),
        createDiagnosticTheme(variants[theme]),
        createDiagnosticGutterTheme(variants[theme]),
      ]),
    ],
  })
}

export function updateCode(view: EditorView, code: string) {
  view.dispatch({
    changes: {
      from: 0,
      to: view.state.doc.length,
      insert: code,
    },
  })
}

export function updateLanguageExtensions(
  view: EditorView,
  extensions: NonNullable<EditorViewConfig['extensions']>,
) {
  view.dispatch({
    effects: [languageCompartment.reconfigure(extensions)],
  })
}
