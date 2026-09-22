import { useMemo, useState } from 'react'
import {
  DEGREE_LEVEL_LABELS,
  UNIVERSITY,
  degreeDisplayName,
  degreesByLevel,
  type DegreeLevel,
} from '../data/insubria-degrees'
import { setSelectedDegreeId } from '../lib/preferences'

type SetupProps = {
  onDone: (degreeId: string) => void
  initialDegreeId?: string | null
}

const LEVELS: DegreeLevel[] = ['triennale', 'magistrale', 'ciclo_unico']

export function Setup({ onDone, initialDegreeId }: SetupProps) {
  const [level, setLevel] = useState<DegreeLevel>('triennale')
  const [degreeId, setDegreeId] = useState(initialDegreeId ?? '')
  const [query, setQuery] = useState('')

  const options = useMemo(() => {
    const list = degreesByLevel(level)
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.campus?.toLowerCase().includes(q) ?? false),
    )
  }, [level, query])

  const submit = () => {
    if (!degreeId) return
    setSelectedDegreeId(degreeId)
    onDone(degreeId)
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
        <p className="mt-2 text-sm text-muted">
          {UNIVERSITY.name}
        </p>
      </div>

      <section className="rounded-3xl border border-[rgba(26,42,92,0.08)] bg-white/85 p-5 space-y-4">
        <div>
          <h2 className="font-display text-lg font-extrabold text-navy">
            Scegli il tuo corso di laurea
          </h2>
          <p className="mt-1 text-sm text-muted">
            Per ora è disponibile solo l&apos;Insubria. Potrai cambiare corso in seguito.
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
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          disabled={!degreeId}
          onClick={submit}
          className="w-full rounded-full bg-royal py-3 text-sm font-semibold text-white transition hover:bg-royal-soft disabled:opacity-40"
        >
          Continua
        </button>
      </section>
    </div>
  )
}
