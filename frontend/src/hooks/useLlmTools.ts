import { useCallback, useEffect, useState } from 'react'
import { fetchBioBank } from '../resume/api/bioApi'
import type { BioBank } from '../resume/data/bioTypes'
import { llmChat } from '../llm/llmApi'
import { stripOptionalMarkdownCodeFence } from '../llm/text'
import type { TailorModelResult } from '../tailor/tailorTypes'
import { applyTailorResult, bankFingerprint } from '../tailor/tailorBank'
import { buildTailorPrompt } from '../tailor/tailorPrompt'
import { clearTailorPatch, loadTailorPatch, saveTailorPatch } from '../tailor/tailorStorage'

export function useLlmTools(): {
  llmLoading: boolean
  llmOutput: string
  llmError: string
  tailoredBank: BioBank | null
  runLlmSmokeTest: (jobPostingText: string) => Promise<void>
  tailorResume: (jobPostingText: string) => Promise<void>
  clearTailor: () => void
} {
  const [llmOutput, setLlmOutput] = useState<string>('')
  const [llmError, setLlmError] = useState<string>('')
  const [llmLoading, setLlmLoading] = useState<boolean>(false)
  const [tailoredBank, setTailoredBank] = useState<BioBank | null>(null)

  const hydrateTailorFromStorage = useCallback(async () => {
    const patch = loadTailorPatch()
    if (!patch) return
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
    }, 0)
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
        system: 'You are helping a user tailor a resume locally. Be concise. Use only plain text bullets.',
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
        system: 'You are a careful resume tailoring assistant. Output must be strictly valid JSON per the requested shape.',
        user: prompt,
        temperature: 0.2,
      })

      if (data.ok === false) {
        setLlmError(`${data.error.code}: ${data.error.message}`)
        return
      }

      const raw = stripOptionalMarkdownCodeFence(data.result.text)
      const parsed = JSON.parse(raw) as TailorModelResult
      const next = applyTailorResult(bank, parsed)
      saveTailorPatch(parsed)
      setTailoredBank(next)
      setLlmOutput(
        [
          'Tailor applied (derived view; bio bank unchanged).',
          `Base: ${bankFingerprint(bank)}`,
          `Tailored: ${bankFingerprint(next)}`,
          `Selected experienceIds: ${(parsed.experienceIds ?? []).join(', ') || '(none)'}`,
          `Selected projectIds: ${(parsed.projectIds ?? []).join(', ') || '(none)'}`,
        ].join('\n'),
      )
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Tailor request failed.'
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
    clearTailor,
  }
}

