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
