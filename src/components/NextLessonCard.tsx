import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { Clock, MapPin, User } from 'lucide-react'
import { formatTimeRange, getNextOrCurrentLesson } from '../lib/schedule'
import type { LessonWithCourse } from '../lib/types'

type NextLessonCardProps = {
  lessons: LessonWithCourse[]
}

export function NextLessonCard({ lessons }: NextLessonCardProps) {
  const next = getNextOrCurrentLesson(lessons)

  if (!next) {
    return (
      <section className="animate-rise rounded-3xl border border-[rgba(26,42,92,0.1)] bg-white/80 p-5 shadow-[0_8px_24px_rgba(26,42,92,0.06)]">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Prossima lezione
        </p>
        <h2 className="mt-2 font-display text-xl font-extrabold tracking-tight text-navy">
          Niente in programma
        </h2>
        <p className="mt-1 text-sm text-muted">
          Aggiungi materie e slot orari dalla sezione Materie.
        </p>
      </section>
    )
  }

  const { lesson, status, date } = next

  return (
    <section
      className="animate-rise rounded-3xl p-5 text-white shadow-[0_12px_32px_rgba(47,123,255,0.28)]"
      style={{
        background: `linear-gradient(135deg, ${lesson.course.color}, #1a2a5c)`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/75">
          {status === 'now' ? 'In corso' : 'Prossima lezione'}
        </p>
        <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
          {format(date, 'EEE d MMM', { locale: it })}
        </span>
      </div>

      <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight leading-tight">
        {lesson.course.name}
      </h2>
      <p className="mt-1 text-sm text-white/80">{lesson.lesson_type}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/90">
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-4 opacity-80" />
          {formatTimeRange(lesson.start_time, lesson.end_time)}
        </span>
        {lesson.room && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 opacity-80" />
            {lesson.room}
          </span>
        )}
        {lesson.professor && (
          <span className="inline-flex items-center gap-1.5">
            <User className="size-4 opacity-80" />
            {lesson.professor}
          </span>
        )}
      </div>
    </section>
  )
}
