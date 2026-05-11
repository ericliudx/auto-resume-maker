# llm-tailor — spec

## User goal

As a user working locally, I want to paste (or upload) a job description and generate a tailored, **page-fit** resume that stays within the **locked resume template**, using my local `bio/` experience bank as the source of truth.

## Primary flows

### Tailor a resume for a job

- User provides a job description (plain text).
- App selects and rewrites/condenses content from the local `bio/` bank to better match the job:
  - Emphasize relevant skills/keywords where truthful.
  - Prefer high-signal bullets with metrics and outcomes.
- App renders the tailored resume in the locked template preview.

### ATS keyword match report (assistive)

- The app extracts a ranked list of keywords/skill phrases from the job posting.
- The app computes a match report against the current resume content:
  - covered keywords
  - missing keywords
  - a simple match score for iteration (“does this get better after tailoring?”)

### Keyword-focused tailoring (assistive)

- User can run a keyword-focused tailor that targets *missing* high-signal job keywords.
- The app requires the model to show “proof of placement” (which bullet each added keyword was placed into).
- The app must not add keywords that would be fabrication; those are surfaced as “cannot add” items.

### Fit to one page (when requested)

- When the user enables one-page fit, the app trims/condenses low-signal content while preserving:
  - Template structure (section order/headings)
  - Overall readability (no tiny fonts or broken spacing hacks)
- The app exposes what was trimmed (so the user can review).

### Manual review and iteration

- User can iterate by:
  - Editing the job description
  - Toggling fit settings (e.g. one-page fit on/off)
  - Locking/boosting specific experiences or projects (optional)
- The preview updates deterministically from the same inputs.

## Edge cases / invariants

- **Local-only**: All flows run on this machine/LAN; no hosted assumptions.
- **Read-only bank**: The app must not modify files under `bio/` as part of tailoring.
- **No secrets in git**: Provider keys stay in local env/gitignored files; the browser never talks to the LLM provider directly.
- **Template stays locked**: Section order/headings and resume print CSS must not change as part of tailoring.
- **Truthfulness boundary**: Tailoring may rephrase and reorder, but must not invent employers, titles, degrees, dates, or factual claims not present in the bank.

## Must not change (durable constraints)

- Tailored outputs are derived “views” of the bank; the bank remains canonical.
- The LLM call path goes through the existing local LLM API (`/api/llm/chat`) and uses its normalized shape.
- The resume preview continues to be rendered via the existing resume template components and scoped CSS (no global CSS resets that affect template typography).

## Non-goals / out of scope (for this feature)

- Guaranteeing ATS outcomes or claiming “ATS optimization” correctness
- Multi-user hosting, auth, accounts, or any public exposure of the LLM API
- Writing back edits into `bio/` or introducing a bank editor UI
- Replacing the resume template with a new layout or changing section order/headings
- Streaming token-by-token UI (can be added later if desired)

