# llm-tailor — spec

## User goal

As a user tailoring locally, I want the app to call the existing Groq-backed `POST /api/llm/chat` with my pasted job posting plus the canonical tailoring instructions and the read-only bio bank, so the model returns a tailor plan JSON (and optional gap notes) that the app applies automatically to the derived resume view.

## Primary flows

### LLM tailor from job posting

- User pastes a job posting in the Job posting panel.
- User clicks **Tailor** in the LLM panel.
- The app loads the bio bank from `GET /api/bio/bank`, builds a user prompt from `.specify/general-tailor-llm-prompt.txt` plus aggregated bank JSON plus the job text plus a **deterministic ATS keyword appendix** (same extraction and scoring as **Analyze ATS**, using the panel’s Role and Keywords limit), and sends a **single** request to `POST /api/llm/chat`.
- On success, the app parses the model output (JSON object, optionally followed by a `BIGGEST_GAPS:` section), validates the plan, applies it to a derived bank (same rules as before: selection up to **3 experiences** and **3 projects**, bullets capped to **2 per experience** and **2 per project**, technical skills row, print filename), applies `relevantCourses` to the `course_bank` education doc when present, persists the patch to `localStorage`, and refreshes the preview.
- ATS role and keyword limit controls update from the plan’s `role` and `keywordLimit` when possible, and **Analyze ATS** is re-run so scores align.

### Deterministic plan (unchanged)

- Pasting a plan and **Apply plan (deterministic)** still works as before.

## Edge cases / invariants

- **No smoke test**: The old “Run” LLM smoke path is removed; the LLM panel is for tailoring and ATS flows only.
- **No separate ATS LLM tailor**: There is no second provider call only for ATS; keyword gaps are bundled into the main **Tailor** prompt. **Analyze ATS** remains a client-only preview of score and missing terms.
- **Bio bank read-only**: The app never writes back to `bio/` files.
- **Invalid model output**: Malformed JSON, missing required fields, unknown IDs, or invalid `pdfFileName` surfaces a clear error; raw output may be shown for debugging.
- **Course list**: `relevantCourses` is stored on the persisted `TailorModelResult` patch and reapplied on load (main app, print route, ATS analysis, and hydration from `localStorage`).

## Must not change

- Provider key stays server-side; browser calls only the local dev proxy.
- Locked resume template structure and print CSS remain unchanged.
- No claims of guaranteed ATS outcomes.

## Non-goals

- Hosting, multi-user auth, or exposing the LLM proxy publicly.
- Writing tailored content back into the canonical bio JSON files.
