import {
  addDays,
  format,
  isSameDay,
  parse,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'
import type { DatedLesson } from './adapters'
import type { LessonWithCourse } from './types'

export function mondayOfWeek(date: Date, weekOffset = 0): Date {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return addDays(monday, weekOffset * 7)
}

export function weekDays(date: Date, weekOffset = 0): Date[] {
  const start = mondayOfWeek(date, weekOffset)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** JS getDay(): 0=dom → nostro 0=lun */
export function toAppDayOfWeek(date: Date): number {
  return (date.getDay() + 6) % 7
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.slice(0, 5).split(':').map(Number)
  return h * 60 + m
}

export function formatTimeRange(start: string, end: string): string {
  return `${start.slice(0, 5)} – ${end.slice(0, 5)}`
}

export function formatDayLabel(date: Date): string {
  return format(date, 'EEEE d MMMM', { locale: it })
}

export function lessonsForDate(
  lessons: LessonWithCourse[],
  date: Date,
): LessonWithCourse[] {
  const dated = lessons as DatedLesson[]
  const hasOccurrences = dated.some((l) => l.occurrenceDate instanceof Date)

  const filtered = hasOccurrences
    ? dated.filter(
        (l) => l.occurrenceDate && isSameDay(l.occurrenceDate, date),
      )
    : lessons.filter((l) => l.day_of_week === toAppDayOfWeek(date))

  return filtered.sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time),
  )
}

export function getNextOrCurrentLesson(
  lessons: LessonWithCourse[],
  now = new Date(),
): { lesson: LessonWithCourse; status: 'now' | 'next'; date: Date } | null {
  for (let offset = 0; offset < 8; offset++) {
    const day = addDays(now, offset)
    const dayLessons = lessonsForDate(lessons, day)
    const nowMinutes = isSameDay(day, now)
      ? now.getHours() * 60 + now.getMinutes()
      : -1

    for (const lesson of dayLessons) {
      const start = timeToMinutes(lesson.start_time)
      const end = timeToMinutes(lesson.end_time)

      if (offset === 0) {
        if (nowMinutes >= start && nowMinutes < end) {
          return { lesson, status: 'now', date: day }
        }
        if (start > nowMinutes) {
          return { lesson, status: 'next', date: day }
        }
      } else {
        return { lesson, status: 'next', date: day }
      }
    }
  }
  return null
}

export function parseTimeInput(value: string): string {
  const parsed = parse(value, 'HH:mm', new Date())
  return format(parsed, 'HH:mm:ss')
}

/** Due slot si sovrappongono se condividono almeno un istante (fine esclusiva). */
export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a0 = timeToMinutes(startA)
  const a1 = timeToMinutes(endA)
  const b0 = timeToMinutes(startB)
  const b1 = timeToMinutes(endB)
  return a0 < b1 && b0 < a1
}

export type LessonConflict = {
  lessonId: string
  withIds: string[]
  withNames: string[]
}

/** Conflitti orario tra lezioni dello stesso giorno. */
export function findConflictsForDay(
  dayLessons: LessonWithCourse[],
): Map<string, LessonConflict> {
  const map = new Map<string, LessonConflict>()

  for (let i = 0; i < dayLessons.length; i++) {
    for (let j = i + 1; j < dayLessons.length; j++) {
      const a = dayLessons[i]
      const b = dayLessons[j]
      if (
        !timesOverlap(a.start_time, a.end_time, b.start_time, b.end_time)
      ) {
        continue
      }

      const touch = (lesson: LessonWithCourse, other: LessonWithCourse) => {
        const prev = map.get(lesson.id) ?? {
          lessonId: lesson.id,
          withIds: [],
          withNames: [],
        }
        if (!prev.withIds.includes(other.id)) {
          prev.withIds.push(other.id)
          prev.withNames.push(other.course.name)
        }
        map.set(lesson.id, prev)
      }

      touch(a, b)
      touch(b, a)
    }
  }

  return map
}

export function dayHasConflicts(dayLessons: LessonWithCourse[]): boolean {
  return findConflictsForDay(dayLessons).size > 0
}

export function countConflictDays(
  lessons: LessonWithCourse[],
  days: Date[],
): number {
  return days.filter((d) => dayHasConflicts(lessonsForDate(lessons, d))).length
}
