# Feature: bio-bank — Bio bank viewer

## User goal

Inspect **all on-disk bio material** the app can read from `bio/`, plus see whether a **tailored (derived) bank** is active, in a **human-readable** layout—not only raw JSON.

## Flows

1. User opens the main panel **Bio bank** tab.
2. The viewer always loads the **full** aggregated bank from `GET /api/bio/bank` (every experience/project/education/skills/summaries/certifications file on disk).
3. The viewer loads **`bio/contact.json`** via `GET /api/bio/contact` when present; if missing or invalid, it shows a clear empty/error state (without blocking bank sections).
4. Sections appear in a stable order: Contact → Experiences → Projects → Education → Skills → Summaries → Certifications, then an optional collapsed **full bank JSON** dump for debugging. When a tailor patch is active, **Resume** tags and a separate collapsible **tailored snapshot JSON** indicate the resume subset without hiding on-disk items.

## Edge cases / invariants

- **Tailor vs catalog:** The readable list is always the **on-disk** bank. A saved tailor patch adds **Resume** markers on experiences/projects that appear on the tailored resume and exposes the derived bank as JSON only (resume previews elsewhere still use the merged bank).
- **Empty folders:** `summaries/` and `certifications/` may be empty; show a short “none yet” line, not an error.
- **Malformed JSON on disk:** Bank endpoint continues to fail fast (500) as today; contact endpoint returns structured errors; viewer surfaces messages readably.
- **Must not change:** Resume template, print route, and tailor apply pipeline semantics aside from carrying optional extra bank fields through unchanged.

## Non-goals (this iteration)

- Editing or writing bio files from the UI.
- New persistence beyond existing APIs.
- Cloud or multi-user hosting assumptions.

## Non-functional

- Local dev only; no new secrets.
- Keep bundle and component scope focused: viewer + adapter aggregation only.
- Implementation is split under `frontend/src/components/bioBankViewer/` (container, data hook, section cards, shared UI classes) so the tab stays easy to change without a single oversized file.
