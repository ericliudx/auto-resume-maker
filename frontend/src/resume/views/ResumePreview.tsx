import { ResumeFitter } from "../fit/ResumeFitter";
import { useResumeData } from "../hooks/useResumeData";
import { ResumeScope } from "../ui/ResumeScope";
import { ResumeCanvas, ResumeError, ResumeToolbar } from "../ui/ResumeShell";
import { ContactEditor } from "../ui/ContactEditor";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BioBank } from "../data/bioTypes";
import { ResumeTemplate } from "../ResumeTemplate";
import { loadTailorPatch } from "../../tailor/tailorStorage";
import { documentTitleForPrint } from "../printResumeTitle";

/** Avoid duplicate `window.print()` under React StrictMode (dev) double-mount. */
let resumePrintAutoLock = false;

export function ResumePreview({
  mode,
  bankOverride,
}: {
  mode: "app" | "print";
  bankOverride?: BioBank | null;
}) {
  const { bank, contact, setContact, error, loading, contactSynced } =
    useResumeData();
  const [showContact, setShowContact] = useState<boolean>(false);
  const [fitEnabled, setFitEnabled] = useState<boolean>(true);
  const contactRef = useRef(contact);
  contactRef.current = contact;
  const [fitInfo, setFitInfo] = useState<{
    cfg: {
      expLimit: number;
      projLimit: number;
      expBullets: number;
      projBullets: number;
    };
    fittedBank: BioBank;
  } | null>(null);
  const handleFit = useCallback(
    (info: {
      cfg: {
        expLimit: number;
        projLimit: number;
        expBullets: number;
        projBullets: number;
      };
      fittedBank: BioBank;
    }) => {
      setFitInfo(info);
    },
    [],
  );

  const resume = (() => {
    const effectiveBank = bankOverride ?? bank;
    if (!effectiveBank) return null;
    if (mode !== "print" && !fitEnabled) {
      return <ResumeTemplate bank={effectiveBank} contact={contact} />;
    }
    return (
      <ResumeFitter
        bank={effectiveBank}
        contact={contact}
        target={mode === "print" ? "print" : "screen"}
        onFit={handleFit}
      />
    );
  })();

  const trimSummary = useMemo(() => {
    if (!fitInfo) return null;
    const effectiveBank = bankOverride ?? bank;
    if (!effectiveBank) return null;
    const { cfg, fittedBank } = fitInfo;

    const expDropped = Math.max(
      0,
      effectiveBank.experiences.length - fittedBank.experiences.length,
    );
    const projDropped = Math.max(
      0,
      effectiveBank.projects.length - fittedBank.projects.length,
    );
    const expBulletsDropped =
      effectiveBank.experiences.reduce(
        (n, e) => n + (e.bullets?.length ?? 0),
        0,
      ) -
      fittedBank.experiences.reduce((n, e) => n + (e.bullets?.length ?? 0), 0);
    const projBulletsDropped =
      effectiveBank.projects.reduce((n, p) => n + (p.bullets?.length ?? 0), 0) -
      fittedBank.projects.reduce((n, p) => n + (p.bullets?.length ?? 0), 0);

    return {
      cfg,
      expDropped,
      projDropped,
      expBulletsDropped,
      projBulletsDropped,
    };
  }, [fitInfo, bank, bankOverride]);

  useEffect(() => {
    if (mode !== "print") {
      resumePrintAutoLock = false;
      return;
    }
    if (!bank || !contactSynced || error) return;
    if (resumePrintAutoLock) return;
    resumePrintAutoLock = true;

    const prevTitle = document.title;
    const patch = loadTailorPatch();
    document.title = documentTitleForPrint(contactRef.current, patch);

    const t = window.setTimeout(() => window.print(), 80);

    const restoreTitle = () => {
      document.title = prevTitle;
    };
    window.addEventListener("afterprint", restoreTitle);

    return () => {
      window.clearTimeout(t);
      window.removeEventListener("afterprint", restoreTitle);
      restoreTitle();
      if (import.meta.env.DEV) resumePrintAutoLock = false;
    };
  }, [mode, bank, contactSynced, error]);

  if (mode === "print") {
    return (
      <ResumeScope className="printRoot">
        <div className="printHelp">
          To remove the tiny URL/date text in the PDF, disable browser print
          headers/footers (Chrome: uncheck <code>Headers and footers</code> in
          the print dialog).
        </div>
        {error ? <div className="printError">{error}</div> : null}
        {resume}
      </ResumeScope>
    );
  }

  return (
    <ResumeScope className="resumePane">
      <ResumeToolbar
        right={
          <>
            <button
              type="button"
              className="resumePane__button"
              onClick={() => setFitEnabled((v) => !v)}
              title="Toggle one-page fitting (app preview only)"
            >
              {fitEnabled ? "Fit: on" : "Fit: off"}
            </button>
            <button
              type="button"
              className="resumePane__button"
              onClick={() => setShowContact((v) => !v)}
            >
              {showContact ? "Hide contact" : "Edit contact"}
            </button>
          </>
        }
      >
        {showContact ? (
          <ContactEditor value={contact} onChange={setContact} />
        ) : null}
        {trimSummary && fitEnabled ? (
          <div className="mt-2 mx-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-2 text-xs text-[var(--text)]">
            Fit summary: expLimit {trimSummary.cfg.expLimit}, projLimit{" "}
            {trimSummary.cfg.projLimit}, expBullets {trimSummary.cfg.expBullets}
            , projBullets {trimSummary.cfg.projBullets}. Trimmed:{" "}
            {trimSummary.expDropped} exp, {trimSummary.projDropped} proj,{" "}
            {trimSummary.expBulletsDropped} exp bullets,{" "}
            {trimSummary.projBulletsDropped} proj bullets.
          </div>
        ) : null}
      </ResumeToolbar>
      {error ? <ResumeError message={error} /> : null}
      <ResumeCanvas loading={loading}>{resume}</ResumeCanvas>
    </ResumeScope>
  );
}
