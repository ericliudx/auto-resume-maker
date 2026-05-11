# llm-tailor — plan

## Scope and boundaries

- **Area(s)**: Frontend (tailoring UI + resume rendering), local adapters usage (LLM + bio bank read), minimal domain-ish logic in frontend until a separate `domain/` area exists.
- **Boundary rules** (from `.specify/architecture/index.md`):
  - Provider specifics stay behind the local LLM API; the rest of the app consumes normalized results only.
  - The local bio API is read-only; tailoring must not modify `bio/`.
  - Resume template structure and scoped CSS remain stable.
- **Local-only**: No cloud/multi-tenant assumptions.

## Decisions

- **Use existing APIs**:
  - LLM calls go through `POST /api/llm/chat`.
  - Bank data comes from `GET /api/bio/bank` and `GET /api/bio/contact`.
- **No new API shapes** for this feature initially: tailoring is implemented as frontend behavior using existing local endpoints. If we add a new local endpoint (e.g. `POST /api/tailor`), we will add `api-shapes.md` then.

## Technical approach

- Add a tailoring UI that collects:
  - Job description text
  - Optional fit settings (e.g. one-page fit on/off)
  - Optional “lock/boost” selections for experiences/projects (if already supported by UI state patterns)
- Add an ATS match report that:
  - Extracts a ranked keyword/skill phrase list from the job posting
  - Scores coverage against the current resume content (covered vs missing)
  - Makes “what to fix next” obvious (top missing terms)
- Implement a deterministic “tailor request builder” that:
  - Builds the LLM prompt using the job description + selected bank entries
  - Explicitly instructs the model to avoid fabrications and to preserve factual fields
  - Requests structured output (e.g. JSON) so the app can map it back into the resume template
- Implement an “ATS-tailor” prompt mode that:
  - Inputs the top missing keywords
  - Requires the model to return a `keywordMap` showing where each keyword was placed
  - Requires `cannotAdd` for keywords that would be fabrication
- Map the model output into the existing resume rendering pipeline:
  - Keep the template fixed; only swap in the tailored content fields.
- Use (or extend) the existing resume fit logic to meet one-page constraints:
  - Prefer trimming/condensing content rather than altering typography/CSS.
- Expose “what changed”:
  - Show trimmed/omitted bullets/entries for review (simple UI list is sufficient).

## Implementation sequence

- Build prompt + response parsing path using the existing LLM API.
- Wire tailoring output into the existing resume model/rendering layer.
- Add fit controls and connect them to the fitter.
- Add a basic diff/omissions display for transparency.

## Verification plan (local)

Use the existing commands in `.specify/architecture/index.md`:

- `cd frontend && npm run lint`
- `cd frontend && npm run build`

Manual checks:

- Tailoring works with a valid `GROQ_API_KEY` and returns a usable resume preview.
- With no/invalid key, errors remain actionable and do not leak secrets.
- Tailoring does not write to `bio/` (no file changes under `bio/` after runs).
- Template structure stays locked (section order/headings unchanged).
- One-page fit mode reduces content (by trimming/condensing) rather than changing global CSS.
- ATS match report is computed and shows covered/missing keywords and a score.
- ATS-tailor increases the score (or visibly increases coverage of top missing keywords) without introducing fabricated claims.

