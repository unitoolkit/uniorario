import type { Course, LessonWithCourse } from './types'
import type { ScheduleLesson } from './cineca'

const SYNTH_COURSE = (title: string, color = '#2f7bff'): Course => ({
  id: `cineca-${title}`,
  owner_id: 'cineca',
  name: title,
  year: null,
  academic_year: null,
  color,
  created_at: new Date().toISOString(),
})

const COLORS = [
  '#2f7bff',
  '#12a06a',
  '#6b4fd8',
  '#e85d04',
  '#d62828',
  '#0077b6',
  '#2a9d8f',
  '#8338ec',
]

export function cinecaToLessonWithCourse(
  lessons: ScheduleLesson[],
): LessonWithCourse[] {
  const colorByTitle = new Map<string, string>()
  let i = 0
  for (const l of lessons) {
    if (!colorByTitle.has(l.title)) {
      colorByTitle.set(l.title, COLORS[i % COLORS.length])
      i++
    }
  }

  return lessons.map((l) => ({
    id: l.id,
    course_id: `cineca-${l.title}`,
    owner_id: 'cineca',
    day_of_week: l.dayOfWeek,
    start_time: `${l.startTime}:00`,
    end_time: `${l.endTime}:00`,
    room: l.room || null,
    professor: l.professor || null,
    lesson_type: 'Lezione',
    created_at: l.start.toISOString(),
    course: SYNTH_COURSE(l.title, colorByTitle.get(l.title)!),
    // dated occurrence for month filtering
    occurrenceDate: l.start,
  }))
}

export type DatedLesson = LessonWithCourse & { occurrenceDate?: Date }
