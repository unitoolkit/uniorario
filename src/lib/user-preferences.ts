import { supabase } from './supabase'

export type UserPreferencesRow = {
  user_id: string
  degree_id: string | null
  calendar_ids: string[]
  selected_subjects: string[]
  setup_complete: boolean
  updated_at?: string
}

export type UserPreferencesPayload = {
  degreeId: string | null
  calendarIds: string[]
  selectedSubjects: string[]
  setupComplete: boolean
}

export async function fetchUserPreferences(
  userId: string,
): Promise<UserPreferencesPayload | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select(
      'user_id, degree_id, calendar_ids, selected_subjects, setup_complete',
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    degreeId: data.degree_id,
    calendarIds: data.calendar_ids ?? [],
    selectedSubjects: data.selected_subjects ?? [],
    setupComplete: Boolean(data.setup_complete),
  }
}

export async function upsertUserPreferences(
  userId: string,
  prefs: UserPreferencesPayload,
): Promise<void> {
  const row: UserPreferencesRow = {
    user_id: userId,
    degree_id: prefs.degreeId,
    calendar_ids: prefs.calendarIds,
    selected_subjects: prefs.selectedSubjects,
    setup_complete: prefs.setupComplete,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('user_preferences').upsert(row, {
    onConflict: 'user_id',
  })
  if (error) throw error
}
