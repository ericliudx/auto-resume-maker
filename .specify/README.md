# `.specify/`

Small, traceable specs for **local-only** work on this machine (or LAN). No cloud tenancy, CDN, Kubernetes, heavy IAM, or production observability—unless explicitly added later.

## What lives here

| Path | Purpose |
|------|---------|
| `features/` | Per-feature folders: behavior (`spec.md`), approach (`plan.md`), checklist (`tasks.md`). Lifecycle: `in-progress/` → `completed/`. |
| `architecture/` | Where code *should* live, package boundaries, and how you **run** the app locally. |
| `memory/` | Durable rules: non-negotiables (`constitution.md`) and stack-specific habits (`coding-rules.md`). |

## Naming

- **Feature folders**: `kebab-case` under `features/in-progress/` (e.g. `export-resume-pdf`). Move the whole folder to `features/completed/<same-name>/` when verified locally.
- **Architecture area docs** (optional): one short file per major area under `architecture/<area>/`. If the repo is small, keep everything in `architecture/index.md` until a file would exceed ~150–200 lines—then split.

## When to update what

| Situation | Update |
|-----------|--------|
| New or changed **user-visible behavior** | Add/update `features/.../spec.md`, then `plan.md` and `tasks.md`. |
| New **API or data contract** (even local) | Consider `api-shapes.md` next to the feature specs. |
| New **module or boundary** | `architecture/index.md` (and a new `architecture/<area>/` file only if it keeps files small). |
| **Policy** (secrets, tests, style gates) | `memory/constitution.md` or `memory/coding-rules.md`. |
| **Reusable LLM / human brief** for a slice of work | Copy or adapt `llm-prompt.txt` at the start of the task. |

## “Done” on this machine

A feature is **done** when `tasks.md` is checked off **and** the verification steps in `plan.md` pass in your local environment (see `architecture/index.md` for run/test commands once filled in).
