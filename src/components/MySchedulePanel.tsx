import { Check, Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  calendarSubtitle,
  calendarsForDegree,
  type PublicCalendar,
} from '../data/calendars'
import {
  DEGREE_LEVEL_LABELS,
  degreeDisplayName,
  findDegree,
} from '../data/insubria-degrees'
import { ExploreDegrees } from './ExploreDegrees'
import { discoverSubjects } from '../hooks/usePersonalOrario'
import { useUserStore } from '../lib/user-store'

type MySchedulePanelProps = {
  homeCalendars: PublicCalendar[]
  academicYear: string | null
  knownSubjects: string[]
  onChangeDegree: () => void
}

type Tab = 'mine' | 'explore'

export function MySchedulePanel({
  homeCalendars,
  academicYear,
  knownSubjects,
  onChangeDegree,
}: MySchedulePanelProps) {
  const userId = useUserStore((s) => s.userId)
  const degreeId = useUserStore((s) => s.degreeId)
  const calendarIds = useUserStore((s) => s.calendarIds)
  const selectedSubjects = useUserStore((s) => s.selectedSubjects)
  const toggleCalendarId = useUserStore((s) => s.toggleCalendarId)
  const setSelectedSubjects = useUserStore((s) => s.setSelectedSubjects)
  const toggleSubject = useUserStore((s) => s.toggleSubject)

  const [tab, setTab] = useState<Tab>('mine')
  const [subjects, setSubjects] = useState<string[]>(knownSubjects)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const degree = degreeId ? findDegree(degreeId) : undefined
  const homePack = degreeId ? calendarsForDegree(degreeId) : null

  const otherSelected = calendarIds.filter(
    (id) => !homeCalendars.some((c) => c.linkId === id),
  )

  useEffect(() => {
    if (knownSubjects.length > 0) setSubjects(knownSubjects)
  }, [knownSubjects])

  const reloadSubjects = async () => {
    if (calendarIds.length === 0) return
    setLoading(true)
    try {
      const found = await discoverSubjects(calendarIds, 0)
      setSubjects(found)
      setSelectedSubjects(
        selectedSubjects.filter((s) => found.includes(s)).length > 0
          ? selectedSubjects.filter((s) => found.includes(s))
          : found,
      )
    } finally {
      setLoading(false)
    }
  }

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="animate-rise space-y-4">
      <div className="flex bg-white/80 border border-[rgba(26,42,92,0.1)] p-1 rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'mine' ? 'bg-navy text-white' : 'text-muted'
          }`}
        >
          Il mio orario
        </button>
        <button
          type="button"
          onClick={() => setTab('explore')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'explore' ? 'bg-navy text-white' : 'text-muted'
          }`}
        >
          Esplora CdL
        </button>
      </div>

      {tab === 'explore' ? (
        <ExploreDegrees mode="add" />
      ) : (
        <>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-navy">
              Il mio orario
            </h2>
            <p className="text-sm text-muted">
              Combina il tuo corso con calendari di altri CdL. L&apos;ID resta in
              questo browser.
            </p>
          </div>

          <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  ID utente
                </p>
                <p className="truncate font-mono text-xs text-navy">{userId}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyId()}
                className="inline-flex items-center gap-1 rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-navy"
              >
                {copied ? (
                  <Check className="size-3.5 text-tasks" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                {copied ? 'Copiato' : 'Copia'}
              </button>
            </div>

            {degree && (
              <button
                type="button"
                onClick={onChangeDegree}
                className="w-full rounded-2xl border border-[rgba(26,42,92,0.1)] bg-paper/70 px-4 py-3 text-left"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Corso principale
                  {academicYear ? ` · A.A. ${academicYear}` : ''}
                </p>
                <p className="mt-0.5 font-display text-base font-extrabold text-navy">
                  {degreeDisplayName(degree)}
                </p>
                <p className="mt-0.5 text-xs text-royal font-semibold">
                  {DEGREE_LEVEL_LABELS[degree.level]} · Cambia
                </p>
              </button>
            )}
          </div>

          {homeCalendars.length > 0 && (
            <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 space-y-3">
              <h3 className="font-display text-base font-extrabold text-navy">
                Calendari del tuo CdL
              </h3>
              <ul className="space-y-2">
                {homeCalendars.map((c) => {
                  const on = calendarIds.includes(c.linkId)
                  return (
                    <li key={c.linkId}>
                      <button
                        type="button"
                        onClick={() => toggleCalendarId(c.linkId)}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm ${
                          on
                            ? 'border-royal bg-royal/10 text-navy'
                            : 'border-[rgba(26,42,92,0.08)] bg-paper/50 text-muted'
                        }`}
                      >
                        <span
                          className={`grid size-5 place-items-center rounded-md border ${
                            on
                              ? 'border-royal bg-royal text-white'
                              : 'border-[rgba(26,42,92,0.2)] bg-white'
                          }`}
                        >
                          {on && <Check className="size-3.5" strokeWidth={3} />}
                        </span>
                        {c.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {otherSelected.length > 0 && (
            <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-extrabold text-navy">
                  Da altri corsi di laurea
                </h3>
                <button
                  type="button"
                  onClick={() => setTab('explore')}
                  className="text-xs font-semibold text-royal"
                >
                  Aggiungi
                </button>
              </div>
              <ul className="space-y-2">
                {otherSelected.map((id) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => toggleCalendarId(id)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-royal bg-royal/10 px-3 py-2.5 text-left text-sm text-navy"
                    >
                      <span className="grid size-5 place-items-center rounded-md border border-royal bg-royal text-white">
                        <Check className="size-3.5" strokeWidth={3} />
                      </span>
                      <span className="min-w-0 truncate font-medium">
                        {calendarSubtitle(id)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {otherSelected.length === 0 && (
            <button
              type="button"
              onClick={() => setTab('explore')}
              className="w-full rounded-2xl border border-dashed border-[rgba(26,42,92,0.2)] bg-white/70 px-4 py-4 text-sm font-semibold text-royal"
            >
              + Aggiungi orario da un altro CdL
            </button>
          )}

          {!homePack && (
            <p className="text-sm text-muted">
              Per il tuo CdL non abbiamo ancora calendari ufficiali: usa
              &quot;Esplora CdL&quot; oppure aggiungi materie a mano.
            </p>
          )}

          <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-base font-extrabold text-navy">
                Materie
              </h3>
              <button
                type="button"
                onClick={() => void reloadSubjects()}
                disabled={loading || calendarIds.length === 0}
                className="rounded-full border border-[rgba(26,42,92,0.12)] p-2 text-navy disabled:opacity-40"
                aria-label="Aggiorna materie"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {subjects.length === 0 ? (
              <p className="text-sm text-muted">
                Seleziona almeno un calendario e aggiorna per vedere le materie.
              </p>
            ) : (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects(subjects)}
                    className="rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-navy"
                  >
                    Tutte ({subjects.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects([])}
                    className="rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-muted"
                  >
                    Nascondi tutte
                  </button>
                </div>
                <ul className="max-h-[40vh] space-y-1 overflow-y-auto">
                  {subjects.map((s) => {
                    const on = selectedSubjects.includes(s)
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => toggleSubject(s)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${
                            on ? 'bg-royal/8 text-navy' : 'text-muted'
                          }`}
                        >
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                              on
                                ? 'border-royal bg-royal text-white'
                                : 'border-[rgba(26,42,92,0.2)] bg-white'
                            }`}
                          >
                            {on && <Check className="size-3.5" strokeWidth={3} />}
                          </span>
                          <span className="font-medium leading-snug">{s}</span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
                <p className="text-xs text-muted">
                  {selectedSubjects.length} di {subjects.length} materie attive
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
