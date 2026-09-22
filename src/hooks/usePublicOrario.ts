import { useCallback, useEffect, useState } from 'react'
import { calendarsForDegree, type PublicCalendar } from '../data/calendars'
import {
  fetchPublicCalendar,
  weekRange,
  type ScheduleLesson,
} from '../lib/cineca'

const CAL_KEY = 'uniorario-calendar-link-id'

export function getStoredCalendarId(): string | null {
  return localStorage.getItem(CAL_KEY)
}

export function setStoredCalendarId(id: string | null): void {
  if (id) localStorage.setItem(CAL_KEY, id)
  else localStorage.removeItem(CAL_KEY)
}

export function usePublicOrario(degreeId: string | null, weekOffset: number) {
  const pack = degreeId ? calendarsForDegree(degreeId) : null
  const [calendarId, setCalendarIdState] = useState<string | null>(() =>
    getStoredCalendarId(),
  )
  const [lessons, setLessons] = useState<ScheduleLesson[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calendars = pack?.calendars ?? []
  const selected: PublicCalendar | undefined =
    calendars.find((c) => c.linkId === calendarId) ?? calendars[0]

  const setCalendarId = useCallback((id: string) => {
    setCalendarIdState(id)
    setStoredCalendarId(id)
  }, [])

  useEffect(() => {
    if (!pack) return
    const stored = getStoredCalendarId()
    const valid = pack.calendars.some((c) => c.linkId === stored)
    if (!valid) {
      const first = pack.calendars[0]?.linkId ?? null
      setCalendarIdState(first)
      setStoredCalendarId(first)
    }
  }, [pack])

  const linkId = selected?.linkId

  const refresh = useCallback(async () => {
    if (!linkId) {
      setLessons([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const range = weekRange(weekOffset)
      const data = await fetchPublicCalendar(linkId, range)
      setLessons(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Errore caricamento orario')
      setLessons([])
    } finally {
      setLoading(false)
    }
  }, [linkId, weekOffset])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return {
    available: Boolean(pack),
    academicYear: pack?.academicYear ?? null,
    calendars,
    selected,
    setCalendarId,
    lessons,
    loading,
    error,
    refresh,
  }
}
