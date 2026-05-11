import { Panel, PanelBody } from './Panels'

export function LlmPanel({
  loading,
  output,
  error,
  hasTailoredBank,
  onRunSmokeTest,
  onTailor,
  onClear,
}: {
  loading: boolean
  output: string
  error: string
  hasTailoredBank: boolean
  onRunSmokeTest: () => void
  onTailor: () => void
  onClear: () => void
}) {
  return (
    <div className="border-t border-[var(--border)]">
      <Panel
        ariaLabel="LLM smoke test"
        title="LLM (smoke test + tailor)"
        hint={
          <>
            Calls local <code className="px-1 py-0.5 rounded bg-[var(--code-bg)]">POST /api/llm/chat</code>{' '}
            (Groq key stays server-side)
          </>
        }
      >
        <PanelBody className="px-4 py-3.5">
          <div className="flex gap-3 items-center">
            <button
              onClick={onRunSmokeTest}
              disabled={loading}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--social-bg)] text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
            >
              {loading ? 'Running…' : 'Run'}
            </button>
            <button
              onClick={onTailor}
              disabled={loading}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--social-bg)] text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
            >
              {loading ? 'Tailoring…' : 'Tailor'}
            </button>
            <button
              onClick={onClear}
              disabled={loading || !hasTailoredBank}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
            >
              Clear
            </button>
            {error ? <div className="text-[#b91c1c] text-xs">{error}</div> : null}
          </div>

          {output ? <pre className="whitespace-pre-wrap mt-3 text-xs text-[var(--text-h)]">{output}</pre> : null}
        </PanelBody>
      </Panel>
    </div>
  )
}

