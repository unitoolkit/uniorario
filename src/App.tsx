import { RefreshCw } from 'lucide-react'
import { useMemo, useState } from 'react'
import { BottomNav, type AppView } from './components/BottomNav'
import { CoursesPanel } from './components/CoursesPanel'
import { Header } from './components/Header'
import { MonthView } from './components/MonthView'
import { NextLessonCard } from './components/NextLessonCard'
import { Setup } from './components/Setup'
import { WeekView } from './components/WeekView'
import {
  DEGREE_LEVEL_LABELS,
  UNIVERSITY,
  degreeDisplayName,
  findDegree,
} from './data/insubria-degrees'
import { usePublicOrario } from './hooks/usePublicOrario'
import { useSchedule } from './hooks/useSchedule'
import { cinecaToLessonWithCourse } from './lib/adapters'
import {
  getSelectedDegreeId,
  hasCompletedSetup,
} from './lib/preferences'
import { mondayOfWeek } from './lib/schedule'

function weekOffsetForDate(date: Date): number {
  const thisMonday = mondayOfWeek(new Date(), 0).getTime()
  const targetMonday = mondayOfWeek(date, 0).getTime()
  return Math.round((targetMonday - thisMonday) / (7 * 24 * 60 * 60 * 1000))
}

export default function App() {
  const api = useSchedule()
  const [ready, setReady] = useState(() => hasCompletedSetup())
  const [degreeId, setDegreeId] = useState(() => getSelectedDegreeId())
  const [editingSetup, setEditingSetup] = useState(false)
  const [view, setView] = useState<AppView>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const degree = degreeId ? findDegree(degreeId) : undefined
  const publicOrario = usePublicOrario(degreeId, weekOffset)

  const displayLessons = useMemo(() => {
    if (publicOrario.available) {
      return cinecaToLessonWithCourse(publicOrario.lessons)
    }
    return api.lessons
  }, [publicOrario.available, publicOrario.lessons, api.lessons])

  const loading = publicOrario.available ? publicOrario.loading : api.loading
  const error = publicOrario.available ? publicOrario.error : api.error

  if (!ready || editingSetup) {
    return (
      <Setup
        initialDegreeId={degreeId}
        onDone={(id) => {
          setDegreeId(id)
          setReady(true)
          setEditingSetup(false)
        }}
      />
    )
  }

  const titles: Record<AppView, string> = {
    week: 'Vista settimanale',
    month: 'Vista mensile',
    courses: publicOrario.available ? 'Calendario' : 'Gestione materie',
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <Header title={titles[view]} />

      <main className="px-[clamp(1.25rem,4vw,2rem)] pt-4 space-y-4">
        {degree && (
          <button
            type="button"
            onClick={() => setEditingSetup(true)}
            className="animate-rise w-full rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/80 px-4 py-3 text-left transition hover:border-royal/35"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {UNIVERSITY.shortName} · {DEGREE_LEVEL_LABELS[degree.level]}
              {publicOrario.academicYear
                ? ` · A.A. ${publicOrario.academicYear}`
                : ''}
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold tracking-tight text-navy">
              {degreeDisplayName(degree)}
            </p>
          </button>
        )}

        {publicOrario.available && publicOrario.calendars.length > 0 && (
          <label className="animate-rise block space-y-1.5 rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/85 px-4 py-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Calendario lezioni
            </span>
            <select
              value={publicOrario.selected?.linkId ?? ''}
              onChange={(e) => publicOrario.setCalendarId(e.target.value)}
              className="w-full rounded-xl border border-[rgba(26,42,92,0.12)] bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-royal"
            >
              {publicOrario.calendars.map((c) => (
                <option key={c.linkId} value={c.linkId}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {loading && (
          <div className="animate-fade flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm text-muted">
            <RefreshCw className="size-4 animate-spin" />
            Caricamento orario…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">
              {publicOrario.available ? 'Errore orario Cineca' : 'Errore database'}
            </p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() =>
                void (publicOrario.available
                  ? publicOrario.refresh()
                  : api.refresh())
              }
              className="mt-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Riprova
            </button>
          </div>
        )}

        {!loading && !error && view !== 'courses' && (
          <NextLessonCard lessons={displayLessons} />
        )}

        {view === 'week' && (
          <WeekView
            lessons={displayLessons}
            weekOffset={weekOffset}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onPrevWeek={() => setWeekOffset((v) => v - 1)}
            onNextWeek={() => setWeekOffset((v) => v + 1)}
            onResetWeek={() => {
              setWeekOffset(0)
              setSelectedDate(new Date())
            }}
          />
        )}

        {view === 'month' && (
          <MonthView
            lessons={displayLessons}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d)
              setWeekOffset(weekOffsetForDate(d))
              setView('week')
            }}
          />
        )}

        {view === 'courses' &&
          (publicOrario.available ? (
            <div className="animate-rise rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-5 space-y-3">
              <h2 className="font-display text-lg font-extrabold text-navy">
                Calendari ufficiali
              </h2>
              <p className="text-sm text-muted">
                Orario live da Cineca per A.A. {publicOrario.academicYear}. Scegli
                l&apos;anno dal selettore sopra.
              </p>
              <ul className="space-y-2">
                {publicOrario.calendars.map((c) => (
                  <li key={c.linkId}>
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-2xl border border-[rgba(26,42,92,0.08)] bg-paper/70 px-4 py-3 text-sm font-medium text-navy hover:border-royal/40"
                    >
                      {c.label}
                      {c.campus ? ` · ${c.campus}` : ''}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <CoursesPanel api={api} />
          ))}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  )
}
