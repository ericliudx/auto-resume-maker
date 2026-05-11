import { ResumeTemplate } from '../ResumeTemplate'
import { useResumeData } from '../hooks/useResumeData'
import { ResumeScope } from '../ui/ResumeScope'
import { ResumeCanvas, ResumeError } from '../ui/ResumeShell'
import type { BioBank } from '../data/bioTypes'

export function SuperResumePreview({ bankOverride }: { bankOverride?: BioBank | null }) {
  const { bank, contact, error, loading } = useResumeData()
  const effectiveBank = bankOverride ?? bank
  const view = effectiveBank ? <ResumeTemplate bank={effectiveBank} contact={contact} /> : null

  return (
    <ResumeScope>
      {error ? <ResumeError message={error} /> : null}
      <ResumeCanvas loading={loading}>{view}</ResumeCanvas>
    </ResumeScope>
  )
}

