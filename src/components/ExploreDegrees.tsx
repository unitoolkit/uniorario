import { Check, Plus, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  allCalendarPacks,
  calendarSubtitle,
  type DegreeCalendars,
  type PublicCalendar,
} from '../data/calendars'
import {
  DEGREE_LEVEL_LABELS,
  findDegree,
  type DegreeLevel,
} from '../data/insubria-degrees'
import { useUserStore } from '../lib/user-store'

type ExploreViewProps = {
  /** Se true, i calendari selezionati vanno nell'orario personale */
  mode?: 'explore' | 'add'
  onPreview?: (calendar: PublicCalendar, pack: DegreeCalendars) => void
}

const LEVELS: Array<DegreeLevel | 'all'> = [
  'all',
  'triennale',
  'magistrale',
  'ciclo_unico',
]

export function ExploreDegrees({ mode = 'add', onPreview }: ExploreViewProps) {
  const calendarIds = useUserStore((s) => s.calendarIds)
  const toggleCalendarId = useUserStore((s) => s.toggleCalendarId)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState<DegreeLevel | 'all'>('all')
  const [openPath, setOpenPath] = useState<string | null>(null)

  const packs = useMemo(() => {
    const q = query.trim().toLowerCase()
    return allCalendarPacks().filter((p) => {
      if (level !== 'all') {
        const ok = p.degreeIds.some((id) => findDegree(id)?.level === level)
        if (!ok) return false
      }
      if (!q) return true
      return (
        p.title.toLowerCase().includes(q) ||
        p.calendars.some((c) => c.label.toLowerCase().includes(q))
      )
    })
  }, [query, level])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-extrabold tracking-tight text-navy">
          Esplora corsi di laurea
        </h2>
        <p className="text-sm text-muted">
          Consulta gli orari ufficiali e aggiungili al tuo orario personale, anche
          da facoltà diverse.
        </p>
      </div>

      <label className="block space-y-1.5">
        <span className="sr-only">Cerca</span>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca CdL o anno…"
            className="w-full rounded-2xl border border-[rgba(26,42,92,0.12)] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-royal"
          />
        </div>
      </label>

      <div className="flex flex-wrap gap-1.5">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              level === l
                ? 'bg-navy text-white'
                : 'bg-white border border-[rgba(26,42,92,0.12)] text-muted'
            }`}
          >
            {l === 'all' ? 'Tutti' : DEGREE_LEVEL_LABELS[l]}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {packs.map((pack) => {
          const open = openPath === pack.sourcePath
          const selectedCount = pack.calendars.filter((c) =>
            calendarIds.includes(c.linkId),
          ).length

          return (
            <li
              key={pack.sourcePath}
              className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 overflow-hidden"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenPath(open ? null : pack.sourcePath)
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <div className="min-w-0">
                  <p className="font-display text-sm font-extrabold text-navy truncate">
                    {pack.title}
                  </p>
                  <p className="text-xs text-muted">
                    A.A. {pack.academicYear} · {pack.calendars.length} calendari
                    {selectedCount > 0 ? ` · ${selectedCount} nel tuo orario` : ''}
                  </p>
                </div>
                <span className="text-xs font-semibold text-royal">
                  {open ? 'Chiudi' : 'Apri'}
                </span>
              </button>

              {open && (
                <ul className="space-y-1.5 border-t border-[rgba(26,42,92,0.06)] px-3 py-3">
                  {pack.calendars.map((c) => {
                    const on = calendarIds.includes(c.linkId)
                    return (
                      <li key={c.linkId} className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCalendarId(c.linkId)}
                          className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-sm ${
                            on
                              ? 'border-royal bg-royal/10 text-navy'
                              : 'border-[rgba(26,42,92,0.08)] bg-paper/50 text-navy'
                          }`}
                        >
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                              on
                                ? 'border-royal bg-royal text-white'
                                : 'border-[rgba(26,42,92,0.2)] bg-white'
                            }`}
                          >
                            {on ? (
                              <Check className="size-3.5" strokeWidth={3} />
                            ) : (
                              <Plus className="size-3.5 text-muted" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-semibold leading-snug">
                              {c.label}
                            </span>
                            {c.campus && (
                              <span className="text-xs text-muted">{c.campus}</span>
                            )}
                          </span>
                        </button>
                        {mode === 'explore' && onPreview && (
                          <button
                            type="button"
                            onClick={() => onPreview(c, pack)}
                            className="shrink-0 rounded-2xl border border-[rgba(26,42,92,0.12)] px-3 text-xs font-semibold text-royal"
                          >
                            Vedi
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {packs.length === 0 && (
        <p className="text-sm text-muted">Nessun corso trovato.</p>
      )}

      {calendarIds.length > 0 && (
        <p className="text-xs text-muted">
          Nel tuo orario: {calendarIds.length} calendari
          {calendarIds.slice(0, 2).map((id) => (
            <span key={id} className="block truncate">
              · {calendarSubtitle(id)}
            </span>
          ))}
          {calendarIds.length > 2 && (
            <span className="block">· +{calendarIds.length - 2} altri</span>
          )}
        </p>
      )}
    </div>
  )
}
