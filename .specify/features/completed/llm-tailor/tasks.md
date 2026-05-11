# llm-tailor — tasks

- [x] Draft prompts + structured output shape for tailoring (no fabrications; preserve facts)
- [x] Implement frontend tailoring UI (job description input + controls)
- [x] Call existing local LLM API (`POST /api/llm/chat`) and parse response
- [x] Map tailored output into resume rendering while keeping template locked
- [x] Add ATS match report (extract keywords, compute coverage + score)
- [x] Add ATS-tailor prompt + “proof of placement” output (`keywordMap`, `cannotAdd`)
- [x] Add ATS controls (role preset + keyword limit) and re-analyze loop
- [x] Add paste-and-apply tailor plan (parse + deterministic patch)
- [x] When generating a Tailor Plan, also output “biggest gaps” (missing keywords + missing signals + next edits)
- [x] Integrate/extend page-fit trimming (one-page mode)
- [x] Show omitted/trimmed content for manual review
- [x] Verify locally per `plan.md` (lint, build, manual checks)

