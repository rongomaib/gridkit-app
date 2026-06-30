import { useCallback, useReducer, useRef, useState } from 'react'
import { useColorMode } from '@/context/colorMode'
import type { PartMakerSpec } from '@/lib/partMakerTypes'
import { defaultPartMakerSpec } from '@/lib/partMakerTypes'
import { generatePartFiles } from '@/lib/partCodegen'
import { PartMakerChat } from './PartMakerChat'
import { PartMakerCodeViewer } from './PartMakerCodeViewer'
import { PartMakerPreview } from './PartMakerPreview'

// fflate is bundled with Three.js — no extra dep needed
// @ts-ignore — no types on this path
import { zipSync, strToU8 } from 'three/examples/jsm/libs/fflate.module.js'

interface PartMakerProps {
  onBack: () => void
}

// ── undo/redo state ──────────────────────────────────────────────────────────

const MAX_HISTORY = 50

interface HistoryState {
  past: PartMakerSpec[]
  present: PartMakerSpec
}

type HistoryAction =
  | { type: 'change'; patch: Partial<PartMakerSpec> }
  | { type: 'undo' }
  | { type: 'reset'; spec: PartMakerSpec }

function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'change': {
      const next = { ...state.present, ...action.patch }
      const past = [...state.past, state.present]
      return {
        past: past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past,
        present: next,
      }
    }
    case 'undo': {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return { past: state.past.slice(0, -1), present: prev }
    }
    case 'reset': {
      return { past: [], present: action.spec }
    }
  }
}

// ── component ────────────────────────────────────────────────────────────────

export function PartMaker({ onBack }: PartMakerProps) {
  const { isDark } = useColorMode()

  const [{ past, present: spec }, dispatch] = useReducer(historyReducer, {
    past: [],
    present: defaultPartMakerSpec,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<{ text: string; ok: boolean } | null>(null)
  const [requestedCodeFile, setRequestedCodeFile] = useState<string | undefined>(undefined)
  const [showCode, setShowCode] = useState(true)
  const [previewWidth, setPreviewWidth] = useState(380)
  const bodyRef = useRef<HTMLDivElement>(null)

  const handleSpecChange = useCallback((patch: Partial<PartMakerSpec>) => {
    dispatch({ type: 'change', patch })
  }, [])

  const handleUndo = useCallback(() => {
    dispatch({ type: 'undo' })
  }, [])

  // ── save: pick parent dir → create part-name subdir → write all files ──────
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setStatus(null)
    try {
      const parentHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      const dirHandle = await parentHandle.getDirectoryHandle(spec.name, { create: true })
      const files = generatePartFiles(spec)

      for (const file of files) {
        const segments = file.name.split('/')
        const fileName = segments.pop()!
        let currentDir = dirHandle
        for (const segment of segments) {
          currentDir = await currentDir.getDirectoryHandle(segment, { create: true })
        }
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(file.content)
        await writable.close()
      }

      setStatus({ text: `Saved → ${spec.name}/`, ok: true })
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setStatus({ text: `Save failed: ${err?.message ?? 'Unknown error'}`, ok: false })
      }
    } finally {
      setIsSaving(false)
    }
  }, [spec])

  // ── load: pick spec.json → restore spec + reset history ───────────────────
  const handleLoad = useCallback(async () => {
    try {
      const [fileHandle] = await (window as any).showOpenFilePicker({
        types: [{ description: 'Part spec (spec.json)', accept: { 'application/json': ['.json'] } }],
        multiple: false,
      })
      const file = await fileHandle.getFile()
      const text = await file.text()
      const raw = JSON.parse(text)
      // Detect non-Part-Maker JSON (e.g. package.json opened by mistake)
      const looksLikePackageJson = 'main' in raw || 'scripts' in raw || 'dependencies' in raw
      if (looksLikePackageJson) {
        setStatus({ text: 'That looks like a package.json — open a spec.json saved by Part Maker instead.', ok: false })
        return
      }
      // Merge over defaults so any field missing from older saved files gets a safe value
      const loaded: PartMakerSpec = { ...defaultPartMakerSpec, ...raw }
      dispatch({ type: 'reset', spec: loaded })
      setStatus({ text: `Loaded "${loaded.displayName}"`, ok: true })
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setStatus({ text: `Load failed: ${err?.message ?? 'Unknown error'}`, ok: false })
      }
    }
  }, [])

  // ── zip backup: generate all files → zip in memory → trigger download ──────
  const handleZipBackup = useCallback(() => {
    try {
      const files = generatePartFiles(spec)
      const entries: Record<string, Uint8Array> = {}
      for (const f of files) {
        entries[`${spec.name}/${f.name}`] = strToU8(f.content)
      }
      const zipped: Uint8Array = zipSync(entries, { level: 6 })
      const blob = new Blob([zipped], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${spec.name}-backup.zip`
      a.click()
      URL.revokeObjectURL(url)
      setStatus({ text: `Downloaded ${spec.name}-backup.zip`, ok: true })
    } catch (err: any) {
      setStatus({ text: `ZIP failed: ${err?.message ?? 'Unknown error'}`, ok: false })
    }
  }, [spec])

  // ── divider drag ──────────────────────────────────────────────────────────
  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const onMouseMove = (ev: MouseEvent) => {
      if (!bodyRef.current) return
      setPreviewWidth(Math.max(220, Math.min(700, bodyRef.current.getBoundingClientRect().right - ev.clientX)))
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  const canUndo = past.length > 0

  const btnBase: React.CSSProperties = {
    padding: '4px 10px',
    border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    background: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          flexShrink: 0,
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
          flexWrap: 'wrap',
        }}
      >
        <button type="button" onClick={onBack}
          style={{ ...btnBase, color: isDark ? '#94a3b8' : '#475569' }}>
          ← Products
        </button>

        <span style={{ fontWeight: 600, fontSize: '15px', color: isDark ? '#e2e8f0' : '#1e293b' }}>
          Part Maker
        </span>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{spec.displayName}</span>

        <div style={{ flex: 1 }} />

        {/* Undo */}
        <button
          type="button"
          onClick={handleUndo}
          disabled={!canUndo}
          title={canUndo ? `Undo (${past.length} step${past.length === 1 ? '' : 's'} back)` : 'Nothing to undo'}
          style={{
            ...btnBase,
            color: canUndo ? (isDark ? '#e2e8f0' : '#1e293b') : (isDark ? '#334155' : '#cbd5e1'),
            borderColor: canUndo ? (isDark ? '#475569' : '#cbd5e1') : (isDark ? '#2d3748' : '#e2e8f0'),
            cursor: canUndo ? 'pointer' : 'default',
          }}
        >
          ↩ Undo{canUndo ? ` (${past.length})` : ''}
        </button>

        {/* Open */}
        <button type="button" onClick={handleLoad}
          title="Open a saved spec.json to continue editing"
          style={{ ...btnBase, color: isDark ? '#94a3b8' : '#475569' }}>
          Open
        </button>

        {/* ZIP backup */}
        <button type="button" onClick={handleZipBackup}
          title="Download all generated files as a ZIP backup"
          style={{ ...btnBase, color: isDark ? '#94a3b8' : '#475569' }}>
          ZIP backup
        </button>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          title="Pick a parent folder — saves into a new subfolder named after the part"
          style={{
            ...btnBase,
            backgroundColor: isDark ? '#1e40af' : '#2563eb',
            borderColor: 'transparent',
            color: '#fff',
            cursor: isSaving ? 'default' : 'pointer',
            opacity: isSaving ? 0.6 : 1,
          }}
        >
          {isSaving ? 'Saving…' : 'Save part'}
        </button>

        {/* Code toggle */}
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          style={{
            ...btnBase,
            background: showCode ? (isDark ? '#1e40af' : '#dbeafe') : 'none',
            color: isDark ? '#93c5fd' : '#2563eb',
            fontFamily: 'monospace',
          }}
        >
          {showCode ? '</> hide' : '</> code'}
        </button>

        {/* Status */}
        {status && (
          <span style={{ fontSize: '12px', color: status.ok ? '#16a34a' : '#dc2626' }}>
            {status.text}
          </span>
        )}
      </div>

      {/* 3-pane body */}
      <div ref={bodyRef} style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left: Chat */}
        <div
          style={{
            width: '320px',
            flexShrink: 0,
            borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PartMakerChat spec={spec} onSpecChange={handleSpecChange} />
        </div>

        {/* Center: Code viewer */}
        {showCode && (
          <>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                borderRight: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <PartMakerCodeViewer
                spec={spec}
                onSave={handleSave}
                isSaving={isSaving}
                requestedFile={requestedCodeFile}
              />
            </div>
            <div
              onMouseDown={handleDividerMouseDown}
              style={{
                width: '5px',
                flexShrink: 0,
                cursor: 'col-resize',
                backgroundColor: '#1e293b',
                opacity: 0.18,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.45' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.opacity = '0.18' }}
            />
          </>
        )}

        {/* Right: Preview */}
        <div
          style={{
            width: showCode ? `${previewWidth}px` : undefined,
            flex: showCode ? undefined : 1,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PartMakerPreview spec={spec} onFeatureClick={setRequestedCodeFile} />
        </div>
      </div>
    </div>
  )
}
