import { Panel, PanelBody } from './Panels'
import type { AtsRole } from '../ats/keywordExtract'

function roleLabel(role: Exclude<AtsRole, 'auto'>): string {
  switch (role) {
    case 'software_eng':
      return 'SWE'
    case 'data_eng':
      return 'Data Eng'
    case 'data_science':
      return 'Data Sci'
    case 'project_management':
      return 'PM'
    case 'data_analysis':
      return 'Data Analyst'
    case 'systems_eng':
      return 'Systems'
    case 'industrial_eng':
      return 'Industrial'
  }
}

export function LlmPanel({
  loading,
  output,
  error,
  hasTailoredBank,
  onRunSmokeTest,
  onTailor,
  planText,
  planError,
  onChangePlanText,
  onApplyPlan,
  atsLoading,
  atsScore,
  atsMissingTop,
  atsError,
  atsRole,
  atsKeywordLimit,
  atsDetected,
  onChangeAtsRole,
  onChangeAtsKeywordLimit,
  onAnalyzeAts,
  onAtsTailor,
  onClear,
}: {
  loading: boolean
  output: string
  error: string
  hasTailoredBank: boolean
  onRunSmokeTest: () => void
  onTailor: () => void
  planText: string
  planError: string
  onChangePlanText: (next: string) => void
  onApplyPlan: () => void
  atsLoading: boolean
  atsScore: number | null
  atsMissingTop: string[]
  atsError: string
  atsRole: AtsRole
  atsKeywordLimit: number
  atsDetected: { role: Exclude<AtsRole, 'auto'>; confidence: number } | null
  onChangeAtsRole: (role: AtsRole) => void
  onChangeAtsKeywordLimit: (n: number) => void
  onAnalyzeAts: () => void
  onAtsTailor: () => void
  onClear: () => void
}) {
  return (
    <div className="border-t border-[var(--border)]">
      <Panel
        ariaLabel="LLM smoke test"
        title="LLM (smoke test + tailor + ATS)"
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
              onClick={onAnalyzeAts}
              disabled={atsLoading}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-transparent text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
            >
              {atsLoading ? 'Analyzing…' : 'Analyze ATS'}
            </button>
            <button
              onClick={onAtsTailor}
              disabled={loading || atsMissingTop.length === 0}
              className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--social-bg)] text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
              title={atsMissingTop.length === 0 ? 'Run Analyze ATS first' : 'Tailor targeting missing keywords'}
            >
              {loading ? 'Tailoring…' : 'ATS Tailor'}
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

          <div className="mt-3">
            <div className="text-xs text-[var(--text)] mb-2">Tailor plan (paste from Cursor)</div>
            <textarea
              className="w-full h-[96px] resize-none rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] text-xs font-mono px-2 py-2 outline-none"
              value={planText}
              onChange={(e) => onChangePlanText(e.target.value)}
              placeholder={`TARGET_ROLE: auto\nKEYWORD_LIMIT: 25\nMUST_INCLUDE_EXPERIENCE_IDS: realtorch_listing_qc_tool\nKEYWORDS_TO_FORCE: docker, kubernetes, azure`}
              spellCheck={false}
            />
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={onApplyPlan}
                disabled={loading}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--social-bg)] text-[var(--text-h)] text-xs leading-none disabled:opacity-60"
              >
                Apply plan (deterministic)
              </button>
              {planError ? <div className="text-[#b91c1c] text-xs">{planError}</div> : null}
            </div>
          </div>

          <div className="mt-3 text-xs text-[var(--text-h)]">
            <div className="flex items-center gap-3">
              <div>
                ATS score:{' '}
                <span className="font-mono">{atsScore == null ? '—' : `${atsScore}/100`}</span>
              </div>
              <label className="flex items-center gap-2">
                <span className="text-[var(--text)]">Role</span>
                <select
                  className="text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] outline-none"
                  value={atsRole}
                  onChange={(e) => onChangeAtsRole(e.target.value as AtsRole)}
                >
                  <option value="auto">Auto</option>
                  <option value="software_eng">SWE</option>
                  <option value="data_eng">Data Eng</option>
                  <option value="data_science">Data Sci</option>
                  <option value="project_management">PM</option>
                  <option value="data_analysis">Data Analyst</option>
                  <option value="systems_eng">Systems</option>
                  <option value="industrial_eng">Industrial</option>
                </select>
              </label>
              {atsRole === 'auto' && atsDetected ? (
                <div className="text-[var(--text)]">
                  Detected: <span className="font-mono">{roleLabel(atsDetected.role)}</span>{' '}
                  <span className="font-mono">({Math.round(atsDetected.confidence * 100)}%)</span>
                </div>
              ) : null}
              <label className="flex items-center gap-2">
                <span className="text-[var(--text)]">Keywords</span>
                <input
                  className="w-[64px] text-xs px-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-h)] outline-none font-mono"
                  value={atsKeywordLimit}
                  onChange={(e) => onChangeAtsKeywordLimit(Number(e.target.value))}
                  inputMode="numeric"
                />
              </label>
              {atsError ? <div className="text-[#b91c1c]">{atsError}</div> : null}
            </div>
            {atsMissingTop.length ? (
              <div className="mt-2">
                <div className="text-[var(--text)]">Top missing keywords:</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {atsMissingTop.map((k) => (
                    <span
                      key={k}
                      className="px-2 py-1 rounded-full border border-[var(--border)] bg-[var(--bg)] font-mono text-[11px]"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {output ? <pre className="whitespace-pre-wrap mt-3 text-xs text-[var(--text-h)]">{output}</pre> : null}
        </PanelBody>
      </Panel>
    </div>
  )
}

