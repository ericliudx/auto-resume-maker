import { useEffect, useMemo, useState } from 'react'
import { fetchBioBank } from './bioApi'
import type { BioBank } from './bioTypes'
import { loadContact, type ResumeContact } from './contact'
import { fetchContactFile } from './contactApi'
import { ResumeFitter } from './ResumeFitter'

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

  const resume = useMemo(() => {
    if (!bank) return null
    return <ResumeFitter bank={bank} contact={contact} target={mode === 'print' ? 'print' : 'screen'} />
  }, [bank, contact, mode])

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
          <div className="resumePane__hint">Rendered from gitignored `bio/` files via local API</div>
        </div>
        <div className="resumePane__toolbarRight">
          <a className="resumePane__button" href="/?print=1" target="_blank" rel="noreferrer">
            Print / Save PDF
          </a>
        </div>
      </div>

      {error ? <div className="resumePane__error">{error}</div> : null}

      <div className="resumeCanvas" aria-label="Resume preview canvas">
        {!bank && !error ? <div className="resumeCanvas__loading">Loading…</div> : null}
        {resume}
      </div>
    </div>
  )
}

