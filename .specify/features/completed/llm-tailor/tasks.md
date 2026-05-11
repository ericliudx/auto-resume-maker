# llm-tailor — tasks

- [x] Wire tailor user prompt to `.specify/general-tailor-llm-prompt.txt` + bank JSON + job posting
- [x] Parse LLM output (JSON + optional `BIGGEST_GAPS`), map patch shape to `TailorModelResult`, validate, apply, persist
- [x] Apply `relevantCourses` on LLM tailor success; share helper with deterministic plan apply
- [x] Sync ATS role/limit + re-run analyze after successful LLM tailor
- [x] Remove LLM smoke test from UI and `useLlmTools`
- [x] Document feature under `.specify/features/completed/llm-tailor/`
- [x] Update architecture note for prompt source; reset `.specify/llm-prompt.txt` feature placeholders
- [x] `npm run build` in `frontend/`
- [x] Persist `relevantCourses` on `TailorModelResult` and reapply on load (`applyTailorPatchToBank`)
