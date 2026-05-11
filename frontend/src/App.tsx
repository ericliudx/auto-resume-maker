import { useEffect, useMemo, useState } from 'react'
import './App.css'

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
  const [jobPostingText, setJobPostingText] = useState<string>(() => {
    const saved = localStorage.getItem(JOB_POSTING_STORAGE_KEY)
    return saved ?? ''
  })
  const [resumeText, setResumeText] = useState<string>('')
  const [llmOutput, setLlmOutput] = useState<string>('')
  const [llmError, setLlmError] = useState<string>('')
  const [llmLoading, setLlmLoading] = useState<boolean>(false)

  useEffect(() => {
    localStorage.setItem(JOB_POSTING_STORAGE_KEY, jobPostingText)
  }, [jobPostingText])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/resume.txt', { cache: 'no-store' })
        if (!res.ok) throw new Error(`Failed to load resume.txt: ${res.status}`)
        const text = await res.text()
        if (!cancelled) setResumeText(text)
      } catch {
        if (!cancelled) {
          setResumeText(
            [
              'No resume preview found yet.',
              '',
              'Add a file at `frontend/public/resume.txt` to populate this viewer.',
            ].join('\n'),
          )
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

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
            <h2 className="panel__title">Resume</h2>
            <div className="panel__hint">Loaded from `frontend/public/resume.txt`</div>
          </div>
          <pre className="resumeViewer">{resumeText}</pre>
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
