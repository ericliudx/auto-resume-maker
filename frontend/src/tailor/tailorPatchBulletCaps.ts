import {
  TAILOR_LLM_EXPERIENCE_BULLETS_LEAD,
  TAILOR_LLM_EXPERIENCE_BULLETS_REST,
  TAILOR_LLM_EXPERIENCE_LEAD_ROLE_COUNT,
  TAILOR_LLM_PROJECT_BULLETS,
} from './tailorSelectionCap'

function capBullets<T extends { bullets?: string[] }>(
  patches: T[] | undefined,
  maxBullets: number,
): T[] | undefined {
  if (!patches?.length) return patches
  return patches.map((p) => ({
    ...p,
    bullets: Array.isArray(p.bullets) ? p.bullets.slice(0, maxBullets) : p.bullets,
  }))
}

function maxBulletsForExperienceSelectionIndex(selectionIndex: number): number {
  if (selectionIndex < 0) return TAILOR_LLM_EXPERIENCE_BULLETS_REST
  return selectionIndex < TAILOR_LLM_EXPERIENCE_LEAD_ROLE_COUNT
    ? TAILOR_LLM_EXPERIENCE_BULLETS_LEAD
    : TAILOR_LLM_EXPERIENCE_BULLETS_REST
}

/** Caps each experience patch using `experienceIdsOrdered` index (first two → 3 bullets, rest → 2). */
export function capExperiencePatchBulletsOrdered<T extends { id: string; bullets?: string[] }>(
  patches: T[] | undefined,
  experienceIdsOrdered: string[],
): T[] | undefined {
  if (!patches?.length) return patches
  return patches.map((p) => {
    const idx = experienceIdsOrdered.indexOf(p.id)
    const cap = maxBulletsForExperienceSelectionIndex(idx)
    return {
      ...p,
      bullets: Array.isArray(p.bullets) ? p.bullets.slice(0, cap) : p.bullets,
    }
  })
}

export function capProjectPatchBullets<T extends { bullets?: string[] }>(
  patches: T[] | undefined,
): T[] | undefined {
  return capBullets(patches, TAILOR_LLM_PROJECT_BULLETS)
}
