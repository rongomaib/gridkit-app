import { generatePartFiles } from '@/lib/partCodegen'
import type { PartMakerSpec } from '@/lib/partMakerTypes'
import { javascript } from '@codemirror/lang-javascript'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { catppuccin } from 'codemirror-theme-catppuccin'
import { useCallback, useEffect, useRef, useState } from 'react'

interface PartMakerCodeViewerProps {
  spec: PartMakerSpec
  onSave: () => void
  isSaving: boolean
  requestedFile?: string
}

export function PartMakerCodeViewer({ spec, onSave, isSaving, requestedFile }: PartMakerCodeViewerProps) {
  const files = generatePartFiles(spec)
  const [activeFile, setActiveFile] = useState(() => files[0]?.name ?? '')
  const [flashFile, setFlashFile] = useState<string | null>(null)
  const prevRequestedFile = useRef<string | undefined>(undefined)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)

  // Reset to first file if active file no longer exists
  useEffect(() => {
    if (files.length > 0 && !files.find((f) => f.name === activeFile)) {
      setActiveFile(files[0]!.name)
    }
  }, [files, activeFile])

  // Switch tab and flash when driven from outside (click-to-code)
  useEffect(() => {
    if (!requestedFile || requestedFile === prevRequestedFile.current) return
    prevRequestedFile.current = requestedFile
    const match = files.find((f) => f.name === requestedFile)
    if (match) {
      setActiveFile(requestedFile)
      setFlashFile(requestedFile)
      setTimeout(() => setFlashFile(null), 600)
    }
  }, [requestedFile, files])

  const activeContent = files.find((f) => f.name === activeFile)?.content ?? ''

  // Mount CodeMirror editor once
  useEffect(() => {
    const container = editorContainerRef.current
    if (!container) return

    const state = EditorState.create({
      doc: '',
      extensions: [
        basicSetup,
        javascript({ typescript: true }),
        catppuccin('mocha'),
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': {
            overflow: 'auto',
            fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
            fontSize: '12px',
            lineHeight: '1.6',
          },
        }),
      ],
    })

    const view = new EditorView({ state, parent: container })
    editorViewRef.current = view

    return () => {
      view.destroy()
      editorViewRef.current = null
    }
  }, [])

  // Sync content whenever the active file changes
  useEffect(() => {
    const view = editorViewRef.current
    if (!view) return
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: activeContent,
      },
    })
  }, [activeContent])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSave()
      }
    },
    [onSave],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        backgroundColor: '#0f172a',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          flexShrink: 0,
          borderBottom: '1px solid #1e293b',
          backgroundColor: '#0f172a',
          scrollbarWidth: 'none',
        }}
      >
        {files.map((f) => {
          const isActive = f.name === activeFile
          const isFlashing = f.name === flashFile
          return (
            <button
              key={f.name}
              type="button"
              onClick={() => setActiveFile(f.name)}
              style={{
                padding: '8px 14px',
                border: 'none',
                borderBottom: isActive ? '2px solid #60a5fa' : '2px solid transparent',
                backgroundColor: isFlashing ? '#1d4ed8' : isActive ? '#1e293b' : 'transparent',
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: isActive ? '#e2e8f0' : '#64748b',
                whiteSpace: 'nowrap',
                fontWeight: isActive ? '600' : 'normal',
                transition: 'color 0.1s, background-color 0.3s',
              }}
            >
              {f.name}
            </button>
          )
        })}
      </div>

      {/* Code area — CodeMirror mounts here */}
      <div ref={editorContainerRef} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }} />

      {/* Footer / save bar */}
      <div
        style={{
          flexShrink: 0,
          padding: '10px 12px',
          borderTop: '1px solid #1e293b',
          backgroundColor: '#0f172a',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          style={{
            padding: '7px 18px',
            backgroundColor: isSaving ? '#334155' : '#2563eb',
            color: isSaving ? '#94a3b8' : '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: isSaving ? 'not-allowed' : 'pointer',
            fontWeight: '600',
            fontSize: '13px',
            transition: 'background-color 0.15s',
          }}
        >
          {isSaving ? 'Saving…' : 'Save Part to Disk'}
        </button>
        <span style={{ fontSize: '11px', color: '#475569' }}>
          {navigator.platform.includes('Mac') ? '⌘S' : 'Ctrl+S'} to save
        </span>
      </div>
    </div>
  )
}
