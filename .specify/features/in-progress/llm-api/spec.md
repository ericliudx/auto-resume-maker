# llm-api — spec

## User goal

As a user working locally, I want the app to be able to call a free-tier LLM (Groq) so that future features (tailoring, page-fit suggestions, summarization) can request model output without embedding provider details throughout the UI.

## Primary flows

### Make a chat completion request

- The app can send a prompt (system + user content) to an LLM provider and receive model output text.
- The request must support choosing a model name (provider-specific string) with a sensible default.
- The response returns:
  - The model output text
  - Basic usage metadata when available (tokens or equivalent)

### Handle missing or invalid credentials

- If credentials are missing, the app returns a clear, actionable error message indicating which env var is required.
- If credentials are invalid (401/403), the app returns a clear error message without leaking secrets.

## Edge cases / invariants

- **Local-only**: This is for local dev on this machine (or LAN), not a hosted multi-tenant service.
- **No secrets in git**: API keys must never be committed; the frontend must not require a hardcoded key.
- **Provider failures**: Timeouts, rate limits, and transient provider errors must be surfaced in a user-actionable way (retry guidance vs configuration issue).
- **Deterministic boundaries**: Domain logic must not depend directly on the Groq SDK/HTTP client; provider specifics stay in an adapter.

## Must not change (durable constraints)

- Provider credentials are loaded from local environment variables or gitignored files only.
- The UI must not ship with a provider API key or a “paste your key into the repo” flow.
- Any provider-specific response shape must be normalized before it is used elsewhere in the app.

## Non-goals / out of scope (for this feature)

- Prompt library design for tailoring/page-fit (belongs to the feature that uses it)
- Model evaluation, benchmarking, or automated prompt quality scoring
- Streaming UI / token-by-token rendering (can be added later)
- Hosting, user accounts, auth, or exposing the key-protected API to the public internet

