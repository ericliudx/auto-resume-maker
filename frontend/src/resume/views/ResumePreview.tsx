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

