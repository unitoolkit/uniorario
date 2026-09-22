/**
 * Stato utente persistito in localStorage (come UniApplication).
 * userId = UUID generato al primo accesso nel browser.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getOwnerId } from './owner'

export type UserState = {
  userId: string
  degreeId: string | null
  /** linkCalendarioId Cineca selezionati (anni / sedi) */
  calendarIds: string[]
  /**
   * Materie (insegnamenti) visibili nell'orario personale.
   * Se vuoto e setupComplete → mostra tutto (fallback).
   */
  selectedSubjects: string[]
  setupComplete: boolean

  ensureUserId: () => string
  setDegreeId: (id: string | null) => void
  setCalendarIds: (ids: string[]) => void
  toggleCalendarId: (id: string) => void
  setSelectedSubjects: (subjects: string[]) => void
  toggleSubject: (subject: string) => void
  completeSetup: (input: {
    degreeId: string
    calendarIds: string[]
    selectedSubjects: string[]
  }) => void
  resetSetup: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: '',
      degreeId: null,
      calendarIds: [],
      selectedSubjects: [],
      setupComplete: false,

      ensureUserId: () => {
        const current = get().userId
        if (current) return current
        // riusa owner_id già presente se c'è, altrimenti nuovo UUID
        const id = getOwnerId()
        set({ userId: id })
        return id
      },

      setDegreeId: (id) => set({ degreeId: id }),

      setCalendarIds: (ids) => set({ calendarIds: [...new Set(ids)] }),

      toggleCalendarId: (id) => {
        const cur = get().calendarIds
        set({
          calendarIds: cur.includes(id)
            ? cur.filter((x) => x !== id)
            : [...cur, id],
        })
      },

      setSelectedSubjects: (subjects) =>
        set({ selectedSubjects: [...new Set(subjects)].sort((a, b) => a.localeCompare(b, 'it')) }),

      toggleSubject: (subject) => {
        const cur = get().selectedSubjects
        set({
          selectedSubjects: cur.includes(subject)
            ? cur.filter((x) => x !== subject)
            : [...cur, subject].sort((a, b) => a.localeCompare(b, 'it')),
        })
      },

      completeSetup: ({ degreeId, calendarIds, selectedSubjects }) => {
        get().ensureUserId()
        set({
          degreeId,
          calendarIds: [...new Set(calendarIds)],
          selectedSubjects: [...new Set(selectedSubjects)],
          setupComplete: true,
        })
      },

      resetSetup: () =>
        set({
          degreeId: null,
          calendarIds: [],
          selectedSubjects: [],
          setupComplete: false,
        }),
    }),
    {
      name: 'uniorario-user',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        userId: s.userId,
        degreeId: s.degreeId,
        calendarIds: s.calendarIds,
        selectedSubjects: s.selectedSubjects,
        setupComplete: s.setupComplete,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!state.userId) {
          try {
            state.userId = getOwnerId()
          } catch {
            /* SSR / no window */
          }
        }
        // migrazione da preferenze legacy
        try {
          const legacyDegree = localStorage.getItem('uniorario-degree-id')
          const legacySetup = localStorage.getItem('uniorario-has-setup')
          const legacyCal = localStorage.getItem('uniorario-calendar-link-id')
          if (!state.degreeId && legacyDegree) state.degreeId = legacyDegree
          if (!state.setupComplete && legacySetup === '1' && state.degreeId) {
            state.setupComplete = true
          }
          if (state.calendarIds.length === 0 && legacyCal) {
            state.calendarIds = [legacyCal]
          }
        } catch {
          /* ignore */
        }
      },
    },
  ),
)
