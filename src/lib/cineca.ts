import { addDays, format, startOfWeek } from 'date-fns'

const CINECA_URL =
  'https://unins.prod.up.cineca.it/api/Impegni/getImpegniCalendarioPubblico'
const CLIENTE_ID = '59f05192a635f443422fe8fd'

export type CinecaEvent = {
  nome?: string
  dataInizio: string
  dataFine: string
  docenti?: Array<{ cognome: string; nome: string }>
  aule?: Array<{ descrizione: string }>
  risorse?: Array<{
    docente?: { cognome: string; nome: string }
    aula?: { descrizione: string }
  }>
}

export type ScheduleLesson = {
  id: string
  title: string
  start: Date
  end: Date
  room: string
  professor: string
  dayOfWeek: number // 0 = lunedì
  startTime: string // HH:mm
  endTime: string
}

function toRomeParts(iso: string): { date: Date; hhmm: string } {
  const d = new Date(iso)
  const fmt = new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(
    fmt.formatToParts(d).map((p) => [p.type, p.value]),
  )
  const local = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  )
  return {
    date: local,
    hhmm: `${parts.hour}:${parts.minute}`,
  }
}

function professorOf(e: CinecaEvent): string {
  if (e.docenti?.[0]) {
    return `${e.docenti[0].cognome} ${e.docenti[0].nome}`.trim()
  }
  const doc = e.risorse?.find((r) => r.docente)?.docente
  return doc ? `${doc.cognome} ${doc.nome}`.trim() : ''
}

function roomOf(e: CinecaEvent): string {
  if (e.aule?.[0]?.descrizione) return e.aule[0].descrizione
  return e.risorse?.find((r) => r.aula)?.aula?.descrizione ?? ''
}

function cleanTitle(raw: string): string {
  const aulaCut = raw.match(/^(.+?)Aula/i)
  const base = (aulaCut ? aulaCut[1] : raw).trim()
  return base
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
}

export function weekRange(weekOffset = 0, from = new Date()) {
  const monday = startOfWeek(from, { weekStartsOn: 1 })
  const start = addDays(monday, weekOffset * 7)
  const end = addDays(start, 6)
  return { start, end }
}

export async function fetchPublicCalendar(
  linkId: string,
  range: { start: Date; end: Date },
): Promise<ScheduleLesson[]> {
  const dataInizio = format(range.start, "yyyy-MM-dd'T'00:00:00'+02:00'")
  const dataFine = format(range.end, "yyyy-MM-dd'T'23:59:59'+02:00'")

  const res = await fetch(CINECA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mostraImpegniAnnullati: true,
      mostraIndisponibilitaTotali: false,
      linkCalendarioId: linkId,
      clienteId: CLIENTE_ID,
      pianificazioneTemplate: false,
      dataInizio,
      dataFine,
    }),
  })

  if (!res.ok) {
    throw new Error(`Cineca API ${res.status}`)
  }

  const data: unknown = await res.json()
  const events = (
    Array.isArray(data)
      ? data
      : ((data as { impegni?: CinecaEvent[] } | null)?.impegni ?? [])
  ) as CinecaEvent[]

  return events
    .map((e, i) => {
      const start = toRomeParts(e.dataInizio)
      const end = toRomeParts(e.dataFine)
      const dow = (start.date.getDay() + 6) % 7
      return {
        id: `${linkId}-${e.dataInizio}-${i}`,
        title: cleanTitle(e.nome || 'Lezione'),
        start: start.date,
        end: end.date,
        room: roomOf(e),
        professor: professorOf(e),
        dayOfWeek: dow,
        startTime: start.hhmm,
        endTime: end.hhmm,
      } satisfies ScheduleLesson
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())
}
