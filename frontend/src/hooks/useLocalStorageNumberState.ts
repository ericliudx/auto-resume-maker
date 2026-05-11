import { useEffect, useState } from 'react'

export function useLocalStorageNumberState(
  key: string,
  initialValue: number,
  opts?: { min?: number; max?: number },
): [number, (next: number) => void] {
  const min = opts?.min ?? Number.NEGATIVE_INFINITY
  const max = opts?.max ?? Number.POSITIVE_INFINITY

  const [value, setValue] = useState<number>(() => {
    const raw = localStorage.getItem(key)
    const n = raw == null ? initialValue : Number(raw)
    if (!Number.isFinite(n)) return initialValue
    return Math.max(min, Math.min(max, n))
  })

  useEffect(() => {
    localStorage.setItem(key, String(value))
  }, [key, value])

  return [value, setValue]
}

