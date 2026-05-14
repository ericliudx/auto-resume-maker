import type { BioBank } from '../resume/data/bioTypes'
import type { TailorModelResult } from './tailorTypes'

function preview(s: string, max = 76): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (!t) return '(empty)'
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

/** Per-index trim compare: how many patch lines differ from bio at the same index. */
function countRewrittenLines(base?: string[], patch?: string[]): { changed: number; total: number } {
  if (!Array.isArray(patch) || patch.length === 0) return { changed: 0, total: 0 }
  const b = base ?? []
  let changed = 0
  for (let i = 0; i < patch.length; i++) {
    const bi = (b[i] ?? '').trim()
    const pi = (patch[i] ?? '').trim()
    if (bi !== pi) changed++
  }
  return { changed, total: patch.length }
}

function bulletSummary(
  kind: string,
  id: string,
  baseItem: { bullets?: string[] } | undefined,
  patch: { bullets?: string[] } | undefined,
): string[] {
  const out: string[] = []
  const baseN = Array.isArray(baseItem?.bullets) ? baseItem!.bullets!.length : 0

  if (!patch) {
    out.push(
      `  ${kind} [${id}] bio had ${baseN} bullets; **no patch object** for this id in JSON — original bio bullets kept.`,
    )
    return out
  }

  const hasPatchBullets = Array.isArray(patch.bullets) && patch.bullets.length > 0
  const patchN = hasPatchBullets ? patch.bullets.length : 0

  if (hasPatchBullets) {
    const { changed, total } = countRewrittenLines(baseItem?.bullets, patch.bullets)
    const unchanged = total - changed
    const sameFirst =
      baseN > 0 &&
      (patch.bullets![0] ?? '').trim() === (baseItem?.bullets?.[0] ?? '').trim()
    const head =
      unchanged === 0
        ? 'all lines match bio at same indices (no wording change)'
        : changed === total
          ? 'all lines differ from bio at same indices'
          : `${changed}/${total} lines differ from bio (same index); ${unchanged} unchanged (often the lead line is kept on purpose)`
    out.push(
      `  ${kind} [${id}] bio had ${baseN} bullets; patch applies ${patchN} bullets — ${head}${sameFirst && changed > 0 ? '; line 0 same text' : ''}.`,
    )
    out.push(`  bio[0]:  ${preview((baseItem?.bullets ?? [])[0] ?? '')}`)
    out.push(`  new[0]:  ${preview(patch.bullets![0] ?? '')}`)
    if (patchN > 1) {
      out.push(`  new[1]:  ${preview(patch.bullets![1] ?? '')}`)
    }
    if (patchN > 2 && changed > 0) {
      out.push(`  new[2]:  ${preview(patch.bullets![2] ?? '')}`)
    }
  } else {
    out.push(
      `  ${kind} [${id}] bio had ${baseN} bullets; patch has no bullets array — **original bio bullets kept** (model omitted bullets for this row).`,
    )
  }
  return out
}

/**
 * Human-readable trace for the LLM panel: patch coverage, bullet counts, first-line diff hints.
 */
export function buildTailorApplyDebug(base: BioBank, patch: TailorModelResult): string {
  const lines: string[] = [
    '--- Debug: what was applied',
    `experiencePatches in JSON: ${patch.experiences?.length ?? 0} object(s)`,
    `projectPatches in JSON: ${patch.projects?.length ?? 0} object(s)`,
  ]

  const expById = new Map(base.experiences.map((e) => [e.id, e]))
  const projById = new Map(base.projects.map((p) => [p.id, p]))
  const expPatchById = new Map((patch.experiences ?? []).map((e) => [e.id, e]))
  const projPatchById = new Map((patch.projects ?? []).map((p) => [p.id, p]))

  lines.push('Experiences (order = experienceIds):')
  for (const id of patch.experienceIds ?? []) {
    lines.push(
      ...bulletSummary('exp', id, expById.get(id), expPatchById.get(id)),
    )
  }

  lines.push('Projects (order = projectIds):')
  for (const id of patch.projectIds ?? []) {
    lines.push(
      ...bulletSummary('proj', id, projById.get(id), projPatchById.get(id)),
    )
  }

  lines.push(
    'Tip: “Line 0 same” with 2/3 lines changed still means tailoring on other bullets. If every line matches bio, the model echoed the bank.',
    'Tip: If you see “no bullets array”, the model did not send rewrites for that id; check raw JSON on a failed parse or log the API response.',
  )

  return lines.join('\n')
}
