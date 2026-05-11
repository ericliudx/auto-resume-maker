import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { ResumePreview } from './resume/ResumePreview'
import { SuperResumePreview } from './resume/SuperResumePreview'

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
    <div className="app">
      <header className="header">
        <div className="header__title">
          <div className="appName">auto-resume</div>
          <div className="appSubtitle">Local resume preview + job posting input</div>
        </div>
        <div className="header__meta">
          <div className="metaPill">
            Job posting: {jobPostingStats.lines} lines · {jobPostingStats.chars} chars
          </div>
        </div>
      </header>

      <main className="grid" aria-label="Resume and job posting workspace">
        <section className="panel" aria-label="Resume viewer">
          <div className="panel__header">
            <div className="panel__headerRow">
              <div>
                <h2 className="panel__title">Resume</h2>
                <div className="panel__hint">Locked template (stable structure)</div>
              </div>
              <div className="tabs" role="tablist" aria-label="Resume views">
                <button
                  type="button"
                  role="tab"
                  aria-selected={resumeView === 'resume'}
                  className={`tab ${resumeView === 'resume' ? 'tab--active' : ''}`}
                  onClick={() => setResumeView('resume')}
                >
                  Resume
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={resumeView === 'super'}
                  className={`tab ${resumeView === 'super' ? 'tab--active' : ''}`}
                  onClick={() => setResumeView('super')}
                >
                  Super-resume
                </button>
              </div>
            </div>
          </div>
          <div className="resumeViewer">
            {resumeView === 'resume' ? <ResumePreview mode="app" /> : <SuperResumePreview />}
          </div>
        </section>

        <section className="panel" aria-label="Job posting input">
          <div className="panel__header">
            <h2 className="panel__title">Job posting</h2>
            <div className="panel__hint">Saved to this browser (localStorage)</div>
          </div>
          <textarea
            className="jobPosting"
            value={jobPostingText}
            onChange={(e) => setJobPostingText(e.target.value)}
            placeholder="Paste the job posting here…"
            spellCheck={false}
          />
        </section>
      </main>

      <section className="panel" aria-label="LLM smoke test">
        <div className="panel__header">
          <h2 className="panel__title">LLM smoke test</h2>
          <div className="panel__hint">
            Calls local `POST /api/llm/chat` (Groq key stays server-side)
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button onClick={runLlmSmokeTest} disabled={llmLoading}>
            {llmLoading ? 'Running…' : 'Run'}
          </button>
          {llmError ? <div style={{ color: '#b91c1c' }}>{llmError}</div> : null}
        </div>

        {llmOutput ? (
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{llmOutput}</pre>
        ) : null}
      </section>
    </div>
  )
}

export default App
