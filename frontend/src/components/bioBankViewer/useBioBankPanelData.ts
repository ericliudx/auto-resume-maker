import { useEffect, useState } from 'react'
import { fetchContactFile } from '../../resume/api/contactApi'
import { fetchBioBank } from '../../resume/api/bioApi'
import type { BioBank } from '../../resume/data/bioTypes'
import type { ResumeContact } from '../../resume/data/contact'

export function useBioBankPanelData(active: boolean) {
  const [baseBank, setBaseBank] = useState<BioBank | null>(null)
  const [error, setError] = useState('')
  const [contact, setContact] = useState<ResumeContact | null>(null)
  const [contactFetched, setContactFetched] = useState(false)

  useEffect(() => {
    if (!active) return
    if (baseBank !== null) return

    let cancelled = false
    void fetchBioBank()
      .then((b) => {
        if (!cancelled) {
          setBaseBank(b)
          setError('')
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setBaseBank(null)
          setError(e instanceof Error ? e.message : 'Failed to load bio bank.')
        }
      })
    return () => {
      cancelled = true
    }
  }, [active, baseBank])

  useEffect(() => {
    if (!active) return
    if (contactFetched) return

    let cancelled = false
    void fetchContactFile()
      .then((c) => {
        if (!cancelled) setContact(c)
      })
      .catch(() => {
        if (!cancelled) setContact(null)
      })
      .finally(() => {
        if (!cancelled) setContactFetched(true)
      })

    return () => {
      cancelled = true
    }
  }, [active, contactFetched])

  return {
    baseBank,
    error,
    loadingBase: baseBank === null && !error,
    contact,
    contactFetched,
  }
}
