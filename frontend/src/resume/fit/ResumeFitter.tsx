import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { BioBank } from "../data/bioTypes";
import type { ResumeContact } from "../data/contact";
import { PAGE_FIT_NOMINAL_CONTENT_HEIGHT_IN } from "./pageFitHeightPrefs";
import { applyFit, buildInitialFitConfig, cloneFitConfig } from "./resumeFitApply";
import { inchToPx } from "./resumeFitMath";
import { nextTighterConfig } from "./resumeFitTighten";
import type { FitConfig } from "./resumeFitTypes";
import { ResumeTemplate } from "../ResumeTemplate";

export type { FitConfig };

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
  const baseCfg = useMemo<FitConfig>(() => buildInitialFitConfig(bank), [bank]);

  const [cfg, setCfg] = useState<FitConfig>(() => buildInitialFitConfig(bank));

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
    const keyJustChanged = fitLoopKeyRef.current !== fitLoopKey;

    let rafId = 0;
    if (keyJustChanged) {
      fitLoopKeyRef.current = fitLoopKey;
      baseCfgRef.current = baseCfg;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const b = baseCfgRef.current ?? baseCfg;
        // Always a new object so React re-runs this effect even when values match `baseCfg`
        // (otherwise we skip attaching ResizeObserver and the height slider appears stuck).
        setCfg(cloneFitConfig(b));
      });
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

    if (!keyJustChanged) {
      checkAndTighten();
    }

    const ro = new ResizeObserver(() => checkAndTighten());
    ro.observe(rt);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [bank, cfg, target, pageFitExtraHeightPx, baseCfg]);

  return (
    <div ref={containerRef} className="resumeFitterCanvas">
      <ResumeTemplate bank={fittedBank} contact={contact} />
    </div>
  );
}
