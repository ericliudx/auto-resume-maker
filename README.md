# auto-resume

Local-first app to keep a **structured bio bank** on disk, **tailor** it to a job posting with an LLM (plus deterministic ATS hints), and **preview** a locked resume layout that can shrink to fit one page.

## Quick start

From `frontend/`:

```bash
npm install
npm run dev
```

Set `GROQ_API_KEY` in the environment (Vite loads it for the dev server). Optional: `GROQ_MODEL` (defaults to `llama-3.1-8b-instant`). Tailor calls `POST /api/llm/chat` on the local dev server.

## Bio folder (`bio/`)

Human-edited source material lives under **`bio/`**. The dev server aggregates JSON from these subfolders into a single **bank** (`GET /api/bio/bank`). **Contact** is separate: **`bio/contact.json`** is served by `GET /api/bio/contact` and is not merged into the bank payload.

| Subfolder         | Purpose                        | Typical JSON files                                                         |
| ----------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `experiences/`    | Employment-style roles         | One `.json` per role (for example `quant-dev-lab-cognitive-research.json`) |
| `projects/`       | Standalone projects            | One `.json` per project                                                    |
| `education/`      | Degrees, programs, course bank | For example `education_list.json`, `relevant-courses.json`                 |
| `skills/`         | Skill groups / tooling         | For example `skills_list.json` (you can split into multiple JSON files)    |
| `summaries/`      | Summary or headline variants   | One or more `.json` files                                                  |
| `certifications/` | Licenses and certs             | One `.json` per item or grouped files                                      |

Anything outside those paths (for example `bio/existing-stuff/`) is for your own reference and is **not** read by the app APIs.

More detail: [bio/README.md](bio/README.md).

## How tailoring reaches the LLM

When you run **Tailor**, the app builds one **user** message and a short **system** message, then posts them to the local Groq-backed chat endpoint.

1. **System message** (fixed in code) tells the model to follow the user message, emit valid JSON first (including `pdfFileName`), then the `BIGGEST_GAPS` section, with no markdown around the JSON.

2. **User message** is assembled in order by `buildTailorPrompt` in the frontend:
   - **General tailor instructions** — the full text from [`.specify/general-tailor-llm-prompt.txt`](.specify/general-tailor-llm-prompt.txt) (bundled at build time). This defines ground rules (no fabrication, stable template, which bio paths matter, JSON shape expectations, and so on).

   - **Aggregated bank JSON** — a single JSON object derived from the on-disk bank: trimmed `experiences` and `projects` (ids and resume-facing fields), full `education` and `skills`, plus `summaries` and `certifications` when present. The model is instructed to use only facts that appear there.

   - **Job posting** — the text you paste in the UI, trimmed and capped (currently up to 12,000 characters).

   - **ATS appendix** — a deterministic block titled “Local ATS keyword pre-read”. The app runs the same keyword extraction and scoring logic as the ATS panel on the posting plus the bank, using your **role** and **keyword limit** controls. That appendix lists the weighted score, extracted terms, **missing** keywords (prioritized), and a sample of terms already present in the bank. It is **not** model-inferred; it is computed locally so the LLM can align wording with gaps **without inventing** experience.

The model returns a **tailor plan** (JSON); the app validates it and applies it to produce a **tailored bank** used for the resume views. Product intent and pillars: [`.specify/vision.md`](.specify/vision.md).

## Resume fitter

The **resume fitter** (`ResumeFitter` in the frontend) keeps the rendered resume sheet within the printable height for US Letter with half-inch margins (it measures the `.rt` root and compares its `scrollHeight` to the **10-inch** nominal content box from `@page` in print CSS, plus a user-adjustable **pixel offset** stored in `localStorage` and controlled by a slider in the resume preview toolbar; the default offset is **+112px** so trimming matches typical PDF output more closely out of the box).

- It starts from the **fullest** layout: all experiences and projects from the current bank, with bullet caps derived from your data (up to six per item).

- If the content is **too tall**, it tightens in a fixed order: **one project bullet at a time** in a **bottom-to-top round robin** among visible projects (e.g. three projects at 3 bullets each go 3-3-3 → 3-3-2 → 3-2-2 → 2-2-2 → 2-2-1 → 2-1-1 → 1-1-1), then fewer **projects** (but not below **three** whole projects when the bank has at least three), then **one experience bullet at a time** in the same bottom-to-top round robin among visible roles (e.g. 3-3 → 3-2 → 2-2 → 2-1 → 1-1), then fewer **experiences**. Header and skills are not auto-trimmed by this loop; only experience and project sections shrink.

- It uses a `ResizeObserver` so layout changes (for example after tailoring) re-run the check. **Fit on/off** and the height slider are stored in `localStorage`, so the `?print=1` tab uses the same fitting path as the app preview (no separate “print-only” trim).

The fitted slice of the bank is what you see when the fitter is active in the resume preview pipeline; tailoring changes _what_ is in the bank, while the fitter changes _how much_ of that bank fits on one page.
