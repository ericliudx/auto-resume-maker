# llm-tailor — plan

## Approach

- **Prompt assembly**: `frontend/src/tailor/tailorPrompt.ts` imports `.specify/general-tailor-llm-prompt.txt` at build time via Vite `?raw`, then appends the aggregated bank from `makeBankForPrompt(bank)`, the job posting, and a deterministic **ATS appendix** from `frontend/src/tailor/atsContextForTailorPrompt.ts` (same `extractAtsKeywords` + `computeAtsMatchReport` stack as **Analyze ATS**, parameterized by the panel Role + Keywords limit). One LLM call; no separate ATS-only tailor prompt file.
- **Response handling**: New `frontend/src/tailor/llmTailorResponse.ts` splits optional `BIGGEST_GAPS`, extracts the first balanced JSON object (string-aware), maps `experiencePatches` / `projectPatches` / `skillsGroups` (and legacy `experiences` / `projects` / `skills`) into `TailorModelResult`, and reads `relevantCourses`, `role`, and `keywordLimit` for ATS UI sync.
- **Apply path**: Reuse `validateTailorResult` + `applyTailorResult` + `saveTailorPatch`. Share `applyRelevantCourses` in `tailorBank.ts` with the deterministic apply path.
- **UI**: Remove the smoke-test button and related hook API; rename panel copy to “LLM (tailor + ATS)”.
- **ATS sync after tailor**: `useLlmTools` accepts an optional callback stored in a ref so `App` can update ATS controls and re-run analysis without stale closures.

## api-shapes.md

Skipped: no changes to `POST /api/llm/chat` or bio endpoints.

## Verification

- `cd frontend && npm run build` (TypeScript + Vite build).
- Manual: `npm run dev`, paste posting, **Tailor** with valid `GROQ_API_KEY` (optional if not testing live).
