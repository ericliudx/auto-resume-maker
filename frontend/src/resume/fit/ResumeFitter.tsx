import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BioBank, BioExperience, BioProject } from "../data/bioTypes";
import type { ResumeContact } from "../data/contact";
import { ResumeTemplate } from "../ResumeTemplate";

type FitConfig = {
  expLimit: number;
  projLimit: number;
  expBullets: number;
  projBullets: number;
};

function clampInt(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(n)));
}

function nextTighterConfig(cfg: FitConfig, base: FitConfig): FitConfig | null {
  // Tighten in a deterministic order:
  // 1) project bullets → 2) project count → 3) experience bullets → 4) experience count.
  // NOTE: header + skills are treated as fixed; we only tighten experiences/projects.
  // Never drop to 0 bullets per item (when bullets exist) or 0 items if the bank has any.
  if (cfg.projBullets > 1) return { ...cfg, projBullets: cfg.projBullets - 1 };
  if (cfg.projLimit > 1)
    return {
      ...cfg,
      projLimit: cfg.projLimit - 1,
      projBullets: base.projBullets,
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

  const projects: BioProject[] = bank.projects.slice(0, projLimit).map((p) => ({
    ...p,
    bullets: Array.isArray(p.bullets)
      ? p.bullets.slice(0, clampInt(cfg.projBullets, 1, 99))
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

function pxFromCssLength(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

export function ResumeFitter({
  bank,
  contact,
  target,
  onFit,
}: {
  bank: BioBank;
  contact: ResumeContact;
  target: "screen" | "print";
  onFit?: (info: { cfg: FitConfig; fittedBank: BioBank }) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onFitRef = useRef<typeof onFit>(onFit);
  const cfgRef = useRef<FitConfig | null>(null);
  const baseCfgRef = useRef<FitConfig | null>(null);
  const bankKeyRef = useRef<string>("");
  const tighteningRef = useRef<boolean>(false);
  const baseCfg = useMemo<FitConfig>(() => {
    // Start "as full as possible", then tighten until it fits.
    return {
      expLimit: bank.experiences.length,
      projLimit: bank.projects.length,
      expBullets: maxBulletCount(bank.experiences, 6),
      projBullets: maxBulletCount(bank.projects, 6),
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

    // Assume US Letter with 0.5" margins for printing. We measure the rendered `.rt`
    // and keep it under the printable content box height (10").
    const rtEl = el.querySelector<HTMLElement>(".rt");
    if (!rtEl) return;
    const rt = rtEl;

    // Important: the printable area is 10" tall (11" letter minus 0.5" top/bottom margins),
    // but `.rt` has its own padding (and print padding differs from screen). If we don't
    // subtract that padding, the fitter can think it "fits" while the bottom is clipped.
    const style = window.getComputedStyle(rt);
    const padTop = pxFromCssLength(style.paddingTop);
    const padBottom = pxFromCssLength(style.paddingBottom);
    const maxHeightPx = inchToPx(10) - (padTop + padBottom);

    const bankKey = `${bank.experiences.map((e) => e.id).join("|")}::${bank.projects.map((p) => p.id).join("|")}`;
    if (bankKeyRef.current !== bankKey) {
      bankKeyRef.current = bankKey;
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
          const next = nextTighterConfig(cur, base);
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
  }, [bank, cfg, target]);

  return (
    <div ref={containerRef}>
      <ResumeTemplate bank={fittedBank} contact={contact} />
    </div>
  );
}
