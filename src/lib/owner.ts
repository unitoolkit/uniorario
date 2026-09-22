const STORAGE_KEY = 'uniorario-owner-id'

export function getOwnerId(): string {
  const existing = localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `owner-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  localStorage.setItem(STORAGE_KEY, id)
  return id
}
