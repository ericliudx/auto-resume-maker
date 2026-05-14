import type { BioBank } from "../data/bioTypes";
import type { FitConfig } from "./resumeFitTypes";
import { clampInt } from "./resumeFitMath";
import { minWholeProjectFloor } from "./resumeFitLimits";

/**
 * Remove one experience bullet using bottom→top round-robin (e.g. 3-3 → 3-2 → 2-2 → …).
 */
function trimOneExperienceBulletRoundRobin(
  cfg: FitConfig,
  bank: BioBank,
): FitConfig | null {
  const L = clampInt(cfg.expLimit, 0, bank.experiences.length);
  if (L === 0) return null;

  const cursor = ((cfg.experienceTrimCursor % L) + L) % L;

  for (let step = 0; step < L; step++) {
    const pos = (cursor + step) % L;
    const idx = L - 1 - pos;
    if (cfg.experienceBulletCounts[idx] > 1) {
      const nextCounts = cfg.experienceBulletCounts.slice();
      nextCounts[idx] -= 1;
      const nextCursor = (cursor + step + 1) % L;
      return {
        ...cfg,
        experienceBulletCounts: nextCounts,
        experienceTrimCursor: nextCursor,
      };
    }
  }
  return null;
}

/**
 * Remove one project bullet using bottom→top round-robin (e.g. 3-3-3 → 3-3-2 → 3-2-2 → 2-2-2 → …).
 * Skips projects already at the minimum of one visible bullet.
 */
function trimOneProjectBulletRoundRobin(
  cfg: FitConfig,
  bank: BioBank,
): FitConfig | null {
  const L = clampInt(cfg.projLimit, 0, bank.projects.length);
  if (L === 0) return null;

  const cursor = ((cfg.projectTrimCursor % L) + L) % L;

  for (let step = 0; step < L; step++) {
    const pos = (cursor + step) % L;
    const idx = L - 1 - pos;
    if (cfg.projectBulletCounts[idx] > 1) {
      const nextCounts = cfg.projectBulletCounts.slice();
      nextCounts[idx] -= 1;
      const nextCursor = (cursor + step + 1) % L;
      return {
        ...cfg,
        projectBulletCounts: nextCounts,
        projectTrimCursor: nextCursor,
      };
    }
  }
  return null;
}

/**
 * One step toward a shorter layout. Returns null when nothing more can be tightened.
 */
export function nextTighterConfig(
  cfg: FitConfig,
  base: FitConfig,
  bank: BioBank,
): FitConfig | null {
  // Tighten in a deterministic order:
  // 1) one project bullet, round-robin bottom→top → 2) project count (not below 3 when possible) →
  // 3) one experience bullet, round-robin bottom→top → 4) experience count.
  // NOTE: header + skills are treated as fixed; we only tighten experiences/projects.
  const projBullet = trimOneProjectBulletRoundRobin(cfg, bank);
  if (projBullet) return projBullet;
  const projFloor = minWholeProjectFloor(bank);
  if (cfg.projLimit > projFloor)
    return {
      ...cfg,
      projLimit: cfg.projLimit - 1,
      projectBulletCounts: base.projectBulletCounts.slice(),
      projectTrimCursor: 0,
    };
  const expBullet = trimOneExperienceBulletRoundRobin(cfg, bank);
  if (expBullet) return expBullet;
  if (cfg.expLimit > 1)
    return {
      ...cfg,
      expLimit: cfg.expLimit - 1,
      experienceBulletCounts: base.experienceBulletCounts.slice(),
      experienceTrimCursor: 0,
    };
  return null;
}
