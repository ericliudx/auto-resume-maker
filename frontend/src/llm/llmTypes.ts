export type LlmChatResponse =
  | {
      ok: true
      result: {
        text: string
        model: string
        usage?: { inputTokens: number; outputTokens: number }
      }
    }
  | { ok: false; error: { code: string; message: string } }

