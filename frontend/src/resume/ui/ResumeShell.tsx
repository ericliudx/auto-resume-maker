import type React from 'react'

export function ResumeToolbar({
  right,
  children,
}: {
  right?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div>
      <div className="resumePane__toolbar">
        <div className="resumePane__toolbarLeft">
          <div className="resumePane__title">Locked template preview</div>
          <div className="resumePane__hint">Rendered from gitignored `bio/` files via local API</div>
        </div>
        <div className="resumePane__toolbarRight">
          {right}
          <a className="resumePane__button" href="/?print=1" target="_blank" rel="noreferrer">
            Print / Save PDF
          </a>
        </div>
      </div>
      {children}
    </div>
  )
}

export function ResumeError({ message }: { message: string }) {
  return <div className="resumePane__error">{message}</div>
}

export function ResumeCanvas({
  loading,
  children,
}: {
  loading: boolean
  children: React.ReactNode
}) {
  return (
    <div className="resumeCanvas" aria-label="Resume preview canvas">
      {loading ? <div className="resumeCanvas__loading">Loading…</div> : null}
      {children}
    </div>
  )
}

