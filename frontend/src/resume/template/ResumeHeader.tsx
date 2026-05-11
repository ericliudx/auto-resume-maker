import type { ResumeContact } from '../data/contact'

export function ResumeHeader({ contact }: { contact: ResumeContact }) {
  return (
    <header className="rt__header">
      <div className="rt__name">{contact.name}</div>
      <div className="rt__contact">
        {(() => {
          const parts: React.ReactNode[] = []
          const pushSep = () => {
            if (parts.length > 0) parts.push(<span key={`sep-${parts.length}`}> {' | '}</span>)
          }

          const loc = contact.location.trim()
          if (loc) {
            parts.push(<span key="loc">{loc}</span>)
          }

          const phone = contact.phone.trim()
          if (phone) {
            pushSep()
            parts.push(<span key="phone">{phone}</span>)
          }

          const email = contact.email.trim()
          if (email) {
            pushSep()
            parts.push(<span key="email">{email}</span>)
          }

          const linkedin = contact.linkedin.trim()
          if (linkedin) {
            pushSep()
            parts.push(
              <a
                key="linkedin"
                className="rt__link"
                href={linkedin}
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>,
            )
          }

          const github = contact.github.trim()
          if (github) {
            pushSep()
            parts.push(
              <a
                key="github"
                className="rt__link"
                href={github}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>,
            )
          }

          return parts
        })()}
      </div>
    </header>
  )
}

