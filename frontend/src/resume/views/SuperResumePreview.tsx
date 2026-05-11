import { ResumeTemplate } from '../ResumeTemplate'
import { useResumeData } from '../hooks/useResumeData'
import { ResumeScope } from '../ui/ResumeScope'
import { ResumeCanvas, ResumeError } from '../ui/ResumeShell'

export function SuperResumePreview() {
  const { bank, contact, error, loading } = useResumeData()
  const view = bank ? <ResumeTemplate bank={bank} contact={contact} /> : null

  return (
    <ResumeScope>
      {error ? <ResumeError message={error} /> : null}
      <ResumeCanvas loading={loading}>{view}</ResumeCanvas>
    </ResumeScope>
  )
}

