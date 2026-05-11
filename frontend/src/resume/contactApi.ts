import type { ResumeContact } from './contact'

type ContactResponse =
  | { ok: true; result: ResumeContact }
  | { ok: false; error: { code: string; message: string } }

export async function fetchContactFile(): Promise<ResumeContact | null> {
  const res = await fetch('/api/bio/contact', { cache: 'no-store' })
  if (res.status === 404) return null
  const data = (await res.json()) as ContactResponse
  if (!res.ok || data.ok === false) return null
  return data.result
}

