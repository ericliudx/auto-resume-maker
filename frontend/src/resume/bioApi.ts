import type { BioBank, BioBankResponse } from './bioTypes'

export async function fetchBioBank(): Promise<BioBank> {
  const res = await fetch('/api/bio/bank', { cache: 'no-store' })
  const data = (await res.json()) as BioBankResponse
  if (!res.ok || data.ok === false) {
    const msg = data.ok === false ? `${data.error.code}: ${data.error.message}` : `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data.result
}

