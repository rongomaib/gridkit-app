import { useCallback, useRef, useState } from 'react'
import { useColorMode } from '@/context/colorMode'
import type { PartMakerSpec } from '@/lib/partMakerTypes'
import { defaultPartMakerSpec } from '@/lib/partMakerTypes'
import { generatePartFiles } from '@/lib/partCodegen'
import { PartMakerChat } from './PartMakerChat'
import { PartMakerCodeViewer } from './PartMakerCodeViewer'
import { PartMakerPreview } from './PartMakerPreview'

interface PartMakerProps {
  onBack: () => void
}

export function PartMaker({ onBack }: PartMakerProps) {
  const { isDark } = useColorMode()
  const [spec, setSpec] = useState<PartMakerSpec>(defaultPartMakerSpec)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>('')
  const [requestedCodeFile, setRequestedCodeFile] = useState<string | undefined>(undefined)
  const [previewWidth, setPreviewWidth] = useState(380)
  const bodyRef = useRef<HTMLDivElement>(null)

  const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()

    const onMouseMove = (ev: MouseEvent) => {
      if (!bodyRef.current) return
      const rect = bodyRef.current.getBoundingClientRect()
      const newWidth = Math.max(220, Math.min(700, rect.right - ev.clientX))
      setPreviewWidth(newWidth)
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

  const handleSpecChange = useCallback((patch: Partial<PartMakerSpec>) => {
    setSpec((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveStatus('')
    try {
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' })
      const files = generatePartFiles(spec)

      for (const file of files) {
        const parts = file.name.split('/')
        const fileName = parts.pop()!
        let currentDir = dirHandle
        for (const segment of parts) {
          currentDir = await currentDir.getDirectoryHandle(segment, { create: true })
        }
        const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(file.content)
        await writable.close()
      }

      setSaveStatus(`Saved ${files.length} files to "${dirHandle.name}".`)
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        setSaveStatus(`Error: ${err?.message ?? 'Unknown error'}`)
      }
    } finally {
      setIsSaving(false)
    }
  }, [spec])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 16px',
          borderBottom: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
          flexShrink: 0,
          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            padding: '4px 10px',
            background: 'none',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '13px',
            color: '#475569',
          }}
        >
          ← Products
        </button>
        <span style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>Part Maker</span>
        <span style={{ fontSize: '13px', color: '#94a3b8' }}>{spec.displayName}</span>
        {saveStatus && (
          <span style={{ fontSize: '12px', color: saveStatus.startsWith('Error') ? '#dc2626' : '#16a34a', marginLeft: 'auto' }}>
            {saveStatus}
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
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PartMakerChat
            spec={spec}
            onSpecChange={handleSpecChange}
          />
        </div>

        {/* Center: Code viewer */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <PartMakerCodeViewer spec={spec} onSave={handleSave} isSaving={isSaving} requestedFile={requestedCodeFile} />
        </div>

        {/* Drag handle: center | right */}
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

        {/* Right: Preview */}
        <div
          style={{
            width: `${previewWidth}px`,
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
