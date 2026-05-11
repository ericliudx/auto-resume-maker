import { useEffect, useState } from 'react'

export function useLocalStorageState(key: string, initialValue: string): [string, (next: string) => void] {
  const [value, setValue] = useState<string>(() => localStorage.getItem(key) ?? initialValue)

  useEffect(() => {
    localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue]
}

