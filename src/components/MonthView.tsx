import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { it } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { lessonsForDate } from '../lib/schedule'
import { DAY_SHORT, type LessonWithCourse } from '../lib/types'

type MonthViewProps = {
  lessons: LessonWithCourse[]
  selectedDate: Date
  onSelectDate: (date: Date) => void
}

export function MonthView({ lessons, selectedDate, onSelectDate }: MonthViewProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(selectedDate))

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [cursor])

  const selectedLessons = lessonsForDate(lessons, selectedDate)

  return (
    <div className="animate-rise space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, -1))}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[rgba(26,42,92,0.15)] bg-white text-navy"
          aria-label="Mese precedente"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h2 className="font-display text-lg font-extrabold tracking-tight text-navy capitalize">
          {format(cursor, 'MMMM yyyy', { locale: it })}
        </h2>
        <button
          type="button"
          onClick={() => setCursor((d) => addMonths(d, 1))}
          className="inline-flex size-10 items-center justify-center rounded-full border border-[rgba(26,42,92,0.15)] bg-white text-navy"
          aria-label="Mese successivo"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-3 sm:p-4">
        <div className="mb-2 grid grid-cols-7 gap-1">
          {DAY_SHORT.map((d) => (
            <div
              key={d}
              className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor)
            const selected = isSameDay(day, selectedDate)
            const today = isSameDay(day, new Date())
            const dayLessons = lessonsForDate(lessons, day)
            const colors = [...new Set(dayLessons.map((l) => l.course.color))].slice(0, 3)

            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDate(day)}
                className={`flex min-h-[3.25rem] flex-col items-center rounded-xl px-1 py-1.5 transition ${
                  selected
                    ? 'bg-royal text-white'
                    : inMonth
                      ? 'hover:bg-paper-2 text-navy'
                      : 'text-muted/45'
                }`}
              >
                <span
                  className={`text-sm font-semibold leading-none ${
                    today && !selected ? 'text-royal' : ''
                  }`}
                >
                  {format(day, 'd')}
                </span>
                <span className="mt-1.5 flex gap-0.5">
                  {colors.map((c) => (
                    <span
                      key={c}
                      className="size-1.5 rounded-full"
                      style={{
                        background: selected ? 'rgba(255,255,255,0.9)' : c,
                      }}
                    />
                  ))}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4">
        <h3 className="font-display text-base font-extrabold text-navy capitalize">
          {format(selectedDate, 'EEEE d MMMM', { locale: it })}
        </h3>
        {selectedLessons.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nessuna lezione.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {selectedLessons.map((l) => (
              <li key={l.id} className="flex items-center gap-2 text-sm">
                <span
                  className="size-2 rounded-full"
                  style={{ background: l.course.color }}
                />
                <span className="font-medium text-navy">{l.course.name}</span>
                <span className="text-muted tabular-nums">
                  {l.start_time.slice(0, 5)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
