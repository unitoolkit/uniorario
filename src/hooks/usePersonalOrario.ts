import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  calendarsForDegree,
  resolveCalendars,
  type PublicCalendar,
} from '../data/calendars'
import {
  fetchPublicCalendar,
  weekRange,
  type ScheduleLesson,
} from '../lib/cineca'
import { useUserStore } from '../lib/user-store'

export function usePersonalOrario(weekOffset: number) {
  const degreeId = useUserStore((s) => s.degreeId)
  const calendarIds = useUserStore((s) => s.calendarIds)
  const selectedSubjects = useUserStore((s) => s.selectedSubjects)

  const homePack = degreeId ? calendarsForDegree(degreeId) : null

  const activeCalendars: PublicCalendar[] = useMemo(() => {
    const fromIds = resolveCalendars(calendarIds)
    if (fromIds.length > 0) return fromIds
    // fallback: primo calendario del CdL principale
    return homePack?.calendars.slice(0, 1) ?? []
  }, [calendarIds, homePack])

  const [lessons, setLessons] = useState<ScheduleLesson[]>([])
  const [allSubjects, setAllSubjects] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (activeCalendars.length === 0) {
      setLessons([])
      setAllSubjects([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const range = weekRange(weekOffset)
      const batches = await Promise.all(
        activeCalendars.map((c) => fetchPublicCalendar(c.linkId, range)),
      )
      const merged = batches.flat()
      const subjects = [
        ...new Set(merged.map((l) => l.title).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b, 'it'))
      setAllSubjects(subjects)
      setLessons(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento orario')
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [activeCalendars, weekOffset])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filteredLessons = useMemo(() => {
    if (selectedSubjects.length === 0) return lessons
    const allow = new Set(selectedSubjects)
    return lessons.filter((l) => allow.has(l.title))
  }, [lessons, selectedSubjects])

  return {
    hasLiveOrario: activeCalendars.length > 0,
    homePack,
    academicYear: homePack?.academicYear ?? null,
    homeCalendars: homePack?.calendars ?? [],
    activeCalendars,
    lessons: filteredLessons,
    rawLessons: lessons,
    allSubjects,
    loading,
    error,
    refresh,
  }
}

/** Carica materie da uno o più calendari (per setup / impostazioni). */
export async function discoverSubjects(
  linkIds: string[],
  weekOffset = 0,
): Promise<string[]> {
  if (linkIds.length === 0) return []
  const range = weekRange(weekOffset)
  const batches = await Promise.all(
    linkIds.map((id) => fetchPublicCalendar(id, range)),
  )
  return [...new Set(batches.flat().map((l) => l.title).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, 'it'),
  )
}
