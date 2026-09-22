import { Check, ChevronLeft, Copy, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { calendarsForDegree } from '../data/calendars'
import {
  DEGREE_LEVEL_LABELS,
  UNIVERSITY,
  degreeDisplayName,
  degreesByLevel,
  type DegreeLevel,
} from '../data/insubria-degrees'
import { discoverSubjects } from '../hooks/usePersonalOrario'
import { useUserStore } from '../lib/user-store'

type Step = 'degree' | 'calendars' | 'subjects'

const LEVELS: DegreeLevel[] = ['triennale', 'magistrale', 'ciclo_unico']

type SetupProps = {
  onDone: () => void
  /** Se true, riparte dallo step grado mantenendo userId */
  editing?: boolean
}

export function Setup({ onDone, editing = false }: SetupProps) {
  const ensureUserId = useUserStore((s) => s.ensureUserId)
  const completeSetup = useUserStore((s) => s.completeSetup)
  const storedDegreeId = useUserStore((s) => s.degreeId)
  const storedCalendarIds = useUserStore((s) => s.calendarIds)
  const storedSubjects = useUserStore((s) => s.selectedSubjects)

  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState<Step>('degree')
  const [level, setLevel] = useState<DegreeLevel>('triennale')
  const [degreeId, setDegreeId] = useState(storedDegreeId ?? '')
  const [query, setQuery] = useState('')
  const [calendarIds, setCalendarIds] = useState<string[]>(storedCalendarIds)
  const [subjects, setSubjects] = useState<string[]>([])
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(storedSubjects)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
  const [subjectError, setSubjectError] = useState<string | null>(null)

  useEffect(() => {
    setUserId(ensureUserId())
  }, [ensureUserId])

  const options = useMemo(() => {
    const list = degreesByLevel(level)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.code?.toLowerCase().includes(q) ?? false) ||
        (d.campus?.toLowerCase().includes(q) ?? false),
    )
  }, [level, query])

  const pack = degreeId ? calendarsForDegree(degreeId) : null
  const hasCalendars = Boolean(pack && pack.calendars.length > 0)

  const toggleCal = (id: string) => {
    setCalendarIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    )
  }

  const toggleSub = (name: string) => {
    setSelectedSubjects((cur) =>
      cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name],
    )
  }

  const goCalendarsOrFinish = () => {
    if (!degreeId) return
    if (hasCalendars) {
      const defaults =
        calendarIds.length > 0
          ? calendarIds.filter((id) =>
              pack!.calendars.some((c) => c.linkId === id),
            )
          : [pack!.calendars[0].linkId]
      setCalendarIds(defaults.length ? defaults : [pack!.calendars[0].linkId])
      setStep('calendars')
      return
    }
    // Nessun calendario ufficiale ancora: salva solo il CdL
    completeSetup({ degreeId, calendarIds: [], selectedSubjects: [] })
    onDone()
  }

  const loadSubjects = async (ids: string[]) => {
    setLoadingSubjects(true)
    setSubjectError(null)
    try {
      const found = await discoverSubjects(ids, 0)
      setSubjects(found)
      setSelectedSubjects((prev) => {
        if (prev.length === 0) return found
        const keep = prev.filter((s) => found.includes(s))
        return keep.length > 0 ? keep : found
      })
    } catch (e) {
      setSubjectError(e instanceof Error ? e.message : 'Errore materie')
      setSubjects([])
    } finally {
      setLoadingSubjects(false)
    }
  }

  const goSubjects = async () => {
    if (calendarIds.length === 0) return
    setStep('subjects')
    await loadSubjects(calendarIds)
  }

  const finish = () => {
    if (!degreeId) return
    completeSetup({
      degreeId,
      calendarIds,
      selectedSubjects:
        selectedSubjects.length > 0 ? selectedSubjects : subjects,
    })
    onDone()
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
    <div className="animate-rise mx-auto max-w-lg space-y-5 px-[clamp(1.25rem,4vw,2rem)] py-8">
      <div className="text-center">
        <img
          src={`${import.meta.env.BASE_URL}uniorario.png`}
          alt=""
          width={72}
          height={72}
          className="mx-auto size-[4.5rem] rounded-2xl shadow-[0_8px_24px_rgba(47,123,255,0.28)]"
        />
        <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-navy">
          <span className="text-navy">Uni</span>
          <span className="text-royal">Orario</span>
        </h1>
        <p className="mt-2 text-sm text-muted">{UNIVERSITY.name}</p>
      </div>

      {userId && (
        <div className="flex items-center justify-between gap-2 rounded-2xl border border-[rgba(26,42,92,0.08)] bg-white/80 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Il tuo ID utente
            </p>
            <p className="truncate font-mono text-xs text-navy">{userId}</p>
          </div>
          <button
            type="button"
            onClick={() => void copyId()}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-navy"
          >
            {copied ? <Check className="size-3.5 text-tasks" /> : <Copy className="size-3.5" />}
            {copied ? 'Copiato' : 'Copia'}
          </button>
        </div>
      )}

      <section className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-5 space-y-4">
        {step !== 'degree' && (
          <button
            type="button"
            onClick={() =>
              setStep(step === 'subjects' ? 'calendars' : 'degree')
            }
            className="inline-flex items-center gap-1 text-sm font-semibold text-royal"
          >
            <ChevronLeft className="size-4" />
            Indietro
          </button>
        )}

        {step === 'degree' && (
          <>
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy">
                {editing ? 'Cambia corso di laurea' : 'Scegli il corso di laurea'}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Poi potrai selezionare gli anni e le materie del tuo piano.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    setLevel(l)
                    setDegreeId('')
                    setQuery('')
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    level === l
                      ? 'border-royal bg-royal text-white'
                      : 'border-[rgba(26,42,92,0.12)] bg-paper/60 text-navy hover:border-royal/40'
                  }`}
                >
                  {DEGREE_LEVEL_LABELS[l]}
                </button>
              ))}
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Cerca corso
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Es. Informatica, Medicina…"
                className="w-full rounded-[0.9rem] border-[1.5px] border-[rgba(26,42,92,0.12)] bg-white px-3.5 py-2.5 text-ink outline-none focus:border-royal focus:shadow-[0_0_0_3px_rgba(47,123,255,0.15)]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Corso di laurea
              </span>
              <select
                value={degreeId}
                onChange={(e) => setDegreeId(e.target.value)}
                className="w-full rounded-[0.9rem] border-[1.5px] border-[rgba(26,42,92,0.12)] bg-white px-3.5 py-2.5 text-ink outline-none focus:border-royal"
              >
                <option value="">Seleziona…</option>
                {options.map((d) => (
                  <option key={d.id} value={d.id}>
                    {degreeDisplayName(d)}
                    {calendarsForDegree(d.id) ? ' · orario live' : ''}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              disabled={!degreeId}
              onClick={goCalendarsOrFinish}
              className="w-full rounded-full bg-royal py-3 text-sm font-semibold text-white transition hover:bg-royal-soft disabled:opacity-40"
            >
              Continua
            </button>
          </>
        )}

        {step === 'calendars' && pack && (
          <>
            <div>
              <h2 className="font-display text-lg font-extrabold text-navy">
                Seleziona gli anni
              </h2>
              <p className="mt-1 text-sm text-muted">
                A.A. {pack.academicYear} — puoi unire più calendari (es. corso
                ripetuto).
              </p>
            </div>

            <ul className="space-y-2">
              {pack.calendars.map((c) => {
                const on = calendarIds.includes(c.linkId)
                return (
                  <li key={c.linkId}>
                    <button
                      type="button"
                      onClick={() => toggleCal(c.linkId)}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm transition ${
                        on
                          ? 'border-royal bg-royal/10 text-navy'
                          : 'border-[rgba(26,42,92,0.1)] bg-paper/50 text-muted'
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
                      <span className="font-semibold">{c.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>

            <button
              type="button"
              disabled={calendarIds.length === 0}
              onClick={() => void goSubjects()}
              className="w-full rounded-full bg-royal py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Continua alle materie
            </button>
          </>
        )}

        {step === 'subjects' && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-extrabold text-navy">
                  Seleziona le materie
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Solo queste compariranno nel tuo orario personale.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadSubjects(calendarIds)}
                className="rounded-full border border-[rgba(26,42,92,0.12)] p-2 text-navy"
                aria-label="Ricarica materie"
              >
                <RefreshCw
                  className={`size-4 ${loadingSubjects ? 'animate-spin' : ''}`}
                />
              </button>
            </div>

            {loadingSubjects && (
              <p className="text-sm text-muted">Carico insegnamenti da Cineca…</p>
            )}
            {subjectError && (
              <p className="text-sm text-red-600">{subjectError}</p>
            )}

            {!loadingSubjects && subjects.length > 0 && (
              <>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects(subjects)}
                    className="rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-navy"
                  >
                    Tutte
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSubjects([])}
                    className="rounded-full border border-[rgba(26,42,92,0.12)] px-3 py-1.5 text-xs font-semibold text-muted"
                  >
                    Nessuna
                  </button>
                </div>

                <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
                  {subjects.map((s) => {
                    const on = selectedSubjects.includes(s)
                    return (
                      <li key={s}>
                        <button
                          type="button"
                          onClick={() => toggleSub(s)}
                          className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm ${
                            on
                              ? 'border-royal/40 bg-royal/8 text-navy'
                              : 'border-transparent bg-paper/60 text-muted'
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
              </>
            )}

            {!loadingSubjects && subjects.length === 0 && !subjectError && (
              <p className="text-sm text-muted">
                Nessuna lezione trovata questa settimana. Puoi comunque salvare e
                riprovare dopo.
              </p>
            )}

            <button
              type="button"
              disabled={loadingSubjects}
              onClick={finish}
              className="w-full rounded-full bg-royal py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              Salva il mio orario
            </button>
          </>
        )}
      </section>
    </div>
  )
}
