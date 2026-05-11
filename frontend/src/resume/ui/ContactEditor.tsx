import { useMemo } from 'react'
import type { ResumeContact } from '../data/contact'

type Field = {
  key: keyof ResumeContact
  label: string
  placeholder: string
}

const FIELDS: Field[] = [
  { key: 'name', label: 'Name', placeholder: 'Eric Liu' },
  { key: 'location', label: 'Location', placeholder: 'City, ST' },
  { key: 'phone', label: 'Phone', placeholder: '555-555-5555' },
  { key: 'email', label: 'Email', placeholder: 'you@email.com' },
  { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/you' },
  { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/you' },
]

export function ContactEditor({
  value,
  onChange,
}: {
  value: ResumeContact
  onChange: (next: ResumeContact) => void
}) {
  const rows = useMemo(() => FIELDS, [])

  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3">
      <div className="text-xs text-[var(--text)] mb-2">
        Edits save to <span className="font-mono">localStorage</span> (not committed).
      </div>
      <div className="grid grid-cols-1 gap-2">
        {rows.map((f) => (
          <label key={f.key} className="grid grid-cols-[110px_1fr] items-center gap-2">
            <span className="text-xs text-[var(--text-h)]">{f.label}</span>
            <input
              className="w-full text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] outline-none"
              value={value[f.key] ?? ''}
              placeholder={f.placeholder}
              onChange={(e) => onChange({ ...value, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

