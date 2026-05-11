import type { TailorModelResult } from './tailorTypes'

const STORAGE_KEY = 'auto-resume.tailorPatch.v1'

export function saveTailorPatch(patch: TailorModelResult): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patch))
}

export function loadTailorPatch(): TailorModelResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as TailorModelResult
  } catch {
    return null
  }
}

export function clearTailorPatch(): void {
  localStorage.removeItem(STORAGE_KEY)
}

