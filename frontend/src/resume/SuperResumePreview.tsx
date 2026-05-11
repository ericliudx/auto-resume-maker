import { useEffect, useMemo, useState } from 'react'
import { fetchBioBank } from './bioApi'
import type { BioBank } from './bioTypes'
import { loadContact, type ResumeContact } from './contact'
import { fetchContactFile } from './contactApi'
import { ResumeTemplate } from './ResumeTemplate'

export function SuperResumePreview() {
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
    let cancelled = false
    fetchContactFile()
      .then((c) => {
        if (!cancelled && c) setContact(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const view = useMemo(() => {
    if (!bank) return null
    return <ResumeTemplate bank={bank} contact={contact} />
  }, [bank, contact])

  return (
    <div>
      {error ? <div className="resumePane__error">{error}</div> : null}
      {!bank && !error ? <div className="resumeCanvas__loading">Loading…</div> : null}
      {view}
    </div>
  )
}

