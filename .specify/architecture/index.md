# Architecture map (local runtime)

**Status:** Frontend bootstrapped (Vite + React). Backend/domain not yet implemented.

**Product context:** See [`vision.md`](../vision.md) (experience **bank**, **tailoring**, **page-fit** output).

## Planned or actual layout

| Area | Path / package (TODO) | Responsibility |
|------|------------------------|----------------|
| Entry / app shell | `frontend/` | Local web UI entrypoint and app shell |
| Core domain | `TODO` | Bank model, tailoring rules, layout/page-fit constraints |
| Adapters | `TODO` | Disk/persistence, export pipeline, local APIs (keep thin) |
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
- **Local config**: put secrets in `frontend/.env.local` (gitignored via `*.local`)
  - `GROQ_API_KEY` (required to call Groq)
  - `GROQ_MODEL` (optional default model id)

## Local Bio API (dev-server, read-only)

The app reads resume source material from the repo’s `bio/` folder via a local-only dev-server endpoint:

- **Endpoint**: `GET /api/bio/bank`
- **Returns**: aggregated JSON from `bio/education/`, `bio/experiences/`, `bio/projects/`, `bio/skills/`
- **Implementation**: Vite middleware in `frontend/vite.config.ts` (read-only)
- **Ordering**: `experiences` and `projects` are sorted **newest-first** by `dates.end_date` (missing ⇒ “present”) then `dates.start_date`. This keeps the resume output stable regardless of filenames.

The app also reads contact info from a single local file:

- **Endpoint**: `GET /api/bio/contact`
- **Reads**: `bio/contact.json`
- **Notes**: Validates required string fields (`name`, `location`, `phone`, `email`, `linkedin`, `github`) and returns `server_error` if the file shape is wrong.

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
