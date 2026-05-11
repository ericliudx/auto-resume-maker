# llm-api — plan

## Scope and boundaries

- **Area**: Adapters + local API boundary (and minimal frontend integration only to prove the call path).
- **Boundary rules**: Follow `.specify/architecture/index.md`:
  - Domain code (when it exists) must not depend on provider HTTP/SDK details.
  - Adapters talk to the outside world (LLM provider); they stay thin and normalize responses.
- **Local-only**: Runs on this machine; no cloud deployment assumptions.
- **Secrets**: Follow `.specify/memory/constitution.md` (never commit keys).

## Decisions (chosen in this implementation)

- **Provider**: Groq (free tier) via OpenAI-compatible Chat Completions API.
- **Credential location**: Local env var, e.g. `GROQ_API_KEY`, loaded from a gitignored `.env` file in the runtime that makes the outbound request.
- **Key safety**: The browser must not call Groq directly; requests go through a local server/proxy so the API key never reaches client bundles.
- **Response normalization**: Define a small internal result shape (e.g. `{ text, model, usage? }`) so the rest of the app doesn’t depend on Groq’s exact fields.

## Technical approach (implementation-agnostic)

- Add a **local-only LLM adapter** that can:
  - Build a chat completion request from `{ system, user, model, temperature? }`
  - Call Groq’s API using the server-side key
  - Normalize success responses into a small internal shape
  - Normalize errors into a small internal error shape (missing key, auth failure, rate limit, timeout, unknown)
- Add a minimal **local API endpoint** (or dev-server proxy route) that:
  - Accepts a small JSON body representing the chat request
  - Invokes the adapter
  - Returns the normalized result shape (or normalized error)
- Add a minimal frontend “smoke test” UI (only if needed) that can trigger one request and render the returned text.

## API shapes

Add `api-shapes.md` for this feature because we are introducing a stable local request/response contract (even if it’s only used by the frontend during local development).

## Verification plan (local)

- Run the existing frontend commands in `.specify/architecture/index.md`:
  - `npm run lint`
  - `npm run build`
- Manual checks:
  - With **no** `GROQ_API_KEY`, the app surfaces a clear “missing key” error (and indicates the env var name).
  - With an **invalid** key, the error is clearly an auth failure (no key echoed anywhere).
  - With a valid key, a basic prompt returns text successfully.
  - Provider downtime / rate limiting is surfaced as a retriable error vs configuration error.

