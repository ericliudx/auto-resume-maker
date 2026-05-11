import { useEffect, useMemo, useState } from 'react'
import { ResumePreview } from './resume/views/ResumePreview'
import { SuperResumePreview } from './resume/views/SuperResumePreview'
import { AppHeader } from './components/AppHeader'
import { Panel, PanelBody } from './components/Panels'
import { SegmentedTabs } from './components/SegmentedTabs'

const JOB_POSTING_STORAGE_KEY = 'auto-resume.jobPosting.v1'

type LlmChatResponse =
  | {
      ok: true
      result: {
        text: string
        model: string
        usage?: { inputTokens: number; outputTokens: number }
      }
    }
  | { ok: false; error: { code: string; message: string } }

function App() {
  const isPrint = new URLSearchParams(window.location.search).get('print') === '1'
  const [resumeView, setResumeView] = useState<'resume' | 'super'>('resume')

  const [jobPostingText, setJobPostingText] = useState<string>(() => {
    const saved = localStorage.getItem(JOB_POSTING_STORAGE_KEY)
    return saved ?? ''
  })
  const [llmOutput, setLlmOutput] = useState<string>('')
  const [llmError, setLlmError] = useState<string>('')
  const [llmLoading, setLlmLoading] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem(JOB_POSTING_STORAGE_KEY, jobPostingText)
  }, [jobPostingText])

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

  async function runLlmSmokeTest() {
    setLlmLoading(true)
    setLlmError('')
    setLlmOutput('')

    try {
      const userText =
        jobPostingText.trim() === ''
          ? 'Write 3 bullet points describing what this app does.'
          : `Summarize the following job posting in 6 concise bullets:\n\n${jobPostingText.slice(0, 12_000)}`

      const res = await fetch('/api/llm/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system:
            'You are helping a user tailor a resume locally. Be concise. Use only plain text bullets.',
          user: userText,
          temperature: 0.2,
        }),
      })

      const data = (await res.json()) as LlmChatResponse
      if (data.ok === false) {
        setLlmError(`${data.error.code}: ${data.error.message}`)
        return
      }
      setLlmOutput(data.result.text)
    } catch {
      setLlmError('Request failed. Is the dev server running?')
    } finally {
      setLlmLoading(false)
    }
  }

  if (isPrint) {
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
            title="Resume"
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
                {resumeView === 'resume' ? <ResumePreview mode="app" /> : <SuperResumePreview />}
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

      <div className="border-t border-[var(--border)]">
        <Panel
          ariaLabel="LLM smoke test"
          title="LLM smoke test"
          hint={
            <>
              Calls local <code className="px-1 py-0.5 rounded bg-[var(--code-bg)]">POST /api/llm/chat</code> (Groq key stays server-side)
            </>
          }
        >
          <PanelBody className="px-4 py-3.5">
            <div className="flex gap-3 items-center">
              <button
                onClick={runLlmSmokeTest}
                disabled={llmLoading}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--social-bg)] text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
              >
                {llmLoading ? 'Running…' : 'Run'}
              </button>
              {llmError ? <div className="text-[#b91c1c] text-xs">{llmError}</div> : null}
            </div>

            {llmOutput ? (
              <pre className="whitespace-pre-wrap mt-3 text-xs text-[var(--text-h)]">{llmOutput}</pre>
            ) : null}
          </PanelBody>
        </Panel>
      </div>
    </div>
  )
}

export default App
