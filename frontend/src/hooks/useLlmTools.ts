import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBioBank } from '../resume/api/bioApi'
import type { BioBank } from '../resume/data/bioTypes'
import type { AtsRole } from '../ats/keywordExtract'
import { llmChat } from '../llm/llmApi'
import { stripOptionalMarkdownCodeFence } from '../llm/text'
import type { TailorModelResult } from '../tailor/tailorTypes'
import { applyTailorPatchToBank, bankFingerprint } from '../tailor/tailorBank'
import { buildTailorPrompt } from '../tailor/tailorPrompt'
import { validateTailorResult } from '../tailor/validateTailor'
import { clearTailorPatch, loadTailorPatch, saveTailorPatch } from '../tailor/tailorStorage'
import { generateDeterministicTailorPatch } from '../tailor/deterministicTailor'
import type { TailorPlan, TailorPlanV2 } from '../tailor/planTypes'
import { parseLlmTailorResponseText } from '../tailor/llmTailorResponse'
import { capRelevantCoursesList } from '../tailor/relevantCoursesCap'
import { buildTailorApplyDebug } from '../tailor/tailorDebugSummary'

export type TailorPlanAppliedArgs = {
  role: AtsRole
  keywordLimit: number
  /** Same trimmed slice used for the LLM prompt (≤12k), for post-tailor ATS scoring. */
  jobPostingText: string
}

export function useLlmTools(options?: {
  onTailorPlanApplied?: (args: TailorPlanAppliedArgs) => void
}): {
  llmLoading: boolean
  llmOutput: string
  llmError: string
  tailoredBank: BioBank | null
  tailorResume: (
    jobPostingText: string,
    tailorOpts: { atsRole: AtsRole; atsKeywordLimit: number },
  ) => Promise<void>
  applyDeterministicPlan: (args: { jobPostingText: string; plan: TailorPlan | TailorPlanV2 }) => Promise<void>
  clearTailor: () => void
} {
  const onTailorPlanAppliedRef = useRef(options?.onTailorPlanApplied)
  useEffect(() => {
    onTailorPlanAppliedRef.current = options?.onTailorPlanApplied
  }, [options?.onTailorPlanApplied])

  const [llmOutput, setLlmOutput] = useState<string>('')
  const [llmError, setLlmError] = useState<string>('')
  const [llmLoading, setLlmLoading] = useState<boolean>(false)
  const [tailoredBank, setTailoredBank] = useState<BioBank | null>(null)
  /** Suppresses stale async completions when a newer tailor run starts. */
  const tailorRequestIdRef = useRef(0)

  const hydrateTailorFromStorage = useCallback(async () => {
    const patch = loadTailorPatch()
    if (!patch) return;
    try {
      const bank = await fetchBioBank()
      setTailoredBank(applyTailorPatchToBank(bank, patch))
    } catch {
      // ignore
    }
  }, [])

  // Fire-and-forget hydration for app view; print view uses `useResumeData()` anyway.
  useEffect(() => {
    const t = window.setTimeout(() => {
      void hydrateTailorFromStorage()
    }, 0);
    return () => window.clearTimeout(t)
  }, [hydrateTailorFromStorage])

  const tailorResume = useCallback(
    async (jobPostingText: string, tailorOpts: { atsRole: AtsRole; atsKeywordLimit: number }) => {
      const requestId = ++tailorRequestIdRef.current
      setLlmLoading(true)
      setLlmError('')
      setLlmOutput('')

      const stale = () => requestId !== tailorRequestIdRef.current

      try {
        const bank = await fetchBioBank()
        if (stale()) return

        const jobText = jobPostingText.trim().slice(0, 12_000)
        if (jobText === '') {
          if (!stale()) setLlmError('Paste a job posting first.')
          return
        }

        if (!stale()) {
          setLlmOutput(`Tailor started… Base bank: ${bankFingerprint(bank)}`)
        }

        const prompt = buildTailorPrompt({
          jobText,
          bank,
          atsRole: tailorOpts.atsRole,
          atsKeywordLimit: tailorOpts.atsKeywordLimit,
        })

        const data = await llmChat({
          system:
            'Follow the user message exactly. Output a JSON object first (valid JSON, pdfFileName required), then the BIGGEST_GAPS section as specified. No markdown around the JSON.',
          user: prompt,
          temperature: 0.2,
        })

        if (stale()) return

        if (data.ok === false) {
          setLlmError(`${data.error.code}: ${data.error.message}`)
          return
        }

        const raw = stripOptionalMarkdownCodeFence(data.result.text)
        const parsedPlan = parseLlmTailorResponseText(raw)
        if (parsedPlan.ok === false) {
          setLlmError(`Tailor failed: ${parsedPlan.error}`)
          setLlmOutput(`Raw model output:\n\n${data.result.text}`)
          return
        }

        const parsed = parsedPlan.plan.model

        const validated = validateTailorResult({ base: bank, result: parsed, mode: 'default' })
        if (!validated.ok) {
          setLlmError(`Tailor failed: ${validated.message}`)
          setLlmOutput(`Raw JSON:\n\n${raw}`)
          return
        }

        if (stale()) return

        const prev = loadTailorPatch()
        const merged: TailorModelResult = {
          ...validated.normalized,
          ...(!validated.normalized.relevantCourses?.length && prev?.relevantCourses?.length
            ? { relevantCourses: prev.relevantCourses }
            : {}),
        }
        merged.relevantCourses = capRelevantCoursesList(merged.relevantCourses)
        const next = applyTailorPatchToBank(bank, merged)
        saveTailorPatch(merged)
        setTailoredBank(next)
        onTailorPlanAppliedRef.current?.({
          role: parsedPlan.plan.atsRole,
          keywordLimit: parsedPlan.plan.atsKeywordLimit,
          jobPostingText: jobText,
        })
        const outputChunks = [
          'Tailor applied (derived view; bio bank unchanged).',
          `Base: ${bankFingerprint(bank)}`,
          `Tailored: ${bankFingerprint(next)}`,
          `Print/PDF title (saved): ${merged.pdfFileName ?? '(none)'}`,
          `Selected experienceIds: ${(merged.experienceIds ?? []).join(', ') || '(none)'}`,
          `Selected projectIds: ${(merged.projectIds ?? []).join(', ') || '(none)'}`,
          '',
          buildTailorApplyDebug(bank, merged),
        ]
        if (parsedPlan.plan.gapsText) {
          outputChunks.push('---', `BIGGEST_GAPS:\n${parsedPlan.plan.gapsText}`)
        }
        setLlmOutput(outputChunks.join('\n'))
      } catch (e: unknown) {
        if (stale()) return
        const msg = e instanceof Error ? e.message : 'Tailor request failed.'
        setLlmError(msg)
      } finally {
        if (requestId === tailorRequestIdRef.current) {
          setLlmLoading(false)
        }
      }
    },
    [],
  )

  const applyDeterministicPlan = useCallback(async (args: { jobPostingText: string; plan: TailorPlan | TailorPlanV2 }) => {
    setLlmLoading(true)
    setLlmError('')
    setLlmOutput('')

    try {
      const bank = await fetchBioBank()
      const jobText = args.jobPostingText.trim().slice(0, 12_000)
      if (jobText === '') {
        setLlmError('Paste a job posting first.')
        return
      }

      const patch = generateDeterministicTailorPatch({ bank, jobText, plan: args.plan })
      const next = applyTailorPatchToBank(bank, patch)
      saveTailorPatch(patch)
      setTailoredBank(next)
      setLlmOutput(
        [
          'Applied deterministic plan (selection + ordering).',
          `Tailored: ${bankFingerprint(next)}`,
          `Selected experienceIds: ${(patch.experienceIds ?? []).join(', ') || '(none)'}`,
          `Selected projectIds: ${(patch.projectIds ?? []).join(', ') || '(none)'}`,
          '',
          buildTailorApplyDebug(bank, patch),
        ].join('\n'),
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Apply plan failed.'
      setLlmError(msg)
    } finally {
      setLlmLoading(false)
    }
  }, [])

  const clearTailor = useCallback(() => {
    clearTailorPatch()
    setTailoredBank(null)
  }, [])

  return {
    llmLoading,
    llmOutput,
    llmError,
    tailoredBank,
    tailorResume,
    applyDeterministicPlan,
    clearTailor,
  }
}
