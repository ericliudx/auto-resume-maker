# Architecture map (local runtime)

**Status:** Stack and layout not chosen yet. Replace `TODO` sections after bootstrap.

## Planned or actual layout

| Area | Path / package (TODO) | Responsibility |
|------|------------------------|----------------|
| Entry / app shell | `TODO` | How the process starts; wires config and UI or CLI |
| Core domain | `TODO` | Business rules for this project (name when known) |
| Adapters | `TODO` | File I/O, local services, LAN calls—keep thin |
| Tests | `TODO` | Unit / integration layout for this stack |

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
