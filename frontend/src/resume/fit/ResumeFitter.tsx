import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BioBank, BioExperience, BioProject } from "../data/bioTypes";
import type { ResumeContact } from "../data/contact";
import { PAGE_FIT_NOMINAL_CONTENT_HEIGHT_IN } from "./pageFitHeightPrefs";
import { ResumeTemplate } from "../ResumeTemplate";

export type FitConfig = {
  expLimit: number;
  projLimit: number;
  expBullets: number;
  /** Bullet caps per `bank.projects` index; only indices `< projLimit` are shown. */
  projectBulletCounts: number[];
  /**
   * Round-robin phase for project bullet trims (bottom → … → top, repeat).
   * Cycle position `p` maps to project index `projLimit - 1 - p`.
   */
  projectTrimCursor: number;
};

/** Do not drop below this many whole projects when the bank has at least this many (matches tailored cap of 3). */
const RESUME_FIT_MIN_WHOLE_PROJECTS = 3;

function minWholeProjectFloor(bank: BioBank): number {
  if (bank.projects.length === 0) return 0;
  return Math.min(RESUME_FIT_MIN_WHOLE_PROJECTS, bank.projects.length);
}

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function maxBulletsForItem(
  item: { bullets?: string[] },
  cap: number,
): number {
  const n = Array.isArray(item.bullets) ? item.bullets.length : 0;
  return clampInt(n || 1, 1, cap);
}

function initialProjectBulletCounts(bank: BioBank): number[] {
  return bank.projects.map((p) => maxBulletsForItem(p, 6));
}

/**
 * Remove one bullet using bottom→top round-robin (e.g. 3-3-3 → 3-3-2 → 3-2-2 → 2-2-2 → …).
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

function nextTighterConfig(
  cfg: FitConfig,
  base: FitConfig,
  bank: BioBank,
): FitConfig | null {
  // Tighten in a deterministic order:
  // 1) one project bullet, round-robin bottom→top → 2) project count (not below 3 when possible) →
  // 3) experience bullets → 4) experience count.
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
  if (cfg.expBullets > 1) return { ...cfg, expBullets: cfg.expBullets - 1 };
  if (cfg.expLimit > 1)
    return { ...cfg, expLimit: cfg.expLimit - 1, expBullets: base.expBullets };
  return null;
}

function applyFit(bank: BioBank, cfg: FitConfig): BioBank {
  const expLimit = clampInt(cfg.expLimit, 0, bank.experiences.length);
  const projLimit = clampInt(cfg.projLimit, 0, bank.projects.length);

  const experiences: BioExperience[] = bank.experiences
    .slice(0, expLimit)
    .map((e) => ({
      ...e,
      bullets: Array.isArray(e.bullets)
        ? e.bullets.slice(0, clampInt(cfg.expBullets, 1, 99))
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

function inchToPx(inches: number): number {
  const el = document.createElement("div");
  el.style.width = "1in";
  el.style.height = "1in";
  el.style.position = "absolute";
  el.style.left = "-10000px";
  el.style.top = "-10000px";
  document.body.appendChild(el);
  const pxPerInch = el.getBoundingClientRect().height || 96;
  document.body.removeChild(el);
  return inches * pxPerInch;
}

function maxBulletCount(
  items: Array<{ bullets?: string[] }>,
  cap: number,
): number {
  let m = 0;
  for (const it of items)
    m = Math.max(m, Array.isArray(it.bullets) ? it.bullets.length : 0);
  return clampInt(m || 1, 1, cap);
}

export function ResumeFitter({
  bank,
  contact,
  target,
  pageFitExtraHeightPx,
  onFit,
}: {
  bank: BioBank;
  contact: ResumeContact;
  target: "screen" | "print";
  /** Added to nominal Letter content height; higher keeps more lines before trimming. */
  pageFitExtraHeightPx: number;
  onFit?: (info: { cfg: FitConfig; fittedBank: BioBank }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onFitRef = useRef<typeof onFit>(onFit);
  const cfgRef = useRef<FitConfig | null>(null);
  const baseCfgRef = useRef<FitConfig | null>(null);
  const fitLoopKeyRef = useRef<string>("");
  const tighteningRef = useRef<boolean>(false);
  const baseCfg = useMemo<FitConfig>(() => {
    // Start "as full as possible", then tighten until it fits.
    return {
      expLimit: bank.experiences.length,
      projLimit: bank.projects.length,
      expBullets: maxBulletCount(bank.experiences, 6),
      projectBulletCounts: initialProjectBulletCounts(bank),
      projectTrimCursor: 0,
    };
  }, [bank]);

  const [cfg, setCfg] = useState<FitConfig>(() => baseCfg);

  const fittedBank = useMemo(() => applyFit(bank, cfg), [bank, cfg]);

  useLayoutEffect(() => {
    onFitRef.current = onFit;
  }, [onFit]);

  useLayoutEffect(() => {
    onFitRef.current?.({ cfg, fittedBank });
  }, [cfg, fittedBank]);

  useLayoutEffect(() => {
    cfgRef.current = cfg;
  }, [cfg]);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Nominal US Letter content height (@page 0.5in margins → see resumeCssPrint).
    // scrollHeight on `.rt` already includes its padding. `pageFitExtraHeightPx` is user-controlled.
    const maxHeightPx = inchToPx(PAGE_FIT_NOMINAL_CONTENT_HEIGHT_IN) + pageFitExtraHeightPx;

    const rtEl = el.querySelector<HTMLElement>(".rt");
    if (!rtEl) return;
    const rt = rtEl;

    const bankKey = `${bank.experiences.map((e) => e.id).join("|")}::${bank.projects.map((p) => p.id).join("|")}`;
    const fitLoopKey = `${bankKey}#${pageFitExtraHeightPx}`;
    if (fitLoopKeyRef.current !== fitLoopKey) {
      fitLoopKeyRef.current = fitLoopKey;
      baseCfgRef.current = baseCfg;
      const raf = window.requestAnimationFrame(() => setCfg(baseCfg));
      return () => window.cancelAnimationFrame(raf);
    }
    baseCfgRef.current = baseCfg;

    function checkAndTighten() {
      if (tighteningRef.current) return;
      tighteningRef.current = true;
      window.requestAnimationFrame(() => {
        try {
          // Use an untransformed measurement so the app preview's visual scaling doesn't
          // change fit decisions vs print.
          const h = rt.scrollHeight;
          const cur = cfgRef.current ?? cfg;
          if (h <= maxHeightPx) return;
          const base = baseCfgRef.current ?? baseCfg;
          const next = nextTighterConfig(cur, base, bank);
          if (!next) return;
          setCfg(next);
        } finally {
          tighteningRef.current = false;
        }
      });
    }

    checkAndTighten();

    const ro = new ResizeObserver(() => checkAndTighten());
    ro.observe(rt);
    return () => ro.disconnect();
  }, [bank, cfg, target, pageFitExtraHeightPx, baseCfg]);

  return (
    <div ref={containerRef}>
      <ResumeTemplate bank={fittedBank} contact={contact} />
    </div>
  );
}
