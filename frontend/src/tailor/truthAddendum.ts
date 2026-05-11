export async function loadTruthAddendum(): Promise<string> {
  try {
    const res = await fetch('/src/tailor/truthAddendum.local.md', { cache: 'no-store' })
    if (!res.ok) return ''
    return await res.text()
  } catch {
    return ''
  }
}

