import { useMemo, useState } from "react";
import { ResumePreview } from "./resume/views/ResumePreview";
import { SuperResumePreview } from "./resume/views/SuperResumePreview";
import { AppHeader } from "./components/AppHeader";
import { Panel, PanelBody } from "./components/Panels";
import { SegmentedTabs } from "./components/SegmentedTabs";
import { LlmPanel } from "./components/LlmPanel";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { useLlmTools } from "./hooks/useLlmTools";
import { useAtsMatch } from "./hooks/useAtsMatch";
import type { AtsRole } from "./ats/keywordExtract";
import { useLocalStorageNumberState } from "./hooks/useLocalStorageNumberState";
import { parseTailorPlan } from "./tailor/parseTailorPlan";

const JOB_POSTING_STORAGE_KEY = "auto-resume.jobPosting.v1";
const ATS_ROLE_STORAGE_KEY = "auto-resume.atsRole.v1";
const ATS_KEYWORD_LIMIT_STORAGE_KEY = "auto-resume.atsKeywordLimit.v1";
const TAILOR_PLAN_STORAGE_KEY = "auto-resume.tailorPlanText.v1";

function App() {
  const isPrint =
    new URLSearchParams(window.location.search).get("print") === "1";
  const [resumeView, setResumeView] = useState<"resume" | "super">("resume");

  const [jobPostingText, setJobPostingText] = useLocalStorageState(
    JOB_POSTING_STORAGE_KEY,
    "",
  );
  const {
    llmLoading,
    llmOutput,
    llmError,
    tailoredBank,
    tailorResume,
    applyDeterministicPlan,
    clearTailor,
  } = useLlmTools({
    onTailorPlanApplied: ({ role, keywordLimit }) => {
      setAtsRole(role);
      setAtsKeywordLimit(keywordLimit);
      void analyze({
        jobPostingText,
        role,
        limit: keywordLimit,
      });
    },
  });
  const { atsLoading, atsError, report, missingTop, detectedRole, analyze } =
    useAtsMatch();
  const [atsRole, setAtsRole] = useLocalStorageState(
    ATS_ROLE_STORAGE_KEY,
    "auto",
  );
  const [atsKeywordLimit, setAtsKeywordLimit] = useLocalStorageNumberState(
    ATS_KEYWORD_LIMIT_STORAGE_KEY,
    25,
    { min: 10, max: 60 },
  );
  const [planText, setPlanText] = useLocalStorageState(
    TAILOR_PLAN_STORAGE_KEY,
    "",
  );
  const [planError, setPlanError] = useState<string>("");

  const jobPostingStats = useMemo(() => {
    const chars = jobPostingText.length;
    const lines = jobPostingText === "" ? 0 : jobPostingText.split("\n").length;
    return { chars, lines };
  }, [jobPostingText]);

  if (isPrint) {
    // Print route is a new render; ResumePreview uses `useResumeData()` which applies any stored tailor patch.
    return <ResumePreview mode="print" />;
  }

  return (
    <div className="w-[1126px] max-w-full mx-auto min-h-[100svh] flex flex-col box-border border-x border-[var(--border)]">
      <AppHeader
        meta={`Job posting: ${jobPostingStats.lines} lines · ${jobPostingStats.chars} chars`}
      />

      <main
        className="flex flex-1 min-h-0"
        aria-label="Resume and job posting workspace"
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Panel
            ariaLabel="Resume viewer"
            title={`Resume${tailoredBank ? " (tailored)" : ""}`}
            hint="Locked template (stable structure)"
            right={
              <SegmentedTabs
                ariaLabel="Resume views"
                value={resumeView}
                onChange={(v) => setResumeView(v)}
                tabs={[
                  { id: "resume", label: "Resume" },
                  { id: "super", label: "Super-resume" },
                ]}
              />
            }
          >
            <PanelBody>
              <div
                className={[
                  "min-h-0 min-w-0 flex-1 m-0 px-4 py-3.5 overflow-auto overflow-y-scroll [scrollbar-gutter:stable_both-edges]",
                  "bg-[var(--bg)] text-[var(--text-h)] font-sans text-[13px] leading-[1.35]",
                  // App-only "page view" scale: scale the sheet, not the toolbar/canvas chrome.
                  "[&_.rt]:origin-top [&_.rt]:transform [&_.rt]:scale-[0.88]",
                ].join(" ")}
              >
                {resumeView === "resume" ? (
                  <ResumePreview mode="app" bankOverride={tailoredBank} />
                ) : (
                  <SuperResumePreview bankOverride={tailoredBank} />
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="flex min-h-0 w-[320px] shrink-0 flex-col border-l border-[var(--border)]">
          <Panel
            ariaLabel="Job posting input"
            title="Job posting"
            hint="Saved to this browser (localStorage)"
          >
            <PanelBody className="min-h-0">
              <textarea
                className="min-h-0 w-full flex-1 box-border border-0 m-0 px-4 py-3.5 resize-none outline-none overflow-y-scroll [scrollbar-gutter:stable_both-edges] bg-[var(--bg)] text-[var(--text-h)] font-mono text-[13px] leading-[1.45]"
                value={jobPostingText}
                onChange={(e) => setJobPostingText(e.target.value)}
                placeholder="Paste the job posting here…"
                spellCheck={false}
              />
            </PanelBody>
          </Panel>
        </div>
      </main>

      <LlmPanel
        loading={llmLoading}
        output={llmOutput}
        error={llmError}
        hasTailoredBank={Boolean(tailoredBank)}
        onTailor={() =>
          tailorResume(jobPostingText, {
            atsRole: atsRole as AtsRole,
            atsKeywordLimit,
          })
        }
        planText={planText}
        planError={planError}
        onChangePlanText={(t) => {
          setPlanText(t);
          setPlanError("");
        }}
        onApplyPlan={async () => {
          const parsed = parseTailorPlan(planText);
          if (parsed.ok === false) {
            setPlanError(parsed.error);
            return;
          }
          setPlanError("");
          await applyDeterministicPlan({ jobPostingText, plan: parsed.plan });
          // Also sync ATS controls to match the plan so Analyze ATS aligns.
          setAtsRole(parsed.plan.role);
          setAtsKeywordLimit(parsed.plan.keywordLimit);
          await analyze({
            jobPostingText,
            role: parsed.plan.role,
            limit: parsed.plan.keywordLimit,
          });
        }}
        atsLoading={atsLoading}
        atsError={atsError}
        atsScore={report?.score ?? null}
        atsMissingTop={missingTop}
        atsRole={atsRole as AtsRole}
        atsKeywordLimit={atsKeywordLimit}
        atsDetected={detectedRole}
        onChangeAtsRole={(r) => setAtsRole(r)}
        onChangeAtsKeywordLimit={(n) => setAtsKeywordLimit(n)}
        onAnalyzeAts={() =>
          analyze({
            jobPostingText,
            role: atsRole as AtsRole,
            limit: atsKeywordLimit,
          })
        }
        onClear={clearTailor}
      />
    </div>
  );
}

export default App;
