## Approach

### Template
- Implement a **single locked resume template** as React components with dedicated CSS for screen + print.
- Keep the template’s section order and headings fixed.
- Allow only controlled variation:
  - Bullet selection/order (future)
  - Small text substitutions (e.g. course subset, skill ordering)

### Local-only data access
- Add a Vite dev-server middleware endpoint:
  - `GET /api/bio/bank` → returns aggregated JSON from `../bio/**.json`
- The endpoint is read-only and intended only for local preview/generation.

### Contact info
- Provide a small UI panel to edit contact fields.
- Store contact fields in `localStorage` so they remain local and uncommitted.

### Export
- Provide a “Print / Save PDF” button that opens a print-friendly view and triggers the browser print dialog.

## File ownership / boundaries
- `frontend/vite.config.ts`: local-only API middleware (adapter).
- `frontend/src/resume/*`: template + render logic (UI/domain-ish).
- `bio/`: source material on disk (human edited).

## Verification (local)
- Run `npm run dev` and confirm:
  - Resume preview renders from `bio/` data (not `public/resume.txt`).
  - Template headings/order are correct and stable.
  - Contact edits persist across refresh.
  - Print view renders cleanly and fits on page.
- Run `npm run lint` and `npm run build`.

