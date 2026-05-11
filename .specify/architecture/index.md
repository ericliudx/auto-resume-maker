# Architecture map (local runtime)

**Status:** Stack and layout not chosen yet. Replace `TODO` sections after bootstrap.

**Product context:** See [`vision.md`](../vision.md) (experience **bank**, **tailoring**, **page-fit** output).

## Planned or actual layout

| Area | Path / package (TODO) | Responsibility |
|------|------------------------|----------------|
| Entry / app shell | `TODO` | How the process starts; wires config and UI or CLI |
| Core domain | `TODO` | Bank model, tailoring rules, layout/page-fit constraints (names TBD per stack) |
| Adapters | `TODO` | Persistence (local files/DB), print/PDF or export pipeline—keep thin |
| Tests | `TODO` | Unit / integration layout for this stack |

## Experience bank on disk

- **Root folder:** Repo-relative [`bio/`](../../bio/README.md)—see that README for sibling folders (`experiences/`, `projects/`, etc.).
- **Convention:** One **experience** ⇒ one **`bio/experiences/*.json`** file (role, internship, freelance engagement, etc.—whatever you treat as atomic in the domain).
- **Why:** Cleaner git history than a single huge file; you can rename/move one experience without rewriting the bank.
- **TODO:** Filename scheme (stable **`id`** in the JSON + `'<id>.json'` works well) and shared **JSON Schema** once fields settle.

## Boundaries

- **Domain** should not depend on framework-specific HTTP or UI details (adjust if you pick a minimal script-only stack).
- **Adapters** talk to the outside world (disk, subprocess, local APIs); they do not encode core rules.
- **Configuration** for local dev: env files or `.env` **gitignored**; never commit secrets (see `memory/constitution.md`).

## How to run locally

```text
TODO: install deps (e.g. package manager + command)
TODO: dev server or CLI entry (exact command)
TODO: optional LAN URL or bind address if applicable
```

## How to test locally

```text
TODO: single command that contributors run before calling a feature “done”
TODO: lint/typecheck if applicable
```

## Optional area docs

Add `architecture/<area>/` with a short `README.md` (or focused topic file) only when `index.md` would exceed ~150–200 lines or when a subsystem deserves its own boundary diagram in prose.
