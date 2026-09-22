import { useCallback, useEffect, useState } from 'react'
import { getOwnerId } from '../lib/owner'
import { supabase } from '../lib/supabase'
import type { Course, Lesson, LessonWithCourse } from '../lib/types'

type LessonJoinRow = Lesson & {
  course: Course | Course[] | null
}

export function useSchedule() {
  const [courses, setCourses] = useState<Course[]>([])
  const [lessons, setLessons] = useState<LessonWithCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const ownerId = getOwnerId()

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [coursesRes, lessonsRes] = await Promise.all([
      supabase
        .from('courses')
        .select('*')
        .eq('owner_id', ownerId)
        .order('name'),
      supabase
        .from('lessons')
        .select('*, course:courses(*)')
        .eq('owner_id', ownerId)
        .order('day_of_week')
        .order('start_time'),
    ])

    if (coursesRes.error || lessonsRes.error) {
      const msg =
        coursesRes.error?.message ||
        lessonsRes.error?.message ||
        'Errore nel caricamento'
      setError(msg)
      setLoading(false)
      return
    }

    setCourses((coursesRes.data as Course[]) ?? [])

    const joined = ((lessonsRes.data as LessonJoinRow[]) ?? [])
      .map((row) => {
        const courseObj = Array.isArray(row.course) ? row.course[0] : row.course
        if (!courseObj) return null
        const { course: _c, ...lesson } = row
        return { ...lesson, course: courseObj } satisfies LessonWithCourse
      })
      .filter((x): x is LessonWithCourse => x !== null)

    setLessons(joined)
    setLoading(false)
  }, [ownerId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const addCourse = async (input: {
    name: string
    year?: number | null
    academic_year?: string | null
    color: string
  }) => {
    const { error: err } = await supabase.from('courses').insert({
      owner_id: ownerId,
      name: input.name.trim(),
      year: input.year ?? null,
      academic_year: input.academic_year ?? null,
      color: input.color,
    })
    if (err) throw err
    await refresh()
  }

  const updateCourse = async (
    id: string,
    input: Partial<Pick<Course, 'name' | 'year' | 'academic_year' | 'color'>>,
  ) => {
    const { error: err } = await supabase.from('courses').update(input).eq('id', id)
    if (err) throw err
    await refresh()
  }

  const deleteCourse = async (id: string) => {
    const { error: err } = await supabase.from('courses').delete().eq('id', id)
    if (err) throw err
    await refresh()
  }

  const addLesson = async (input: {
    course_id: string
    day_of_week: number
    start_time: string
    end_time: string
    room?: string | null
    professor?: string | null
    lesson_type?: string
  }) => {
    const { error: err } = await supabase.from('lessons').insert({
      owner_id: ownerId,
      course_id: input.course_id,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      room: input.room || null,
      professor: input.professor || null,
      lesson_type: input.lesson_type || 'Lezione',
    })
    if (err) throw err
    await refresh()
  }

  const updateLesson = async (
    id: string,
    input: Partial<
      Pick<
        Lesson,
        | 'course_id'
        | 'day_of_week'
        | 'start_time'
        | 'end_time'
        | 'room'
        | 'professor'
        | 'lesson_type'
      >
    >,
  ) => {
    const { error: err } = await supabase.from('lessons').update(input).eq('id', id)
    if (err) throw err
    await refresh()
  }

  const deleteLesson = async (id: string) => {
    const { error: err } = await supabase.from('lessons').delete().eq('id', id)
    if (err) throw err
    await refresh()
  }

  return {
    courses,
    lessons,
    loading,
    error,
    refresh,
    addCourse,
    updateCourse,
    deleteCourse,
    addLesson,
    updateLesson,
    deleteLesson,
  }
}

export type ScheduleApi = ReturnType<typeof useSchedule>
