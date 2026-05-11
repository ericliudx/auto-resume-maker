import { useCallback, useMemo, useState } from 'react'
import { fetchBioBank } from '../resume/api/bioApi'
import type { BioBank } from '../resume/data/bioTypes'
import { detectAtsRole, extractAtsKeywords, type AtsRole } from '../ats/keywordExtract'
import { computeAtsMatchReport, type AtsMatchReport } from '../ats/match'
import { loadTailorPatch } from '../tailor/tailorStorage'
import { applyTailorResult } from '../tailor/tailorBank'

export function useAtsMatch(): {
  atsLoading: boolean
  atsError: string
  report: AtsMatchReport | null
  missingTop: string[]
  detectedRole: { role: Exclude<AtsRole, 'auto'>; confidence: number } | null
  analyze: (args: { jobPostingText: string; role: AtsRole; limit: number }) => Promise<void>
} {
  const [atsLoading, setAtsLoading] = useState(false)
  const [atsError, setAtsError] = useState('')
  const [report, setReport] = useState<AtsMatchReport | null>(null)
  const [detectedRole, setDetectedRole] = useState<{ role: Exclude<AtsRole, 'auto'>; confidence: number } | null>(
    null,
  )

  const analyze = useCallback(async (args: { jobPostingText: string; role: AtsRole; limit: number }) => {
    setAtsLoading(true)
    setAtsError('')
    try {
      const base = await fetchBioBank()
      const patch = loadTailorPatch()
      const bank: BioBank = patch ? applyTailorResult(base, patch) : base

      setDetectedRole(args.role === 'auto' ? detectAtsRole(args.jobPostingText) : null)
      const keywords = extractAtsKeywords(args.jobPostingText, {
        limit: args.limit,
        role: args.role,
      })
      const rep = computeAtsMatchReport({ bank, keywords })
      setReport(rep)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'ATS analysis failed.'
      setAtsError(msg)
      setReport(null)
      setDetectedRole(null)
    } finally {
      setAtsLoading(false)
    }
  }, [])

  const missingTop = useMemo(() => (report?.missing ?? []).slice(0, 12), [report])

  return { atsLoading, atsError, report, missingTop, detectedRole, analyze }
}

