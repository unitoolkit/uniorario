const DEGREE_KEY = 'uniorario-degree-id'
const WELCOME_KEY = 'uniorario-has-setup'

export function getSelectedDegreeId(): string | null {
  return localStorage.getItem(DEGREE_KEY)
}

export function setSelectedDegreeId(id: string): void {
  localStorage.setItem(DEGREE_KEY, id)
  localStorage.setItem(WELCOME_KEY, '1')
}

export function hasCompletedSetup(): boolean {
  return localStorage.getItem(WELCOME_KEY) === '1' && Boolean(getSelectedDegreeId())
}

export function clearSetup(): void {
  localStorage.removeItem(DEGREE_KEY)
  localStorage.removeItem(WELCOME_KEY)
}
