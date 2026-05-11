import { ResumeFitter } from '../fit/ResumeFitter'
import { useResumeData } from '../hooks/useResumeData'
import { ResumeScope } from '../ui/ResumeScope'
import { ResumeCanvas, ResumeError, ResumeToolbar } from '../ui/ResumeShell'
import { ContactEditor } from '../ui/ContactEditor'
import { useState } from 'react'
import type { BioBank } from '../data/bioTypes'

export function ResumePreview({
  mode,
  bankOverride,
}: {
  mode: 'app' | 'print'
  bankOverride?: BioBank | null
}) {
  const { bank, contact, setContact, error, loading } = useResumeData()
  const [showContact, setShowContact] = useState<boolean>(false)

  const resume = (() => {
    const effectiveBank = bankOverride ?? bank
    if (!effectiveBank) return null
    return (
      <ResumeFitter
        bank={effectiveBank}
        contact={contact}
        target={mode === 'print' ? 'print' : 'screen'}
      />
    )
  })()

  if (mode === 'print') {
    return (
      <ResumeScope className="printRoot">
        <div className="printHelp">
          To remove the tiny URL/date text in the PDF, disable browser print headers/footers (Chrome:
          uncheck <code>Headers and footers</code> in the print dialog).
        </div>
        {error ? <div className="printError">{error}</div> : null}
        {resume}
      </ResumeScope>
    )
  }

  return (
    <ResumeScope className="resumePane">
      <ResumeToolbar
        right={
          <button
            type="button"
            className="resumePane__button"
            onClick={() => setShowContact((v) => !v)}
          >
            {showContact ? 'Hide contact' : 'Edit contact'}
          </button>
        }
      >
        {showContact ? <ContactEditor value={contact} onChange={setContact} /> : null}
      </ResumeToolbar>
      {error ? <ResumeError message={error} /> : null}
      <ResumeCanvas loading={loading}>{resume}</ResumeCanvas>
    </ResumeScope>
  )
}

