import type { BioBank, BioExperience, BioProject } from "../data/bioTypes";
import type { FitConfig } from "./resumeFitTypes";
import { clampInt, maxBulletsForItem } from "./resumeFitMath";

export function initialProjectBulletCounts(bank: BioBank): number[] {
  return bank.projects.map((p) => maxBulletsForItem(p, 6));
}

export function initialExperienceBulletCounts(bank: BioBank): number[] {
  return bank.experiences.map((e) => maxBulletsForItem(e, 6));
}

export function buildInitialFitConfig(bank: BioBank): FitConfig {
  return {
    expLimit: bank.experiences.length,
    projLimit: bank.projects.length,
    experienceBulletCounts: initialExperienceBulletCounts(bank),
    projectBulletCounts: initialProjectBulletCounts(bank),
    experienceTrimCursor: 0,
    projectTrimCursor: 0,
  };
}

export function applyFit(bank: BioBank, cfg: FitConfig): BioBank {
  const expLimit = clampInt(cfg.expLimit, 0, bank.experiences.length);
  const projLimit = clampInt(cfg.projLimit, 0, bank.projects.length);

  const experiences: BioExperience[] = bank.experiences
    .slice(0, expLimit)
    .map((e, idx) => ({
      ...e,
      bullets: Array.isArray(e.bullets)
        ? e.bullets.slice(
            0,
            clampInt(cfg.experienceBulletCounts[idx] ?? 1, 1, 99),
          )
        : e.bullets,
    }));

  const projects: BioProject[] = bank.projects
    .slice(0, projLimit)
    .map((p, idx) => ({
      ...p,
      bullets: Array.isArray(p.bullets)
        ? p.bullets.slice(
            0,
            clampInt(cfg.projectBulletCounts[idx] ?? 1, 1, 99),
          )
        : p.bullets,
    }));

  return { ...bank, experiences, projects };
}
