import {
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  Copy,
  GraduationCap,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
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
import { discoverSubjects } from '../hooks/usePersonalOrario'
import { useUserStore } from '../lib/user-store'
import { ExploreDegrees } from './ExploreDegrees'

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

  const [tab, setTab] = useState<Tab>('mine')
  const [subjects, setSubjects] = useState<string[]>(knownSubjects)
  const [subjectQuery, setSubjectQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showAccount, setShowAccount] = useState(false)
  const [confirmChange, setConfirmChange] = useState(false)

  const degree = degreeId ? findDegree(degreeId) : undefined
  const homePack = degreeId ? calendarsForDegree(degreeId) : null

  const otherSelected = useMemo(
    () =>
      calendarIds.filter((id) => !homeCalendars.some((c) => c.linkId === id)),
    [calendarIds, homeCalendars],
  )

  const activeSubjectCount =
    selectedSubjects.length === 0 && subjects.length > 0
      ? subjects.length
      : selectedSubjects.length

  const filteredSubjects = useMemo(() => {
    const q = subjectQuery.trim().toLowerCase()
    if (!q) return subjects
    return subjects.filter((s) => s.toLowerCase().includes(q))
  }, [subjects, subjectQuery])

  useEffect(() => {
    if (knownSubjects.length > 0) setSubjects(knownSubjects)
  }, [knownSubjects])

  const reloadSubjects = async () => {
    if (calendarIds.length === 0) return
    setLoading(true)
    try {
      const found = await discoverSubjects(calendarIds, 0)
      setSubjects(found)
      const kept = selectedSubjects.filter((s) => found.includes(s))
      setSelectedSubjects(kept.length > 0 ? kept : found)
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
    <div className="animate-rise space-y-5">
      <div className="flex gap-1 rounded-2xl border border-[rgba(26,42,92,0.1)] bg-white/80 p-1">
        <button
          type="button"
          onClick={() => setTab('mine')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'mine' ? 'bg-navy text-white shadow-sm' : 'text-muted'
          }`}
        >
          Il mio orario
        </button>
        <button
          type="button"
          onClick={() => setTab('explore')}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition ${
            tab === 'explore' ? 'bg-navy text-white shadow-sm' : 'text-muted'
          }`}
        >
          Esplora CdL
        </button>
      </div>

      {tab === 'explore' ? (
        <ExploreDegrees mode="add" />
      ) : (
        <>
          {/* Riepilogo corso */}
          {degree ? (
            confirmChange ? (
              <div className="animate-fade rounded-[1.35rem] border border-royal/30 bg-white px-4 py-4 space-y-3">
                <p className="font-display text-base font-extrabold text-navy">
                  Cambiare corso di laurea?
                </p>
                <p className="text-sm text-muted">
                  Dovrai selezionare di nuovo CdL, calendari e materie. Le scelte
                  attuali verranno sostituite.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmChange(false)}
                    className="flex-1 rounded-full border border-[rgba(26,42,92,0.12)] py-2.5 text-sm font-semibold text-navy"
                  >
                    Annulla
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmChange(false)
                      onChangeDegree()
                    }}
                    className="flex-1 rounded-full bg-royal py-2.5 text-sm font-semibold text-white"
                  >
                    Sì, cambia
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmChange(true)}
                className="group w-full rounded-[1.35rem] border border-[rgba(26,42,92,0.08)] bg-gradient-to-br from-white/95 to-paper/90 px-4 py-4 text-left transition hover:border-royal/35"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-royal/10 text-royal">
                    <GraduationCap className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                      Corso principale
                      {academicYear ? ` · A.A. ${academicYear}` : ''}
                    </p>
                    <p className="mt-0.5 font-display text-lg font-extrabold leading-tight tracking-tight text-navy">
                      {degreeDisplayName(degree)}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {DEGREE_LEVEL_LABELS[degree.level]}
                    </p>
                  </div>
                  <span className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-royal opacity-80 group-hover:opacity-100">
                    Cambia
                    <ChevronRight className="size-3.5" />
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-[rgba(26,42,92,0.06)] pt-3">
                  <StatChip
                    icon={<CalendarDays className="size-3.5" />}
                    label={`${calendarIds.length} calendari`}
                  />
                  <StatChip
                    icon={<BookOpen className="size-3.5" />}
                    label={
                      subjects.length === 0
                        ? 'Nessuna materia'
                        : `${activeSubjectCount}/${subjects.length} materie`
                    }
                  />
                  {otherSelected.length > 0 && (
                    <StatChip
                      label={`+${otherSelected.length} da altri CdL`}
                      accent
                    />
                  )}
                </div>
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onChangeDegree}
              className="w-full rounded-[1.35rem] border border-dashed border-royal/40 bg-royal/5 px-4 py-5 text-sm font-semibold text-royal"
            >
              Scegli il tuo corso di laurea
            </button>
          )}

          {/* Calendari */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2 px-0.5">
              <div>
                <h3 className="font-display text-base font-extrabold text-navy">
                  Calendari attivi
                </h3>
                <p className="text-xs text-muted">
                  Anni e sedi da cui caricare le lezioni
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTab('explore')}
                className="inline-flex items-center gap-1 rounded-full bg-royal px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Plus className="size-3.5" />
                Altro CdL
              </button>
            </div>

            {homeCalendars.length === 0 && otherSelected.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/80 px-4 py-5 text-sm text-muted">
                {homePack ? (
                  <p>Nessun calendario selezionato per il tuo CdL.</p>
                ) : (
                  <p>
                    Per questo corso non ci sono ancora calendari ufficiali.
                    Aggiungine uno da un altro CdL.
                  </p>
                )}
              </div>
            ) : (
              <ul className="space-y-2">
                {homeCalendars.length > 0 && (
                  <li className="px-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Il tuo CdL
                  </li>
                )}
                {homeCalendars.map((c) => (
                  <CalendarRow
                    key={c.linkId}
                    label={c.label}
                    detail={c.campus}
                    on={calendarIds.includes(c.linkId)}
                    onToggle={() => toggleCalendarId(c.linkId)}
                  />
                ))}

                {otherSelected.length > 0 && (
                  <li className="px-0.5 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Altri corsi
                  </li>
                )}
                {otherSelected.map((id) => (
                  <CalendarRow
                    key={id}
                    label={calendarSubtitle(id)}
                    on
                    onToggle={() => toggleCalendarId(id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Materie */}
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2 px-0.5">
              <div>
                <h3 className="font-display text-base font-extrabold text-navy">
                  Materie
                </h3>
                <p className="text-xs text-muted">
                  Filtra cosa vedi in settimana e mese
                </p>
              </div>
              <button
                type="button"
                onClick={() => void reloadSubjects()}
                disabled={loading || calendarIds.length === 0}
                className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(26,42,92,0.12)] bg-white px-3 py-1.5 text-xs font-semibold text-navy disabled:opacity-40"
              >
                <RefreshCw
                  className={`size-3.5 ${loading ? 'animate-spin' : ''}`}
                />
                Aggiorna
              </button>
            </div>

            {subjects.length === 0 ? (
              <div className="rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/80 px-4 py-5 text-sm text-muted">
                {calendarIds.length === 0
                  ? 'Attiva almeno un calendario per caricare le materie.'
                  : 'Nessuna materia trovata questa settimana. Prova “Aggiorna”.'}
              </div>
            ) : (
              <div className="space-y-3 rounded-[1.35rem] border border-[rgba(26,42,92,0.08)] bg-white/85 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                  <input
                    value={subjectQuery}
                    onChange={(e) => setSubjectQuery(e.target.value)}
                    placeholder="Cerca materia…"
                    className="w-full rounded-xl border border-[rgba(26,42,92,0.1)] bg-paper/60 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-royal"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects([])}
                    className="rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-navy"
                  >
                    Mostra tutte
                  </button>
                  <span className="ml-auto self-center text-xs text-muted">
                    {selectedSubjects.length === 0
                      ? `${subjects.length} visibili`
                      : `${selectedSubjects.length} di ${subjects.length}`}
                  </span>
                </div>

                <ul className="max-h-[42vh] space-y-0.5 overflow-y-auto overscroll-contain">
                  {filteredSubjects.map((s) => {
                    const on =
                      selectedSubjects.length === 0 ||
                      selectedSubjects.includes(s)
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedSubjects.length === 0) {
                              setSelectedSubjects(
                                subjects.filter((x) => x !== s),
                              )
                              return
                            }
                            const next = selectedSubjects.includes(s)
                              ? selectedSubjects.filter((x) => x !== s)
                              : [...selectedSubjects, s]
                            setSelectedSubjects(
                              next.length === 0 ||
                                next.length === subjects.length
                                ? []
                                : next,
                            )
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                            on
                              ? 'bg-royal/8 text-navy'
                              : 'text-muted hover:bg-paper/80'
                          }`}
                        >
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                              on
                                ? 'border-royal bg-royal text-white'
                                : 'border-[rgba(26,42,92,0.2)] bg-white'
                            }`}
                          >
                            {on && (
                              <Check className="size-3.5" strokeWidth={3} />
                            )}
                          </span>
                          <span className="font-medium leading-snug">{s}</span>
                        </button>
                      </li>
                    )
                  })}
                  {filteredSubjects.length === 0 && (
                    <li className="px-3 py-4 text-sm text-muted">
                      Nessuna materia corrisponde alla ricerca.
                    </li>
                  )}
                </ul>
              </div>
            )}
          </section>

          {/* Account (discreto) */}
          <div className="border-t border-[rgba(26,42,92,0.06)] pt-2">
            <button
              type="button"
              onClick={() => setShowAccount((v) => !v)}
              className="flex w-full items-center justify-between px-0.5 py-2 text-xs font-semibold text-muted"
            >
              <span>ID account (sync preferenze)</span>
              <ChevronRight
                className={`size-3.5 transition ${showAccount ? 'rotate-90' : ''}`}
              />
            </button>
            {showAccount && (
              <div className="animate-fade flex items-center gap-2 rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/70 px-3 py-2.5">
                <p className="min-w-0 flex-1 truncate font-mono text-[11px] text-navy">
                  {userId}
                </p>
                <button
                  type="button"
                  onClick={() => void copyId()}
                  className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgba(26,42,92,0.12)] px-2.5 py-1 text-[11px] font-semibold text-navy"
                >
                  {copied ? (
                    <Check className="size-3 text-tasks" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  {copied ? 'OK' : 'Copia'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function StatChip({
  icon,
  label,
  accent,
}: {
  icon?: ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        accent
          ? 'bg-tasks/10 text-tasks'
          : 'bg-[rgba(26,42,92,0.06)] text-navy'
      }`}
    >
      {icon}
      {label}
    </span>
  )
}

function CalendarRow({
  label,
  detail,
  on,
  onToggle,
}: {
  label: string
  detail?: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left text-sm transition ${
          on
            ? 'border-royal/40 bg-white text-navy shadow-[0_1px_0_rgba(47,123,255,0.12)]'
            : 'border-transparent bg-white/55 text-muted'
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
        <span className="min-w-0">
          <span className="block font-semibold leading-snug">{label}</span>
          {detail && <span className="text-xs text-muted">{detail}</span>}
        </span>
      </button>
    </li>
  )
}
