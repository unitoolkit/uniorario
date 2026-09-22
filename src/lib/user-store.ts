/**
 * Stato utente: cache in localStorage + sync su Supabase (user_preferences).
 * userId = UUID generato al primo accesso nel browser.
 */
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { getOwnerId } from './owner'
import {
  fetchUserPreferences,
  upsertUserPreferences,
  type UserPreferencesPayload,
} from './user-preferences'

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
  /** true dopo il primo tentativo di sync remoto in questa sessione */
  remoteSynced: boolean

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
  /** Carica da Supabase (e eventualmente migra la cache locale sul DB). */
  syncFromRemote: () => Promise<void>
}

function snapshot(s: UserState): UserPreferencesPayload {
  return {
    degreeId: s.degreeId,
    calendarIds: s.calendarIds,
    selectedSubjects: s.selectedSubjects,
    setupComplete: s.setupComplete,
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRemoteSave(get: () => UserState) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    const s = get()
    if (!s.userId) return
    void upsertUserPreferences(s.userId, snapshot(s)).catch((err) => {
      console.warn('[uniorario] save preferences failed', err)
    })
  }, 400)
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      userId: '',
      degreeId: null,
      calendarIds: [],
      selectedSubjects: [],
      setupComplete: false,
      remoteSynced: false,

      ensureUserId: () => {
        const current = get().userId
        if (current) return current
        const id = getOwnerId()
        set({ userId: id })
        return id
      },

      setDegreeId: (id) => {
        set({ degreeId: id })
        scheduleRemoteSave(get)
      },

      setCalendarIds: (ids) => {
        set({ calendarIds: [...new Set(ids)] })
        scheduleRemoteSave(get)
      },

      toggleCalendarId: (id) => {
        const cur = get().calendarIds
        set({
          calendarIds: cur.includes(id)
            ? cur.filter((x) => x !== id)
            : [...cur, id],
        })
        scheduleRemoteSave(get)
      },

      setSelectedSubjects: (subjects) => {
        set({
          selectedSubjects: [...new Set(subjects)].sort((a, b) =>
            a.localeCompare(b, 'it'),
          ),
        })
        scheduleRemoteSave(get)
      },

      toggleSubject: (subject) => {
        const cur = get().selectedSubjects
        set({
          selectedSubjects: cur.includes(subject)
            ? cur.filter((x) => x !== subject)
            : [...cur, subject].sort((a, b) => a.localeCompare(b, 'it')),
        })
        scheduleRemoteSave(get)
      },

      completeSetup: ({ degreeId, calendarIds, selectedSubjects }) => {
        get().ensureUserId()
        set({
          degreeId,
          calendarIds: [...new Set(calendarIds)],
          selectedSubjects: [...new Set(selectedSubjects)],
          setupComplete: true,
        })
        scheduleRemoteSave(get)
      },

      resetSetup: () => {
        set({
          degreeId: null,
          calendarIds: [],
          selectedSubjects: [],
          setupComplete: false,
        })
        scheduleRemoteSave(get)
      },

      syncFromRemote: async () => {
        const userId = get().ensureUserId()
        try {
          const remote = await fetchUserPreferences(userId)
          if (remote) {
            set({
              degreeId: remote.degreeId,
              calendarIds: remote.calendarIds,
              selectedSubjects: remote.selectedSubjects,
              setupComplete: remote.setupComplete,
              remoteSynced: true,
            })
            return
          }

          // Nessuna riga remota: se abbiamo già setup locale, caricalo sul DB
          const local = get()
          if (local.setupComplete || local.degreeId || local.calendarIds.length) {
            await upsertUserPreferences(userId, snapshot(local))
          }
          set({ remoteSynced: true })
        } catch (err) {
          console.warn('[uniorario] load preferences failed', err)
          set({ remoteSynced: true })
        }
      },
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
