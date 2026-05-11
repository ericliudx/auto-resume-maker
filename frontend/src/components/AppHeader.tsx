import type React from 'react'

export function AppHeader({ meta }: { meta: React.ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4 px-5 pt-5 pb-3 border-b border-[var(--border)]">
      <div>
        <div className="font-semibold tracking-[-0.4px] text-[var(--text-h)] text-[18px] leading-[1.2]">
          auto-resume
        </div>
        <div className="text-sm text-[var(--text)] mt-1">Local resume preview + job posting input</div>
      </div>
      <div className="font-mono text-xs text-[var(--text-h)] px-2.5 py-1.5 rounded-full bg-[var(--social-bg)] border border-[var(--border)]">
        {meta}
      </div>
    </header>
  )
}

