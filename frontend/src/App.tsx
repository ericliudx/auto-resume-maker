import { useEffect, useMemo, useState } from 'react'
import { ResumePreview } from './resume/views/ResumePreview'
import { SuperResumePreview } from './resume/views/SuperResumePreview'
import { AppHeader } from './components/AppHeader'
import { Panel, PanelBody } from './components/Panels'
import { SegmentedTabs } from './components/SegmentedTabs'
import { LlmPanel } from './components/LlmPanel'
import { useLocalStorageState } from './hooks/useLocalStorageState'
import { useLlmTools } from './hooks/useLlmTools'
import { useAtsMatch } from './hooks/useAtsMatch'
import type { AtsRole } from './ats/keywordExtract'
import { useLocalStorageNumberState } from './hooks/useLocalStorageNumberState'

const JOB_POSTING_STORAGE_KEY = 'auto-resume.jobPosting.v1'
const ATS_ROLE_STORAGE_KEY = 'auto-resume.atsRole.v1'
const ATS_KEYWORD_LIMIT_STORAGE_KEY = 'auto-resume.atsKeywordLimit.v1'

function App() {
  const isPrint = new URLSearchParams(window.location.search).get('print') === '1'
  const [resumeView, setResumeView] = useState<'resume' | 'super'>('resume')

  const [jobPostingText, setJobPostingText] = useLocalStorageState(JOB_POSTING_STORAGE_KEY, '')
  const {
    llmLoading,
    llmOutput,
    llmError,
    tailoredBank,
    runLlmSmokeTest,
    tailorResume,
    atsTailorResume,
    clearTailor,
  } = useLlmTools()
  const { atsLoading, atsError, report, missingTop, detectedRole, analyze } = useAtsMatch()
  const [atsRole, setAtsRole] = useLocalStorageState(ATS_ROLE_STORAGE_KEY, 'auto')
  const [atsKeywordLimit, setAtsKeywordLimit] = useLocalStorageNumberState(
    ATS_KEYWORD_LIMIT_STORAGE_KEY,
    25,
    { min: 10, max: 60 },
  )

  useEffect(() => {
    if (!isPrint) return
    const t = window.setTimeout(() => window.print(), 50)
    return () => window.clearTimeout(t)
  }, [isPrint])

  const jobPostingStats = useMemo(() => {
    const chars = jobPostingText.length
    const lines = jobPostingText === '' ? 0 : jobPostingText.split('\n').length
    return { chars, lines }
  }, [jobPostingText])

  if (isPrint) {
    // Print route is a new render; ResumePreview uses `useResumeData()` which applies any stored tailor patch.
    return <ResumePreview mode="print" />
  }

  return (
    <div className="w-[1126px] max-w-full mx-auto min-h-[100svh] flex flex-col box-border border-x border-[var(--border)]">
      <AppHeader meta={`Job posting: ${jobPostingStats.lines} lines · ${jobPostingStats.chars} chars`} />

      <main
        className="flex flex-1 min-h-0"
        aria-label="Resume and job posting workspace"
      >
        <div className="flex-1 min-w-0">
          <Panel
            ariaLabel="Resume viewer"
            title={`Resume${tailoredBank ? ' (tailored)' : ''}`}
            hint="Locked template (stable structure)"
            right={
              <SegmentedTabs
                ariaLabel="Resume views"
                value={resumeView}
                onChange={(v) => setResumeView(v)}
                tabs={[
                  { id: 'resume', label: 'Resume' },
                  { id: 'super', label: 'Super-resume' },
                ]}
              />
            }
          >
            <PanelBody>
              <div
                className={[
                  'h-full min-h-0 min-w-0 m-0 px-4 py-3.5 overflow-auto overflow-y-scroll [scrollbar-gutter:stable_both-edges]',
                  'bg-[var(--bg)] text-[var(--text-h)] font-sans text-[13px] leading-[1.35]',
                  // App-only "page view" scale: scale the sheet, not the toolbar/canvas chrome.
                  '[&_.rt]:origin-top [&_.rt]:transform [&_.rt]:scale-[0.88]',
                ].join(' ')}
              >
                {resumeView === 'resume' ? (
                  <ResumePreview mode="app" bankOverride={tailoredBank} />
                ) : (
                  <SuperResumePreview bankOverride={tailoredBank} />
                )}
              </div>
            </PanelBody>
          </Panel>
        </div>

        <div className="border-l border-[var(--border)] w-[320px] shrink-0">
          <Panel ariaLabel="Job posting input" title="Job posting" hint="Saved to this browser (localStorage)">
            <PanelBody>
              <textarea
                className="h-full w-full box-border border-0 m-0 px-4 py-3.5 resize-none outline-none overflow-y-scroll [scrollbar-gutter:stable_both-edges] bg-[var(--bg)] text-[var(--text-h)] font-mono text-[13px] leading-[1.45]"
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
        onRunSmokeTest={() => runLlmSmokeTest(jobPostingText)}
        onTailor={() => tailorResume(jobPostingText)}
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
          analyze({ jobPostingText, role: atsRole as AtsRole, limit: atsKeywordLimit })
        }
        onAtsTailor={async () => {
          await atsTailorResume({ jobPostingText, missingKeywords: missingTop })
          await analyze({ jobPostingText, role: atsRole as AtsRole, limit: atsKeywordLimit })
        }}
        onClear={clearTailor}
      />
    </div>
  )
}

export default App
