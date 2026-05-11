import { useEffect, useMemo, useState } from 'react'
import { fetchBioBank } from '../api/bioApi'
import type { BioBank } from '../data/bioTypes'
import { loadContact, type ResumeContact } from '../data/contact'
import { fetchContactFile } from '../api/contactApi'

export function useResumeData(): {
  bank: BioBank | null
  contact: ResumeContact
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
        if (!cancelled) setBank(b)
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

  return useMemo(() => ({ bank, contact, error, loading: !bank && !error }), [bank, contact, error])
}

