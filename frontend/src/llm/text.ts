export function stripOptionalMarkdownCodeFence(raw: string): string {
  const s = raw.trim()
  if (s.startsWith('```')) {
    const noFence = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')
    return noFence.trim()
  }
  return s
}

