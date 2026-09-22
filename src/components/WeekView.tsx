import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import { AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import {
  dayHasConflicts,
  findConflictsForDay,
  formatTimeRange,
  lessonsForDate,
  toAppDayOfWeek,
  weekDays,
} from '../lib/schedule'
import { DAY_SHORT, type LessonWithCourse } from '../lib/types'

type WeekViewProps = {
  lessons: LessonWithCourse[]
  weekOffset: number
  selectedDate: Date
  onSelectDate: (date: Date) => void
  onPrevWeek: () => void
  onNextWeek: () => void
  onResetWeek: () => void
}

export function WeekView({
  lessons,
  weekOffset,
  selectedDate,
  onSelectDate,
  onPrevWeek,
  onNextWeek,
  onResetWeek,
}: WeekViewProps) {
  const days = weekDays(new Date(), weekOffset)
  const today = new Date()
  const selectedLessons = lessonsForDate(lessons, selectedDate)
  const conflicts = useMemo(
    () => findConflictsForDay(selectedLessons),
    [selectedLessons],
  )
  const conflictCount = conflicts.size

  return (
    <div className="animate-rise space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrevWeek}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[rgba(26,42,92,0.15)] bg-white text-navy hover:border-royal hover:text-royal transition"
          aria-label="Settimana precedente"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          type="button"
          onClick={onResetWeek}
          className="font-display text-lg font-extrabold tracking-tight text-navy"
        >
          {weekOffset === 0
            ? 'Questa settimana'
            : format(days[0], 'd MMM', { locale: it }) +
              ' – ' +
              format(days[6], 'd MMM', { locale: it })}
        </button>

        <button
          type="button"
          onClick={onNextWeek}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[rgba(26,42,92,0.15)] bg-white text-navy hover:border-royal hover:text-royal transition"
          aria-label="Settimana successiva"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map((day) => {
          const dow = toAppDayOfWeek(day)
          const dayLessons = lessonsForDate(lessons, day)
          const count = dayLessons.length
          const hasConflict = dayHasConflicts(dayLessons)
          const isSelected = isSameDay(day, selectedDate)
          const isToday = isSameDay(day, today)

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(day)}
              className={`relative flex flex-col items-center rounded-2xl px-1 py-2.5 transition ${
                isSelected
                  ? 'bg-royal text-white shadow-[0_8px_20px_rgba(47,123,255,0.35)]'
                  : 'bg-white/80 border border-[rgba(26,42,92,0.08)] text-navy hover:border-royal/40'
              }`}
            >
              {hasConflict && (
                <span
                  className={`absolute right-1 top-1 size-1.5 rounded-full ${
                    isSelected ? 'bg-amber-300' : 'bg-amber-500'
                  }`}
                  title="Conflitto orario"
                />
              )}
              <span
                className={`text-[10px] font-semibold uppercase tracking-wide ${
                  isSelected ? 'text-white/80' : 'text-muted'
                }`}
              >
                {DAY_SHORT[dow]}
              </span>
              <span className="mt-0.5 font-display text-lg font-extrabold leading-none">
                {format(day, 'd')}
              </span>
              <span
                className={`mt-1 size-1.5 rounded-full ${
                  count > 0
                    ? isSelected
                      ? 'bg-white'
                      : isToday
                        ? 'bg-royal'
                        : 'bg-tasks'
                    : 'bg-transparent'
                }`}
              />
            </button>
          )
        })}
      </div>

      <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 sm:p-5">
        <h3 className="font-display text-lg font-extrabold tracking-tight text-navy capitalize">
          {format(selectedDate, 'EEEE d MMMM', { locale: it })}
        </h3>

        {conflictCount > 0 && (
          <div
            className="mt-3 flex gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 text-sm text-navy"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold">
                {conflictCount === 1
                  ? '1 lezione in conflitto di orario'
                  : `${conflictCount} lezioni in conflitto di orario`}
              </p>
              <p className="mt-0.5 text-muted">
                Due o più insegnamenti si sovrappongono nello stesso intervallo.
              </p>
            </div>
          </div>
        )}

        {selectedLessons.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nessuna lezione in questo giorno.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {selectedLessons.map((lesson) => {
              const conflict = conflicts.get(lesson.id)
              const isConflict = Boolean(conflict)

              return (
                <li
                  key={lesson.id}
                  className="flex gap-3 rounded-2xl border border-[rgba(26,42,92,0.06)] bg-paper/70 p-3.5"
                >
                  <span
                    className="mt-1 size-2.5 shrink-0 rounded-full"
                    style={{ background: lesson.course.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-semibold text-navy truncate">
                        {lesson.course.name}
                      </p>
                      <p className="text-xs font-medium text-muted tabular-nums">
                        {formatTimeRange(lesson.start_time, lesson.end_time)}
                      </p>
                    </div>
                    <p className="mt-0.5 text-sm text-muted">
                      {[lesson.lesson_type, lesson.room, lesson.professor]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    {isConflict && conflict && (
                      <p className="mt-2 inline-flex items-start gap-1.5 text-xs font-medium text-amber-700">
                        <AlertTriangle className="mt-px size-3.5 shrink-0 text-amber-600" />
                        <span>
                          Conflitto con{' '}
                          {conflict.withNames.length === 1
                            ? conflict.withNames[0]
                            : conflict.withNames.join(', ')}
                        </span>
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
