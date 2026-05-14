import type { BioBank } from '../resume/data/bioTypes'
import type { TailorModelResult } from './tailorTypes'

function preview(s: string, max = 76): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (!t) return '(empty)'
  return t.length <= max ? t : `${t.slice(0, max)}…`
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
    const sameFirst =
      baseN > 0 &&
      patch.bullets![0] === baseItem?.bullets?.[0]
    out.push(
      `  ${kind} [${id}] bio had ${baseN} bullets; patch replaces with ${patchN}${sameFirst ? ' (first bullet identical to bio — check other bullets)' : ''}.`,
    )
    out.push(`  bio[0]:  ${preview((baseItem?.bullets ?? [])[0] ?? '')}`)
    out.push(`  new[0]:  ${preview(patch.bullets![0] ?? '')}`)
    if (patchN > 1) {
      out.push(`  new[1]:  ${preview(patch.bullets![1] ?? '')}`)
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
    'Tip: If you see “no bullets array”, the model did not send rewrites for that id; check raw JSON on a failed parse or log the API response.',
  )

  return lines.join('\n')
}
