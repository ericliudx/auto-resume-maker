# Features

Traceable specs for slices of behavior. Everything here is geared toward **local verification** on your dev machine.

## Lifecycle

1. **Create** a folder: `features/in-progress/<kebab-case-name>/`
2. Add **`spec.md`**, **`plan.md`**, **`tasks.md`** (see `.specify/README.md` and `llm-prompt.txt`).
3. Optionally add **`api-shapes.md`** when contracts matter.
4. Implement and run through **local verification** in `plan.md`.
5. When done, **move** the entire folder to `features/completed/<kebab-case-name>/` (same name).

Do not leave “finished” work indefinitely under `in-progress/`; the folder location signals status.

## Empty queues

- `in-progress/` — active work only (may be empty).
- `completed/` — verified work (may be empty at repo start).

See `in-progress/README.md` for how to start a new feature folder.
