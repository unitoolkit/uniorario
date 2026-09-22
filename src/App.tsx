import { RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { BottomNav, type AppView } from './components/BottomNav'
import { CoursesPanel } from './components/CoursesPanel'
import { Header } from './components/Header'
import { MonthView } from './components/MonthView'
import { NextLessonCard } from './components/NextLessonCard'
import { WeekView } from './components/WeekView'
import { useSchedule } from './hooks/useSchedule'
import { mondayOfWeek } from './lib/schedule'

function weekOffsetForDate(date: Date): number {
  const thisMonday = mondayOfWeek(new Date(), 0).getTime()
  const targetMonday = mondayOfWeek(date, 0).getTime()
  return Math.round((targetMonday - thisMonday) / (7 * 24 * 60 * 60 * 1000))
}

export default function App() {
  const api = useSchedule()
  const [view, setView] = useState<AppView>('week')
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const titles: Record<AppView, string> = {
    week: 'Vista settimanale',
    month: 'Vista mensile',
    courses: 'Gestione corsi',
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl pb-28">
      <Header title={titles[view]} />

      <main className="px-[clamp(1.25rem,4vw,2rem)] pt-4 space-y-4">
        {api.loading && (
          <div className="animate-fade flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm text-muted">
            <RefreshCw className="size-4 animate-spin" />
            Caricamento orario…
          </div>
        )}

        {api.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <p className="font-semibold">Errore database</p>
            <p className="mt-1">{api.error}</p>
            <p className="mt-2 text-red-600/80">
              Hai eseguito lo schema SQL in Supabase? Vedi{' '}
              <code className="rounded bg-red-100 px-1">supabase/schema.sql</code>
            </p>
            <button
              type="button"
              onClick={() => void api.refresh()}
              className="mt-3 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Riprova
            </button>
          </div>
        )}

        {!api.loading && !api.error && view !== 'courses' && (
          <NextLessonCard lessons={api.lessons} />
        )}

        {view === 'week' && (
          <WeekView
            lessons={api.lessons}
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
            lessons={api.lessons}
            selectedDate={selectedDate}
            onSelectDate={(d) => {
              setSelectedDate(d)
              setWeekOffset(weekOffsetForDate(d))
              setView('week')
            }}
          />
        )}

        {view === 'courses' && <CoursesPanel api={api} />}
      </main>

      <BottomNav active={view} onChange={setView} />
    </div>
  )
}
