import Anthropic from '@anthropic-ai/sdk'

const apiKey = (import.meta as any).env?.VITE_ANTHROPIC_API_KEY as string | undefined

export const anthropicClient = apiKey
  ? new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  : null
