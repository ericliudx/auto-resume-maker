import { useMemo } from 'react'
import type { BioBank } from '../../resume/data/bioTypes'
import { BankSection } from './BankSection'
import { CollapsibleJson } from './CollapsibleJson'
import { ContactBlock } from './ContactBlock'
import { EducationReadable } from './EducationReadable'
import { ExperienceReadable } from './ExperienceReadable'
import { ProjectReadable } from './ProjectReadable'
import { SkillsReadable } from './SkillsReadable'
import { UnknownJsonDoc } from './UnknownJsonDoc'
import { useBioBankPanelData } from './useBioBankPanelData'

const SUBTITLE =
  'Full on-disk bio (every experience, project, education doc, skills file, summaries, certifications). Contact comes from bio/contact.json.'

export function BioBankViewer({
  tailoredResumeBank,
  active,
}: {
  tailoredResumeBank: BioBank | null
  active: boolean
}) {
  const { baseBank, error, loadingBase, contact, contactFetched } = useBioBankPanelData(active)

  const tailoredExpIds = useMemo(
    () => new Set(tailoredResumeBank?.experiences.map((e) => e.id) ?? []),
    [tailoredResumeBank],
  )
  const tailoredProjIds = useMemo(
    () => new Set(tailoredResumeBank?.projects.map((p) => p.id) ?? []),
    [tailoredResumeBank],
  )

  const summaries = baseBank?.summaries ?? []
  const certifications = baseBank?.certifications ?? []

  const fullBankJson = useMemo(
    () => (baseBank ? JSON.stringify(baseBank, null, 2) : ''),
    [baseBank],
  )

  const tailoredJson = useMemo(
    () =>
      tailoredResumeBank ? JSON.stringify(tailoredResumeBank, null, 2) : '',
    [tailoredResumeBank],
  )

  if (!active) return null

  if (loadingBase) {
    return (
      <div className="text-[var(--text-h)] font-sans text-[13px] leading-[1.45] px-1 py-1">
        Loading bio bank…
      </div>
    )
  }

  if (error) {
    return <div className="text-[#b91c1c] font-sans text-[13px] px-1 py-1">{error}</div>
  }

  if (!baseBank) {
    return null
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <p className="m-0 shrink-0 text-[12px] leading-snug text-[color-mix(in_srgb,var(--text-h)_72%,transparent)]">
        {SUBTITLE}
      </p>

      {tailoredResumeBank ? (
        <p className="m-0 shrink-0 text-[11px] leading-snug text-[color-mix(in_srgb,var(--text-h)_58%,transparent)]">
          A tailor patch is active. The <span className="font-semibold text-[#166534]">Resume</span> tag marks
          experiences and projects that appear on the tailored resume; everything else on disk is still listed
          below.
        </p>
      ) : null}

      {tailoredResumeBank ? (
        <CollapsibleJson summary="Tailored resume snapshot (JSON)" jsonText={tailoredJson} maxHeight="max-h-[32vh]" />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-5 overflow-auto overflow-y-scroll [scrollbar-gutter:stable_both-edges] pr-0.5">
        <BankSection
          title="Contact"
          description="From bio/contact.json (not part of the aggregated bank JSON)."
        >
          <ContactBlock loading={!contactFetched} contact={contact} />
        </BankSection>

        <BankSection title="Experiences" description={`${baseBank.experiences.length} file(s) on disk (full list)`}>
          {baseBank.experiences.map((e) => (
            <ExperienceReadable
              key={e.id}
              e={e}
              tailorOnResume={tailoredResumeBank ? tailoredExpIds.has(e.id) : undefined}
            />
          ))}
        </BankSection>

        <BankSection title="Projects" description={`${baseBank.projects.length} file(s) on disk (full list)`}>
          {baseBank.projects.map((p) => (
            <ProjectReadable
              key={p.id}
              p={p}
              tailorOnResume={tailoredResumeBank ? tailoredProjIds.has(p.id) : undefined}
            />
          ))}
        </BankSection>

        <BankSection title="Education" description={`${baseBank.education.length} document(s)`}>
          {baseBank.education.map((doc) => (
            <EducationReadable key={doc.id} doc={doc} />
          ))}
        </BankSection>

        <BankSection title="Skills" description={`${baseBank.skills.length} document(s)`}>
          {baseBank.skills.map((s) => (
            <SkillsReadable key={s.id} s={s} />
          ))}
        </BankSection>

        <BankSection
          title="Summaries"
          description="bio/summaries/*.json — short headline or summary variants."
        >
          {summaries.length === 0 ? (
            <p className="m-0 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
              No summary files yet.
            </p>
          ) : (
            summaries.map((doc, i) => <UnknownJsonDoc key={i} doc={doc} index={i} />)
          )}
        </BankSection>

        <BankSection
          title="Certifications"
          description="bio/certifications/*.json — licenses and certificates."
        >
          {certifications.length === 0 ? (
            <p className="m-0 text-[12px] text-[color-mix(in_srgb,var(--text-h)_55%,transparent)]">
              No certification files yet.
            </p>
          ) : (
            certifications.map((doc, i) => <UnknownJsonDoc key={i} doc={doc} index={i} />)
          )}
        </BankSection>
      </div>

      <CollapsibleJson summary="Full on-disk bank JSON" jsonText={fullBankJson} maxHeight="max-h-[40vh]" />
    </div>
  )
}
