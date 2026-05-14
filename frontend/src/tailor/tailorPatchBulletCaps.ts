import {
  TAILOR_LLM_EXPERIENCE_BULLETS,
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

export function capExperiencePatchBullets<T extends { bullets?: string[] }>(
  patches: T[] | undefined,
): T[] | undefined {
  return capBullets(patches, TAILOR_LLM_EXPERIENCE_BULLETS)
}

export function capProjectPatchBullets<T extends { bullets?: string[] }>(
  patches: T[] | undefined,
): T[] | undefined {
  return capBullets(patches, TAILOR_LLM_PROJECT_BULLETS)
}
