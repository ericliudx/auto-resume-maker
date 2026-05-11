# Product vision

**auto-resume** helps you ship **job-specific resumes** without fighting the page—and without maintaining ten copy-pasted variants.

## Problems this addresses

1. **Page fit** — Tailoring bullets and reordering sections often pushes content past one page (or leaves an awkward orphan line). Getting a polished, readable layout that **respects real page boundaries** is a recurring pain.
2. **Scattered source material** — Experiences and projects live in old resumes, notes, or fragments. Each tailored resume duplicates edits and drifts from the “full picture.”

## Core ideas

### Experience bank

A **single local bank** of everything you’ve done: roles, projects, bullets, skills, metrics—structured so it can be filtered, searched, and recombined. Tailoring means **selecting and refining from the bank**, not retyping from memory.

- **Disk shape (chosen):** Source material lives under **`bio/`** (see repo `bio/README.md`): **`bio/experiences/`** holds one JSON file per employment-style experience; other subfolders carry projects, education, skills, summaries, certs—not one monolithic blob.
- **Invariant:** The bank is the canonical store; tailored outputs are **views** derived from bank entries (plus job-specific tweaks), not forks that silently diverge.

### Tailored resume + page fit

For a given job (or template), you define **what to emphasize** (and optionally length constraints). The app helps produce a resume that:

- Pulls content from the bank by relevance or explicit picks.
- **Fits the target page geometry**—e.g. one printable page where that’s the goal, with predictable breaks and spacing—not “whatever the word processor does.”

**Non-goals (until you say otherwise):** Multi-user hosting, syncing across tenants, ATS “optimization” guarantees, or automating job applications end-to-end.

## How specs should trace back here

Future feature folders under `features/` should name which pillar they serve:

| Pillar | Example future slices (names only—not specs yet) |
|--------|-----------------------------------------------------|
| Bank | Import/export schema, CRUD UI or CLI, tagging, deduping |
| Tailoring | Job profile, pick rules, ordering, trimming |
| Page fit | Layout engine, pagination rules, preview vs export parity |

When behavior changes, update the relevant feature’s `spec.md` and keep this file stable unless the **north star** shifts.
