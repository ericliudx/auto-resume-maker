# In progress

This directory holds **active** feature specs. There is **no** real feature scaffolded here yet—only this README.

## When you start something new

1. Create `features/in-progress/<kebab-case-name>/` (example: `parse-resume-markdown`).
2. Add:
   - **`spec.md`** — What it does, flows, edge cases, invariants, explicit non-goals.
   - **`plan.md`** — How you’ll implement it and **exact local steps** to run and verify.
   - **`tasks.md`** — Checkboxes; should map to `plan.md`.
3. Add **`api-shapes.md`** only if inputs/outputs (HTTP, CLI, files) need a stable contract.
4. When verified on your machine, move the folder to `features/completed/<kebab-case-name>/`.

Use `.specify/llm-prompt.txt` as a template when kicking off work with an LLM or a structured brief.
