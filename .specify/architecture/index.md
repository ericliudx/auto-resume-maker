# Architecture map (local runtime)

**Status:** Frontend (Vite + React) with tailoring and bio read modeled in-app; persistence is browser `localStorage` plus read-only `bio/` on disk via Vite middleware (no separate backend service).

**Product context:** See [`vision.md`](../vision.md) (experience **bank**, **tailoring**, **page-fit** output).

## Planned or actual layout

| Area | Path / package | Responsibility |
|------|------------------|----------------|
| Entry / app shell | `frontend/` | Local web UI entrypoint and app shell |
| Core domain (bank + tailor) | `frontend/src/resume/data/`, `frontend/src/tailor/` | Bio bank types, tailor patch shape, apply pipeline, `useResumeData` merge with stored patch |
| Bio bank panel (read-only UI) | `frontend/src/components/bioBankViewer/` | Full-disk bio viewer: section cards, contact block, JSON collapsibles; `useBioBankPanelData` fetches bank + contact when the tab is active |
| Resume UI + fit | `frontend/src/resume/` (excluding `data/` as “domain types”) | Template, fitter, previews, print route |
| Adapters | `frontend/vite.config.ts` (middleware) | Local-only `GET /api/bio/*`, `POST /api/llm/chat` |
| Tests | `frontend/` (TBD) | Frontend lint/typecheck now; add tests when behavior warrants |

## Experience bank on disk

- **Root folder:** Repo-relative [`bio/`](../../bio/README.md)—see that README for sibling folders (`experiences/`, `projects/`, etc.).
- **Convention:** One **experience** ⇒ one **`bio/experiences/*.json`** file (role, internship, freelance engagement, etc.—whatever you treat as atomic in the domain).
- **Why:** Cleaner git history than a single huge file; you can rename/move one experience without rewriting the bank.
- **TODO:** Filename scheme (stable **`id`** in the JSON + `'<id>.json'` works well) and shared **JSON Schema** once fields settle.

## Boundaries

- **Domain** should not depend on framework-specific HTTP or UI details (adjust if you pick a minimal script-only stack).
- **Adapters** talk to the outside world (disk, subprocess, local APIs); they do not encode core rules.
- **Configuration** for local dev: env files or `.env` **gitignored**; never commit secrets (see `memory/constitution.md`).
- **Styling split**: app-shell UI can evolve (Tailwind utilities/components), but the resume template/print styling should remain stable unless explicitly changing the template.

## Styling (Tailwind + CSS)

The frontend uses Tailwind for the app shell while keeping the resume template styling locked:

- **Tailwind**: configured in `frontend/tailwind.config.cjs` and wired via PostCSS (`frontend/postcss.config.js`). Utilities are available in TSX components.
- **Globals**: CSS variables + baseline remain in `frontend/src/index.css`.
- **Resume template styling**: injected by `frontend/src/resume/ui/ResumeScope.tsx` via an inline `<style>` tag, scoped under `.resumeScope` so it doesn’t leak.
  - CSS is composed from `frontend/src/resume/styles/resumeCssShell.ts`, `frontend/src/resume/styles/resumeCssTemplate.ts`, and `frontend/src/resume/styles/resumeCssPrint.ts` (assembled in `frontend/src/resume/styles/resumeCss.ts`).
- **Note**: Tailwind “preflight” is disabled to avoid global resets changing the resume template’s typography/lists.

## Local LLM API (dev-server proxy)

The `llm-api` feature currently implements a **local-only** LLM proxy inside the Vite dev server:

- **Endpoint**: `POST /api/llm/chat`
- **Why**: Keep `GROQ_API_KEY` server-side; the browser should never call the provider directly.
- **Implementation**: Vite middleware in `frontend/vite.config.ts`
- **Resume tailor prompt**: The in-app **Tailor** action builds the LLM user message from `.specify/general-tailor-llm-prompt.txt` (bundled as raw text in `frontend/src/tailor/tailorPrompt.ts`) plus aggregated `bio/` JSON and the pasted job posting.
- **Local config**: put secrets in `frontend/.env.local` (gitignored via `*.local`)
  - `GROQ_API_KEY` (required to call Groq)
  - `GROQ_MODEL` (optional default model id)

## Local Bio API (dev-server, read-only)

The app reads resume source material from the repo’s `bio/` folder via a local-only dev-server endpoint:

- **Endpoint**: `GET /api/bio/bank`
- **Returns**: aggregated JSON from `bio/experiences/`, `bio/projects/`, `bio/education/`, `bio/skills/`, plus `bio/summaries/` and `bio/certifications/` (empty arrays when those folders are missing or have no `.json` files yet).
- **Implementation**: Vite middleware in `frontend/vite.config.ts` (read-only)
- **Ordering**: `experiences` and `projects` are sorted **newest-first** by `dates.end_date` (missing ⇒ “present”) then `dates.start_date`. This keeps the resume output stable regardless of filenames.

The app also reads contact info from a single local file:

- **Endpoint**: `GET /api/bio/contact`
- **Reads**: `bio/contact.json`
- **Notes**: Validates required string fields (`name`, `location`, `phone`, `email`, `linkedin`, `github`) and returns `server_error` if the file shape is wrong.

## Tailoring (browser-local derived bank)

- **Canonical source** remains on disk under `bio/` (loaded read-only via `GET /api/bio/bank`). The app never writes tailored content back into those JSON files.
- **Derived bank**: A saved **`TailorModelResult`** patch (see `frontend/src/tailor/tailorTypes.ts`) is merged over the fetched bank: experience/project **selection and ordering**, optional **bullet/header/title** overrides, **technical** skills row only, optional ATS keyword metadata, **`pdfFileName`** for print/PDF titling, and optional **`relevantCourses`** (subset of names for the `course_bank` education doc).
- **Persistence**: `frontend/src/tailor/tailorStorage.ts` stores JSON in **`localStorage`** under the key **`auto-resume.tailorPatch.v1`** (`saveTailorPatch` / `loadTailorPatch` / `clearTailorPatch`).
- **Single apply entrypoint**: `frontend/src/tailor/tailorBank.ts` **`applyTailorPatchToBank`** runs **`applyTailorResult`** then, when the patch includes it, **`applyRelevantCourses`**. Use this anywhere the stored patch is replayed so reload, print, ATS scoring, and the main preview stay consistent.
- **Where patches are produced**: LLM **Tailor** (one user message: `.specify/general-tailor-llm-prompt.txt` + bio JSON + job posting + deterministic ATS appendix from `frontend/src/tailor/atsContextForTailorPrompt.ts`, bundled in `frontend/src/tailor/tailorPrompt.ts`; response parsed in `frontend/src/tailor/llmTailorResponse.ts`, validated in `frontend/src/tailor/validateTailor.ts`), and pasted deterministic / JSON plans (`frontend/src/tailor/parseTailorPlan.ts`, `frontend/src/tailor/deterministicTailor.ts`). The ATS panel still runs **Analyze ATS** client-side for score/missing lists; it does not use a second LLM tailor call.

## How to run locally

```text
cd frontend
npm install
npm run dev

# then open:
http://localhost:5173/
```

## How to test locally

```text
cd frontend
npm run lint
npm run build
```

## Optional area docs

Add `architecture/<area>/` with a short `README.md` (or focused topic file) only when `index.md` would exceed ~150–200 lines or when a subsystem deserves its own boundary diagram in prose.
