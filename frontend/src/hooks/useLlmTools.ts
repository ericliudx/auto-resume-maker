import { useCallback, useEffect, useState } from 'react'
import { fetchBioBank } from '../resume/api/bioApi'
import type { BioBank } from '../resume/data/bioTypes'
import { llmChat } from '../llm/llmApi'
import { stripOptionalMarkdownCodeFence } from '../llm/text'
import type { TailorModelResult } from '../tailor/tailorTypes'
import { applyTailorResult, bankFingerprint } from '../tailor/tailorBank'
import { buildTailorPrompt } from '../tailor/tailorPrompt'
import { buildAtsTailorPrompt } from '../tailor/atsTailorPrompt'
import { validateTailorResult } from '../tailor/validateTailor'
import { clearTailorPatch, loadTailorPatch, saveTailorPatch } from '../tailor/tailorStorage'
import { generateDeterministicTailorPatch } from '../tailor/deterministicTailor'
import type { TailorPlan, TailorPlanV2 } from '../tailor/planTypes'
import { sanitizeResumeTypography } from '../tailor/resumeTypography'

export function useLlmTools(): {
  llmLoading: boolean
  llmOutput: string
  llmError: string
  tailoredBank: BioBank | null
  runLlmSmokeTest: (jobPostingText: string) => Promise<void>
  tailorResume: (jobPostingText: string) => Promise<void>
  atsTailorResume: (args: { jobPostingText: string; missingKeywords: string[] }) => Promise<void>
  applyDeterministicPlan: (args: { jobPostingText: string; plan: TailorPlan | TailorPlanV2 }) => Promise<void>
  clearTailor: () => void
} {
  const [llmOutput, setLlmOutput] = useState<string>('')
  const [llmError, setLlmError] = useState<string>('')
  const [llmLoading, setLlmLoading] = useState<boolean>(false)
  const [tailoredBank, setTailoredBank] = useState<BioBank | null>(null)

  const hydrateTailorFromStorage = useCallback(async () => {
    const patch = loadTailorPatch()
    if (!patch) return;
    try {
      const bank = await fetchBioBank()
      setTailoredBank(applyTailorResult(bank, patch))
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

  const runLlmSmokeTest = useCallback(async (jobPostingText: string) => {
    setLlmLoading(true)
    setLlmError('')
    setLlmOutput('')

    try {
      const userText =
        jobPostingText.trim() === ''
          ? 'Write 3 bullet points describing what this app does.'
          : `Summarize the following job posting in 6 concise bullets:\n\n${jobPostingText.slice(0, 12_000)}`

      const data = await llmChat({
        system:
          'You are helping a user tailor a resume locally. Be concise. Use only plain text bullets.',
        user: userText,
        temperature: 0.2,
      })

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
  }, [])

  const tailorResume = useCallback(async (jobPostingText: string) => {
    setLlmLoading(true)
    setLlmError('')
    setLlmOutput('')

    try {
      const bank = await fetchBioBank()
      const jobText = jobPostingText.trim().slice(0, 12_000)
      if (jobText === '') {
        setLlmError('Paste a job posting first.')
        return
      }

      setLlmOutput(`Tailor started… Base bank: ${bankFingerprint(bank)}`)

      const prompt = buildTailorPrompt({ jobText, bank })

      const data = await llmChat({
        system:
          'You are a careful resume tailoring assistant. Output must be strictly valid JSON per the requested shape.',
        user: prompt,
        temperature: 0.2,
      })

      if (data.ok === false) {
        setLlmError(`${data.error.code}: ${data.error.message}`)
        return
      }

      const raw = stripOptionalMarkdownCodeFence(data.result.text)
      let parsed: TailorModelResult
      try {
        parsed = JSON.parse(raw) as TailorModelResult
      } catch {
        setLlmError('Tailor failed: model returned invalid JSON.')
        setLlmOutput(`Raw model output:\n\n${data.result.text}`)
        return
      }

      const validated = validateTailorResult({ base: bank, result: parsed, mode: 'default' })
      if (!validated.ok) {
        setLlmError(`Tailor failed: ${validated.message}`)
        setLlmOutput(`Raw JSON:\n\n${raw}`)
        return
      }

      const next = applyTailorResult(bank, validated.normalized)
      saveTailorPatch(validated.normalized)
      setTailoredBank(next)
      setLlmOutput(
        [
          'Tailor applied (derived view; bio bank unchanged).',
          `Base: ${bankFingerprint(bank)}`,
          `Tailored: ${bankFingerprint(next)}`,
          `Selected experienceIds: ${(validated.normalized.experienceIds ?? []).join(', ') || '(none)'}`,
          `Selected projectIds: ${(validated.normalized.projectIds ?? []).join(', ') || '(none)'}`,
        ].join('\n'),
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tailor request failed.'
      setLlmError(msg)
    } finally {
      setLlmLoading(false)
    }
  }, [])

  const atsTailorResume = useCallback(
    async (args: { jobPostingText: string; missingKeywords: string[] }) => {
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
        if (args.missingKeywords.length === 0) {
          setLlmError('Run Analyze ATS first (no missing keywords found).')
          return
        }

        setLlmOutput(`ATS Tailor started… Base bank: ${bankFingerprint(bank)}`)

        const prompt = buildAtsTailorPrompt({
          jobText,
          bank,
          missingKeywords: args.missingKeywords,
        })
        const data = await llmChat({
          system:
            'You are optimizing keyword match responsibly. Output must be strictly valid JSON per the requested shape.',
          user: prompt,
          temperature: 0.2,
        })

        if (data.ok === false) {
          setLlmError(`${data.error.code}: ${data.error.message}`)
          return
        }

        const raw = stripOptionalMarkdownCodeFence(data.result.text)
        let parsed: TailorModelResult
        try {
          parsed = JSON.parse(raw) as TailorModelResult
        } catch {
          setLlmError('ATS Tailor failed: model returned invalid JSON.')
          setLlmOutput(`Raw model output:\n\n${data.result.text}`)
          return
        }

        const validated = validateTailorResult({ base: bank, result: parsed, mode: 'ats' })
        if (!validated.ok) {
          setLlmError(`ATS Tailor failed: ${validated.message}`)
          setLlmOutput(`Raw JSON:\n\n${raw}`)
          return
        }

        const next = applyTailorResult(bank, validated.normalized)
        saveTailorPatch(validated.normalized)
        setTailoredBank(next)

        const placed = (validated.normalized.keywordMap ?? []).length
        const blocked = (validated.normalized.cannotAdd ?? []).length
        setLlmOutput(
          [
            'ATS Tailor applied (derived view; bio bank unchanged).',
            `Base: ${bankFingerprint(bank)}`,
            `Tailored: ${bankFingerprint(next)}`,
            `Placed keywords: ${placed}`,
            `Cannot add: ${blocked}`,
            blocked
              ? `Top cannotAdd: ${(validated.normalized.cannotAdd ?? [])
                  .slice(0, 5)
                  .map((x) => x.keyword)
                  .join(', ')}`
              : '',
          ]
            .filter(Boolean)
            .join('\n'),
        )
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'ATS Tailor request failed.'
        setLlmError(msg)
      } finally {
        setLlmLoading(false)
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
      // Apply content patch, then optionally apply plan-only course selection (bank-level).
      let next = applyTailorResult(bank, patch)
      if ('experienceIds' in args.plan) {
        const planV2 = args.plan as TailorPlanV2
        if (Array.isArray(planV2.relevantCourses)) {
          const courses = planV2.relevantCourses.map((c) => sanitizeResumeTypography(String(c)))
          next = {
            ...next,
            education: next.education.map((e) =>
              e.type === 'course_bank' ? { ...e, courses } : e,
            ),
          }
        }
      }
      saveTailorPatch(patch)
      setTailoredBank(next)
      setLlmOutput(
        [
          'Applied deterministic plan (selection + ordering).',
          `Tailored: ${bankFingerprint(next)}`,
          `Selected experienceIds: ${(patch.experienceIds ?? []).join(', ') || '(none)'}`,
          `Selected projectIds: ${(patch.projectIds ?? []).join(', ') || '(none)'}`,
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
    runLlmSmokeTest,
    tailorResume,
    atsTailorResume,
    applyDeterministicPlan,
    clearTailor,
  }
}
