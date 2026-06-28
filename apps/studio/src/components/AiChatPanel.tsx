import { anthropicClient } from '@/lib/aiClient'
import type { AiChatHandle } from '@/lib/useAiChat'
import { useEffect, useRef, useState } from 'react'

interface AiChatPanelProps {
  chat: AiChatHandle
  footer?: React.ReactNode
}

export function AiChatPanel({ chat, footer }: AiChatPanelProps) {
  const { messages, isStreaming, streamingText, send } = chat
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  function handleSend() {
    const text = input.trim()
    if (!text || isStreaming) return
    setInput('')
    send(text)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showStreaming = isStreaming && streamingText

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          flexShrink: 0,
          padding: '8px 12px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 14 }}>Claude</span>
        <span
          style={{
            fontSize: 11,
            background: anthropicClient ? '#dcfce7' : '#fef9c3',
            color: anthropicClient ? '#166534' : '#92400e',
            padding: '1px 6px',
            borderRadius: 4,
            border: `1px solid ${anthropicClient ? '#86efac' : '#fde68a'}`,
          }}
        >
          {anthropicClient ? 'live' : 'no API key'}
        </span>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 0,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? '#2563eb' : '#f1f5f9',
                color: msg.role === 'user' ? '#fff' : '#1e293b',
                fontSize: 13,
                lineHeight: 1.5,
                whiteSpace: msg.role === 'user' ? 'pre-wrap' : undefined,
                wordBreak: 'break-word',
              }}
            >
              {msg.role === 'assistant' ? renderMarkdown(msg.content) : msg.content}
            </div>
          </div>
        ))}

        {showStreaming && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                maxWidth: '85%',
                padding: '8px 12px',
                borderRadius: '12px 12px 12px 2px',
                background: '#f1f5f9',
                color: '#1e293b',
                fontSize: 13,
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
            >
              {renderMarkdown(streamingText)}
              <span style={{ opacity: 0.4 }}>▌</span>
            </div>
          </div>
        )}

        {isStreaming && !streamingText && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '12px 12px 12px 2px',
                background: '#f1f5f9',
                color: '#94a3b8',
                fontSize: 13,
              }}
            >
              Thinking…
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid #e2e8f0',
          padding: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          placeholder="Describe what you want… (Enter to send)"
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            padding: '6px 10px',
            fontSize: 13,
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            outline: 'none',
            fontFamily: 'inherit',
            lineHeight: 1.5,
            opacity: isStreaming ? 0.5 : 1,
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          style={{
            padding: '6px 14px',
            background: input.trim() && !isStreaming ? '#2563eb' : '#cbd5e1',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: input.trim() && !isStreaming ? 'pointer' : 'default',
            fontSize: 13,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Send
        </button>
      </div>

      {footer}
    </div>
  )
}

const codeInlineStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '0.9em',
  background: 'rgba(0,0,0,0.1)',
  padding: '1px 4px',
  borderRadius: 3,
}

function renderInline(text: string, prefix: number): React.ReactNode {
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts: React.ReactNode[] = []
  let lastIdx = 0
  let i = 0

  for (;;) {
    const match = re.exec(text)
    if (match === null) break
    if (match.index > lastIdx) {
      parts.push(text.slice(lastIdx, match.index))
    }
    const raw = match[0]
    const k = `${prefix}-${i++}`
    if (raw.startsWith('`')) {
      parts.push(
        <code key={k} style={codeInlineStyle}>
          {raw.slice(1, -1)}
        </code>,
      )
    } else if (raw.startsWith('**')) {
      parts.push(<strong key={k}>{raw.slice(2, -2)}</strong>)
    } else {
      parts.push(<em key={k}>{raw.slice(1, -1)}</em>)
    }
    lastIdx = re.lastIndex
  }
  if (lastIdx < text.length) {
    parts.push(text.slice(lastIdx))
  }
  return <>{parts}</>
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  const output: React.ReactNode[] = []
  const pending: string[] = []
  let idx = 0

  const flushPara = () => {
    if (pending.length === 0) return
    const k = idx++
    output.push(
      <div key={k} style={{ marginBottom: 4 }}>
        {renderInline(pending.join(' '), k)}
      </div>,
    )
    pending.length = 0
  }

  for (const line of lines) {
    if (line.trim() === '') {
      flushPara()
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushPara()
      const k = idx++
      output.push(
        <div key={k} style={{ display: 'flex', gap: 6, paddingLeft: 8, marginBottom: 2 }}>
          <span style={{ flexShrink: 0 }}>•</span>
          <span>{renderInline(line.slice(2), k)}</span>
        </div>,
      )
    } else {
      pending.push(line)
    }
  }
  flushPara()

  return <>{output}</>
}
