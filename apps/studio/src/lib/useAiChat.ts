import type Anthropic from '@anthropic-ai/sdk'
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages'
import { useCallback, useRef, useState } from 'react'
import { anthropicClient } from './aiClient'
import type { ChatMessage } from './chatTypes'

const DEFAULT_MODEL = 'claude-sonnet-4-6'

export interface AiChatConfig {
  systemPrompt: string
  tools: Anthropic.Tool[]
  onToolUse: (name: string, input: unknown) => string
  model?: string
  initialMessages?: ChatMessage[]
}

export interface AiChatHandle {
  messages: ChatMessage[]
  isStreaming: boolean
  streamingText: string
  send: (text: string) => Promise<void>
  reset: (newInitialMessages?: ChatMessage[]) => void
}

export function useAiChat(config: AiChatConfig): AiChatHandle {
  const configRef = useRef(config)
  configRef.current = config

  const [messages, setMessages] = useState<ChatMessage[]>(() => config.initialMessages ?? [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const apiHistoryRef = useRef<MessageParam[]>([])
  const busyRef = useRef(false)

  const reset = useCallback((newInitialMessages?: ChatMessage[]) => {
    setMessages(newInitialMessages ?? configRef.current.initialMessages ?? [])
    setStreamingText('')
    apiHistoryRef.current = []
  }, [])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || busyRef.current) return

    const userMsg: ChatMessage = { id: `${Date.now()}-user`, role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    apiHistoryRef.current = [...apiHistoryRef.current, { role: 'user', content: text }]

    if (!anthropicClient) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content:
            'No API key configured. Set VITE_ANTHROPIC_API_KEY in apps/studio/.env and restart the dev server.',
        },
      ])
      return
    }

    busyRef.current = true
    setIsStreaming(true)
    setStreamingText('')

    try {
      const { systemPrompt, tools, onToolUse, model = DEFAULT_MODEL } = configRef.current
      let accumulated = ''

      const stream = anthropicClient.messages.stream({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: apiHistoryRef.current,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          accumulated += event.delta.text
          setStreamingText(accumulated)
        }
      }

      const final = await stream.finalMessage()
      let followUpText = ''

      for (const block of final.content) {
        if (block.type === 'tool_use') {
          const toolResult = onToolUse(block.name, block.input)

          apiHistoryRef.current = [
            ...apiHistoryRef.current,
            { role: 'assistant', content: final.content },
            {
              role: 'user',
              content: [{ type: 'tool_result', tool_use_id: block.id, content: toolResult }],
            },
          ]

          const followUp = await anthropicClient.messages.create({
            model,
            max_tokens: 512,
            system: systemPrompt,
            tools,
            messages: apiHistoryRef.current,
          })

          followUpText = followUp.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('')

          apiHistoryRef.current = [
            ...apiHistoryRef.current,
            { role: 'assistant', content: followUp.content },
          ]
          break
        }
      }

      if (!final.content.some((b) => b.type === 'tool_use')) {
        apiHistoryRef.current = [
          ...apiHistoryRef.current,
          { role: 'assistant', content: final.content },
        ]
      }

      const displayText = followUpText || accumulated || '(no response)'
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: 'assistant', content: displayText },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-err`,
          role: 'assistant',
          content: `Error: ${err?.message ?? 'Unknown error'}`,
        },
      ])
    } finally {
      busyRef.current = false
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [])

  return { messages, isStreaming, streamingText, send, reset }
}
