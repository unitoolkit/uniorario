import {
  addDays,
  format,
  isSameDay,
  parse,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'
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
  const dow = toAppDayOfWeek(date)
  return lessons
    .filter((l) => l.day_of_week === dow)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
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
