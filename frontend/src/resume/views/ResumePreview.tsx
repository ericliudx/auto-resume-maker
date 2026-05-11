import { ResumeFitter } from '../fit/ResumeFitter'
import { useResumeData } from '../hooks/useResumeData'
import { ResumeScope } from '../ui/ResumeScope'
import { ResumeCanvas, ResumeError, ResumeToolbar } from '../ui/ResumeShell'

export function ResumePreview({
  mode,
}: {
  mode: 'app' | 'print'
}) {
  const { bank, contact, error, loading } = useResumeData()

  const resume = (() => {
    if (!bank) return null
    return <ResumeFitter bank={bank} contact={contact} target={mode === 'print' ? 'print' : 'screen'} />
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
      <ResumeToolbar />
      {error ? <ResumeError message={error} /> : null}
      <ResumeCanvas loading={loading}>{resume}</ResumeCanvas>
    </ResumeScope>
  )
}

