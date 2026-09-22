import { Check, Copy, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { PublicCalendar } from '../data/calendars'
import {
  DEGREE_LEVEL_LABELS,
  degreeDisplayName,
  findDegree,
} from '../data/insubria-degrees'
import { discoverSubjects } from '../hooks/usePersonalOrario'
import { useUserStore } from '../lib/user-store'

type MySchedulePanelProps = {
  calendars: PublicCalendar[]
  academicYear: string | null
  knownSubjects: string[]
  onChangeDegree: () => void
}

export function MySchedulePanel({
  calendars,
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

  const [subjects, setSubjects] = useState<string[]>(knownSubjects)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const degree = degreeId ? findDegree(degreeId) : undefined

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
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-navy">
          Il mio orario
        </h2>
        <p className="text-sm text-muted">
          Personalizza corsi di laurea, anni e materie. L&apos;ID resta in questo
          browser.
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
            {copied ? <Check className="size-3.5 text-tasks" /> : <Copy className="size-3.5" />}
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
              Corso di laurea
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

      {calendars.length > 0 && (
        <div className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-4 space-y-3">
          <h3 className="font-display text-base font-extrabold text-navy">
            Anni / calendari
          </h3>
          <ul className="space-y-2">
            {calendars.map((c) => {
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
            <ul className="max-h-[45vh] space-y-1 overflow-y-auto">
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
    </div>
  )
}
