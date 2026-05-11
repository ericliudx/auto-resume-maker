# app-frontend — plan

## Scope and boundaries

- **Area**: Frontend UI only.
- **Boundary rules**: Follow `.specify/architecture/index.md`:
  - UI should not encode core domain rules.
  - Any persistence, file IO, or subprocess integration should live in adapters (once the stack exists).
- **Local-only**: The app runs on this machine (or LAN if later configured), not as a multi-tenant hosted service.

## Decisions (chosen in this implementation)

- **UI stack**: Vite + React (TypeScript), located at `frontend/`
- **Resume preview source**: Static local file served by Vite dev server, `frontend/public/resume.txt`
- **Job posting persistence**: Browser `localStorage` (key: `auto-resume.jobPosting.v1`)

## Technical approach (implementation-agnostic)

- Create a small app shell with two main regions:
  - **Resume viewer**: renders resume content read-only
  - **Job posting input**: multiline text area
- Keep UI state management simple:
  - One state value for `jobPostingText`
  - One state value for `resumePreview` (string/structured) or a reference to a local file
- Persistence (pick one and document in code + tests/manual checks):
  - **Option A (simplest)**: browser local storage
  - **Option B**: repo-relative local file (via a local backend or file adapter)
  - **Option C**: memory-only (explicitly noted as a limitation)

## API shapes

Skip `api-shapes.md` for this feature because there are no stable request/response contracts yet (no endpoints, and no non-trivial structured IO being depended upon). If/when we add a local HTTP API or define a resume preview format contract, add it then.

## Verification plan (local)

- Run the commands in `.specify/architecture/index.md`:
  - `npm run lint`
  - `npm run build`
- Manual checks:
  - The UI presents both regions: resume viewer and job posting text box
  - Pasting a multi-paragraph job posting remains responsive and editable
  - Refresh persists the job posting text (via `localStorage`)
