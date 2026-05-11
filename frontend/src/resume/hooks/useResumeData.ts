import { useEffect, useMemo, useState } from 'react'
import { fetchBioBank } from '../api/bioApi'
import type { BioBank } from '../data/bioTypes'
import { loadContact, saveContact, type ResumeContact } from '../data/contact'
import { fetchContactFile } from '../api/contactApi'
import { loadTailorPatch } from '../../tailor/tailorStorage'
import { applyTailorResult } from '../../tailor/tailorBank'

function dedupeStrings(xs: string[]): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const s of xs) {
    const k = s.trim()
    if (!k || seen.has(k)) continue
    seen.add(k)
    out.push(s)
  }
  return out
}

function normalizeBank(b: BioBank): BioBank {
  return {
    ...b,
    experiences: b.experiences.map((e) => ({
      ...e,
      bullets: Array.isArray(e.bullets) ? dedupeStrings(e.bullets) : e.bullets,
    })),
    projects: b.projects.map((p) => ({
      ...p,
      bullets: Array.isArray(p.bullets) ? dedupeStrings(p.bullets) : p.bullets,
    })),
  }
}

export function useResumeData(): {
  bank: BioBank | null
  contact: ResumeContact
  setContact: (next: ResumeContact) => void
  error: string
  loading: boolean
} {
  const [bank, setBank] = useState<BioBank | null>(null)
  const [error, setError] = useState<string>('')
  const [contact, setContact] = useState<ResumeContact>(() => loadContact())

  useEffect(() => {
    let cancelled = false
    fetchBioBank()
      .then((b) => {
        const patch = loadTailorPatch()
        const next = normalizeBank(patch ? applyTailorResult(b, patch) : b)
        if (!cancelled) setBank(next)
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : 'Failed to load bio bank.'
        if (!cancelled) setError(msg)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchContactFile()
      .then((c) => {
        if (!cancelled && c) setContact(c)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const setAndPersistContact = (next: ResumeContact) => {
    setContact(next)
    saveContact(next)
  }

  return useMemo(
    () => ({ bank, contact, setContact: setAndPersistContact, error, loading: !bank && !error }),
    [bank, contact, error],
  )
}

