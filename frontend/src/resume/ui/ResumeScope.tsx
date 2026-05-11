import type React from 'react'
import { RESUME_CSS } from '../styles/resumeCss'

export function ResumeScope({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={['resumeScope', className ?? ''].filter(Boolean).join(' ')}>
      <style>{RESUME_CSS}</style>
      {children}
    </div>
  )
}

