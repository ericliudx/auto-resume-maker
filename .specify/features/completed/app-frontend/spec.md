# app-frontend — spec

## User goal

As a user working locally, I want a simple UI where I can:

- View the current resume output (read-only preview)
- Paste a job posting text

So that future tailoring/page-fit features have an obvious place to plug in.

## Primary flows

### View resume

- When the app loads, the UI shows a **resume viewer** area.
- The viewer displays a resume representation that is readable and scrollable.
- The viewer supports **copy** (select/copy text) if the underlying format permits it.
- The viewer supports switching between:
  - **Resume**: the fitted 1-page-ish preview (default)
  - **Super-resume**: an untrimmed view listing **all** experiences and projects for manual verification
- The resume preview is shown in an app-only “page view” that may be **visually scaled** for easier side-by-side viewing. Print/PDF output is not affected.

### Paste job posting

- The UI shows a **job posting** input area (multi-line text box).
- The user can paste large text (typical job postings) and edit it.
- The current job posting text is visible after refresh according to the persistence choice documented in `plan.md`.

## Edge cases / invariants

- **Local-only**: No cloud assumptions, no multi-tenant behavior.
- **No secrets**: The UI must not require committing personal data (phone/address) or keys into the repo.
- **Large input**: The job posting box must remain usable for large pasted text (multi-kilobyte).
- **Offline**: Core UI should function without external network calls.

## Must not change (durable constraints)

- The experience bank under `bio/` remains the canonical source of truth for source material (see `.specify/vision.md`).
- This feature is only a frontend shell; it must not silently introduce domain rules into UI code (domain stays domain, per `.specify/architecture/index.md` boundaries).
- The locked resume template styling remains stable; app-shell styling can be refactored independently.

## Non-goals / out of scope (for this feature)

- Authentication, user accounts, or roles
- Cloud deployment, multi-user hosting, or sync
- Automatic job scraping/import
- Final PDF export fidelity or pagination rules (belongs to page-fit/export features)
