import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { BioBank, BioExperience, BioProject } from './bioTypes'
import type { ResumeContact } from './contact'
import { ResumeTemplate } from './ResumeTemplate'

type FitConfig = {
  expLimit: number
  projLimit: number
  expBullets: number
  projBullets: number
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

function nextTighterConfig(cfg: FitConfig): FitConfig | null {
  // Tighten in a deterministic order:
  // 1) project bullets → 2) project count → 3) experience bullets → 4) experience count.
  if (cfg.projBullets > 1) return { ...cfg, projBullets: cfg.projBullets - 1 }
  if (cfg.projLimit > 1) return { ...cfg, projLimit: cfg.projLimit - 1, projBullets: 3 }
  if (cfg.expBullets > 1) return { ...cfg, expBullets: cfg.expBullets - 1 }
  if (cfg.expLimit > 1) return { ...cfg, expLimit: cfg.expLimit - 1, expBullets: 3 }
  return null
}

function applyFit(bank: BioBank, cfg: FitConfig): BioBank {
  const expLimit = clampInt(cfg.expLimit, 0, bank.experiences.length)
  const projLimit = clampInt(cfg.projLimit, 0, bank.projects.length)

  const experiences: BioExperience[] = bank.experiences.slice(0, expLimit).map((e) => ({
    ...e,
    bullets: Array.isArray(e.bullets) ? e.bullets.slice(0, clampInt(cfg.expBullets, 0, 99)) : e.bullets,
  }))

  const projects: BioProject[] = bank.projects.slice(0, projLimit).map((p) => ({
    ...p,
    bullets: Array.isArray(p.bullets) ? p.bullets.slice(0, clampInt(cfg.projBullets, 0, 99)) : p.bullets,
  }))

  return { ...bank, experiences, projects }
}

function inchToPx(inches: number): number {
  const el = document.createElement('div')
  el.style.width = '1in'
  el.style.height = '1in'
  el.style.position = 'absolute'
  el.style.left = '-10000px'
  el.style.top = '-10000px'
  document.body.appendChild(el)
  const pxPerInch = el.getBoundingClientRect().height || 96
  document.body.removeChild(el)
  return inches * pxPerInch
}

export function ResumeFitter({
  bank,
  contact,
  target,
}: {
  bank: BioBank
  contact: ResumeContact
  target: 'screen' | 'print'
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [cfg, setCfg] = useState<FitConfig>(() => ({
    expLimit: 3,
    projLimit: 3,
    expBullets: 3,
    projBullets: 3,
  }))

  const fittedBank = useMemo(() => applyFit(bank, cfg), [bank, cfg])

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Assume US Letter with 0.5" margins for printing. We measure the rendered `.rt`
    // and keep it under the printable content box height (10").
    const maxHeightPx = target === 'print' ? inchToPx(10) : inchToPx(10)

    const rt = el.querySelector<HTMLElement>('.rt')
    if (!rt) return

    const h = rt.getBoundingClientRect().height
    if (h <= maxHeightPx) return

    const next = nextTighterConfig(cfg)
    if (!next) return
    setCfg(next)
  }, [cfg, fittedBank, target])

  return (
    <div ref={containerRef}>
      <ResumeTemplate bank={fittedBank} contact={contact} />
    </div>
  )
}

