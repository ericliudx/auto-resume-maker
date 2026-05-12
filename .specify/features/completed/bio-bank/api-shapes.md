# API shapes: bio bank (local dev)

## `GET /api/bio/bank`

**Response (success):** `200` `application/json`

```ts
type BioBankResponse =
  | {
      ok: true
      result: {
        experiences: unknown[] // sorted newest-first by dates
        projects: unknown[] // sorted newest-first by dates
        education: unknown[] // directory read order (sorted filenames)
        skills: unknown[] // directory read order
        summaries: unknown[] // `bio/summaries/*.json`; missing dir ⇒ []
        certifications: unknown[] // `bio/certifications/*.json`; missing dir ⇒ []
      }
    }
  | { ok: false; error: { code: string; message: string } }
```

**Notes**

- `summaries` and `certifications` mirror the folders documented in `bio/README.md`.
- Client TypeScript type `BioBank` treats `summaries` and `certifications` as optional for defensive coding; the dev server returns them as arrays (possibly empty).

## `GET /api/bio/contact`

Unchanged: returns validated `ResumeContact` or structured error.
