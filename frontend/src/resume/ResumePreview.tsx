import { useEffect, useMemo, useState } from 'react'
import { fetchBioBank } from './bioApi'
import type { BioBank } from './bioTypes'
import { loadContact, saveContact, type ResumeContact } from './contact'
import { ResumeTemplate } from './ResumeTemplate'

function TextField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="resumeForm__field">
      <div className="resumeForm__label">{label}</div>
      <input
        className="resumeForm__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}

export function ResumePreview({
  mode,
}: {
  mode: 'app' | 'print'
}) {
  const [bank, setBank] = useState<BioBank | null>(null)
  const [error, setError] = useState<string>('')

  const [contact, setContact] = useState<ResumeContact>(() => loadContact())

  useEffect(() => {
    let cancelled = false
    fetchBioBank()
      .then((b) => {
        if (!cancelled) setBank(b)
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load bio bank.'
        if (!cancelled) setError(msg)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    saveContact(contact)
  }, [contact])

  const resume = useMemo(() => {
    if (!bank) return null
    return <ResumeTemplate bank={bank} contact={contact} />
  }, [bank, contact])

  if (mode === 'print') {
    return (
      <div className="printRoot">
        {error ? <div className="printError">{error}</div> : null}
        {resume}
      </div>
    )
  }

  return (
    <div className="resumePane">
      <div className="resumePane__toolbar">
        <div className="resumePane__toolbarLeft">
          <div className="resumePane__title">Locked template preview</div>
          <div className="resumePane__hint">Rendered from `bio/*.json` via local API</div>
        </div>
        <div className="resumePane__toolbarRight">
          <a className="resumePane__button" href="/?print=1" target="_blank" rel="noreferrer">
            Print / Save PDF
          </a>
        </div>
      </div>

      <div className="resumePane__body">
        <aside className="resumeForm" aria-label="Contact editor">
          <div className="resumeForm__title">Contact (stored locally)</div>
          <TextField
            label="Name"
            value={contact.name}
            onChange={(name) => setContact((c) => ({ ...c, name }))}
          />
          <TextField
            label="Location"
            value={contact.location}
            onChange={(location) => setContact((c) => ({ ...c, location }))}
          />
          <TextField
            label="Phone"
            value={contact.phone}
            onChange={(phone) => setContact((c) => ({ ...c, phone }))}
          />
          <TextField
            label="Email"
            value={contact.email}
            onChange={(email) => setContact((c) => ({ ...c, email }))}
          />
          <TextField
            label="LinkedIn"
            value={contact.linkedin}
            onChange={(linkedin) => setContact((c) => ({ ...c, linkedin }))}
          />
          {error ? <div className="resumeForm__error">{error}</div> : null}
        </aside>

        <div className="resumeCanvas" aria-label="Resume preview canvas">
          {!bank && !error ? <div className="resumeCanvas__loading">Loading…</div> : null}
          {resume}
        </div>
      </div>
    </div>
  )
}

