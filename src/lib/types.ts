export type Course = {
  id: string
  owner_id: string
  name: string
  year: number | null
  academic_year: string | null
  color: string
  created_at: string
}

export type Lesson = {
  id: string
  course_id: string
  owner_id: string
  day_of_week: number
  start_time: string
  end_time: string
  room: string | null
  professor: string | null
  lesson_type: string
  created_at: string
}

export type LessonWithCourse = Lesson & {
  course: Course
}

export type CourseInsert = Omit<Course, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type LessonInsert = Omit<Lesson, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export const DAY_NAMES = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
] as const

export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] as const

export const COLOR_PALETTE = [
  '#2f7bff',
  '#12a06a',
  '#6b4fd8',
  '#e85d04',
  '#d62828',
  '#0077b6',
  '#9b2226',
  '#2a9d8f',
  '#e9c46a',
  '#8338ec',
]
