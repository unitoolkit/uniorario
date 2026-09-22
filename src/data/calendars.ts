/**
 * Catalogo calendari Cineca Uninsubria (A.A. corrente).
 * Generato da scripts/build-calendar-catalog.mjs
 */
import catalog from './calendar-catalog.json'
import { degreeDisplayName, findDegree } from './insubria-degrees'

export type PublicCalendar = {
  linkId: string
  label: string
  year: number
  campus?: string
  sourcePath: string
  url: string
}

export type DegreeCalendars = {
  title: string
  /** Codice ufficiale CdL, es. F04R */
  code?: string
  degreeIds: string[]
  academicYear: string
  sourcePath: string
  calendars: PublicCalendar[]
}

export const DEGREE_CALENDARS = catalog as DegreeCalendars[]

export function calendarsForDegree(degreeId: string): DegreeCalendars | null {
  return DEGREE_CALENDARS.find((d) => d.degreeIds.includes(degreeId)) ?? null
}

export function allCalendarPacks(): DegreeCalendars[] {
  return [...DEGREE_CALENDARS].sort((a, b) =>
    a.title.localeCompare(b.title, 'it'),
  )
}

export function findCalendar(linkId: string): {
  calendar: PublicCalendar
  pack: DegreeCalendars
} | null {
  for (const pack of DEGREE_CALENDARS) {
    const calendar = pack.calendars.find((c) => c.linkId === linkId)
    if (calendar) return { calendar, pack }
  }
  return null
}

export function resolveCalendars(linkIds: string[]): PublicCalendar[] {
  const out: PublicCalendar[] = []
  const seen = new Set<string>()
  for (const id of linkIds) {
    if (seen.has(id)) continue
    const hit = findCalendar(id)
    if (hit) {
      out.push(hit.calendar)
      seen.add(id)
    }
  }
  return out
}

export function packLabel(pack: DegreeCalendars): string {
  const primary = pack.degreeIds[0] ? findDegree(pack.degreeIds[0]) : undefined
  if (primary) return degreeDisplayName(primary)
  return pack.code ? `[${pack.code}] ${pack.title}` : pack.title
}

export function calendarSubtitle(linkId: string): string {
  const hit = findCalendar(linkId)
  if (!hit) return linkId
  return `${packLabel(hit.pack)} · ${hit.calendar.label}`
}
