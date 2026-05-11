import type { LlmChatResponse } from './llmTypes'

export async function llmChat(body: {
  system: string
  user: string
  temperature?: number
  model?: string
}): Promise<LlmChatResponse> {
  const res = await fetch('/api/llm/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  return (await res.json()) as LlmChatResponse
}

