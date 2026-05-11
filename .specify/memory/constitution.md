# Constitution (non-negotiables)

These apply unless the whole team explicitly revises this file.

## Local-only mindset

- Design for **this machine / LAN**, not generic multi-tenant cloud hosting.
- Do not add CDN, Kubernetes, centralized IAM, or production APM/logging stacks unless asked.

## Secrets and credentials

- **Never** commit API keys, tokens, passwords, or private certs. Use local env vars or gitignored files; document variable *names* only in specs, not values.

## Coding and review gates

- **TODO:** Minimum bar before merge (e.g. formatter, linter, typecheck)—set per stack when chosen.
- **TODO:** Test expectation (e.g. “new behavior has a test or a documented manual check in plan.md”).

## If the project has a UI

- **TODO:** Accessibility bar (e.g. keyboard nav, contrast, focus)—fill when UI stack exists.

## Traceability

- Non-trivial behavior changes should have a matching feature folder under `.specify/features/` with `spec.md` / `plan.md` / `tasks.md` before or alongside the PR.
