import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { BottomNav, type AppView } from './components/BottomNav'
import { Header } from './components/Header'
import { MonthView } from './components/MonthView'
import { MySchedulePanel } from './components/MySchedulePanel'
import { NextLessonCard } from './components/NextLessonCard'
import { Setup } from './components/Setup'
import { WeekView } from './components/WeekView'
import {
  DEGREE_LEVEL_LABELS,
  UNIVERSITY,
  degreeDisplayName,
  findDegree,
} from './data/insubria-degrees'
import { usePersonalOrario } from './hooks/usePersonalOrario'
import { useSchedule } from './hooks/useSchedule'
import { cinecaToLessonWithCourse } from './lib/adapters'
import { mondayOfWeek } from './lib/schedule'
import { useUserStore } from './lib/user-store'

function weekOffsetForDate(date: Date): number {
  const thisMonday = mondayOfWeek(new Date(), 0).getTime()
  const targetMonday = mondayOfWeek(date, 0).getTime()
  return Math.round((targetMonday - thisMonday) / (7 * 24 * 60 * 60 * 1000))
}

export default function App() {
  const ensureUserId = useUserStore((s) => s.ensureUserId)
  const setupComplete = useUserStore((s) => s.setupComplete)
  const degreeId = useUserStore((s) => s.degreeId)
  const [hydrated, setHydrated] = useState(false)
  const [editingSetup, setEditingSetup] = useState(false)
  const [view, setView] = useState<AppView>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  useEffect(() => {
    ensureUserId()
    const unsub = useUserStore.persist.onFinishHydration(() => setHydrated(true))
    setHydrated(useUserStore.persist.hasHydrated())
    return unsub
  }, [ensureUserId])

  const api = useSchedule()
  const personal = usePersonalOrario(weekOffset)
  const degree = degreeId ? findDegree(degreeId) : undefined

  const displayLessons = useMemo(() => {
    if (personal.hasLiveOrario) {
      return cinecaToLessonWithCourse(personal.lessons)
    }
    return api.lessons
  }, [personal.hasLiveOrario, personal.lessons, api.lessons])

  const useLive = personal.hasLiveOrario
  const loading = useLive ? personal.loading : api.loading
  const error = useLive ? personal.error : api.error

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted">
        Caricamento…
      </div>
    )
  }

  if (!setupComplete || editingSetup) {
    return (
      <Setup
        editing={editingSetup}
        onDone={() => setEditingSetup(false)}
      />
    )
  }

  const titles: Record<AppView, string> = {
    week: 'Vista settimanale',
    month: 'Vista mensile',
    courses: 'Il mio orario',
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <Header title={titles[view]} />

      <main className="px-[clamp(1.25rem,4vw,2rem)] pt-4 space-y-4">
        {degree && (
          <button
            type="button"
            onClick={() => setView('courses')}
            className="animate-rise w-full rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/80 px-4 py-3 text-left transition hover:border-royal/35"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {UNIVERSITY.shortName} · {DEGREE_LEVEL_LABELS[degree.level]}
              {personal.academicYear ? ` · A.A. ${personal.academicYear}` : ''}
            </p>
            <p className="mt-0.5 font-display text-base font-extrabold tracking-tight text-navy">
              {degreeDisplayName(degree)}
            </p>
          </button>
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
              {useLive ? 'Errore orario Cineca' : 'Errore database'}
            </p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void (useLive ? personal.refresh() : api.refresh())}
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

        {view === 'courses' && (
          <MySchedulePanel
            homeCalendars={personal.homeCalendars}
            academicYear={personal.academicYear}
            knownSubjects={personal.allSubjects}
            onChangeDegree={() => setEditingSetup(true)}
          />
        )}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  )
}
