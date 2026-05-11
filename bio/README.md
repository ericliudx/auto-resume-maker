# Bio (source material)

Human-edited inputs the tailor draws from. **One JSON file per logical item** unless noted.

| Folder | Holds |
|--------|--------|
| `experiences/` | Paid roles and similar (one `.json` per experience). |
| `projects/` | Standalone projects you might list separately from employment. |
| `education/` | Degrees, programs (one `.json` per entry—or one file if you prefer; stay consistent). |
| `skills/` | Skill groups, tooling lists, keywords—you can split by file (`languages.json`, `platforms.json`, etc.). |
| `summaries/` | Short professional summary / headline variants for different targets. |
| `certifications/` | Licenses and certs (one `.json` per item is fine). |

**Secrets:** Do not commit phone numbers, addresses, or API keys here. Prefer env vars / gitignored local files if the app needs them (see `.specify/memory/constitution.md`).
