## Feature name
resume-template

## Goal
Generate tailored resumes while keeping a **fixed, consistent template** (section order, typography, spacing) so only the content varies.

## Non-goals
- Perfect typographic match to any specific PDF (we will match structure + constraints first).
- Cloud hosting or multi-tenant assumptions (local-only).
- Committing personal contact info (phone/address/etc) to git.

## User-visible behavior
- The app shows a **resume preview rendered from a locked template** (not a free-form text blob).
- The template has a fixed section order:
  - Header (name + contact line)
  - Education
  - Experience
  - Projects
  - Skills
- Contact fields are editable in the UI and stored locally in the browser (not committed).
- The resume preview can be printed/exported via the browser print dialog (user chooses “Save as PDF”).
- The app provides an optional **Super-resume** view that renders the same locked template but lists **all** experiences and projects (no page-fit trimming) for manual verification.

## Data sources
- Resume content (education/experiences/projects/skills) is loaded from the repo’s `bio/` JSON files at runtime via a **local-only** API served by the dev server.

## Invariants (“must not change”)
- Template structure (section order + headings) is stable and does not change during generation.
- Personal contact info is not written to tracked files.
- The local API only reads from disk; it does not modify the `bio/` bank.

