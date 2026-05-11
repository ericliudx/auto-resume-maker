# llm-api — api shapes

This feature introduces a **local-only** API surface used by the frontend to request LLM output while keeping provider credentials server-side.

## `POST /api/llm/chat`

### Request body

```json
{
  "system": "You are a helpful assistant.",
  "user": "Summarize this job posting in 5 bullets.",
  "model": "llama-3.1-8b-instant",
  "temperature": 0.2
}
```

- `system` (string, required): System instruction.
- `user` (string, required): User prompt content.
- `model` (string, optional): Provider model id; defaults server-side.
- `temperature` (number, optional): Defaults server-side.

### Success response (200)

```json
{
  "ok": true,
  "result": {
    "text": "…",
    "model": "llama-3.1-8b-instant",
    "usage": {
      "inputTokens": 123,
      "outputTokens": 456
    }
  }
}
```

Notes:

- `usage` may be omitted if the provider doesn’t return it.

### Error response (non-200)

```json
{
  "ok": false,
  "error": {
    "code": "missing_api_key",
    "message": "Missing GROQ_API_KEY in server environment."
  }
}
```

Error `code` values:

- `missing_api_key`
- `invalid_api_key`
- `rate_limited`
- `timeout`
- `provider_error`
- `bad_request`

