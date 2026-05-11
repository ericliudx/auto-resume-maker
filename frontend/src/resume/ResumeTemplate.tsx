import type { BioBank } from './data/bioTypes'
import type { ResumeContact } from './data/contact'
import { EducationSection } from './template/EducationSection'
import { ExperienceSection } from './template/ExperienceSection'
import { ProjectsSection } from './template/ProjectsSection'
import { ResumeHeader } from './template/ResumeHeader'
import { SkillsSection } from './template/SkillsSection'

export function ResumeTemplate({
  bank,
  contact,
}: {
  bank: BioBank
  contact: ResumeContact
}) {
  const educationDoc = bank.education.find((e) => e.type === 'education')
  const courseBank = bank.education.find((e) => e.type === 'course_bank')

  return (
    <article className="rt" aria-label="Resume template">
      <ResumeHeader contact={contact} />
      <EducationSection educationDoc={educationDoc} courseBank={courseBank} />
      <ExperienceSection experiences={bank.experiences} />
      <ProjectsSection projects={bank.projects} />
      <SkillsSection skills={bank.skills} />
    </article>
  )
}

