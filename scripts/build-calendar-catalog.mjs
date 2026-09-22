import fs from 'node:fs'
import { createRequire } from 'node:module'

// Build catalog without TS import — duplicate minimal slug map
const raw = JSON.parse(
  fs.readFileSync('scripts/scraped-calendars.json', 'utf8').replace(/^\uFEFF/, ''),
)

function clean(s) {
  return String(s)
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseYear(label) {
  const a = label.match(/([1-9])\s*[°º]/)
  if (a) return Number(a[1])
  const r = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6 }
  const m = label.match(/\b(VI|IV|V|I{1,3})\b/i)
  return m ? r[m[1].toUpperCase()] || 1 : 1
}

function campus(label) {
  const m = label.match(/\b(Varese|Como|Busto)\b/i)
  return m
    ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase()
    : undefined
}

const PATH_MAP = {
  'economia-e-management-dellinnovazione-e-della': [
    'triennale-economia-e-management-dell-innovazione-e-della-sostenibilita',
  ],
  'educazione-professionale-abilitante-alla-professione': [
    'triennale-educazione-professionale-varese',
  ],
  giurisprudenza: [
    'ciclo_unico-giurisprudenza-como',
    'ciclo_unico-giurisprudenza-varese',
  ],
  'global-entrepreneurship-economics-and-management': [
    'magistrale-global-entrepreneurship-economics-and-management-geem',
  ],
  'hospitality-sustainable-tourism-development': [
    'magistrale-hospitality-for-sustainable-tourism-development',
  ],
  'igiene-dentale-abilitante-alla-professione-sanitaria': [
    'triennale-igiene-dentale-varese',
  ],
  'infermieristica-abilitante-alla-professione-sanitaria': [
    'triennale-infermieristica',
  ],
  informatica: ['triennale-informatica-varese'],
  'informatica-0': ['magistrale-informatica'],
  'informatica-como': ['triennale-informatica-como'],
  'ingegneria-ambientale-e-la-sostenibilita-degli': [
    'magistrale-ingegneria-ambientale-e-per-la-sostenibilita-degli-ambienti-di-lavoro',
  ],
  'ingegneria-la-sicurezza-del-lavoro-e-dellambiente': [
    'triennale-ingegneria-per-la-sicurezza-del-lavoro-e-dell-ambiente',
  ],
  'lingue-moderne-la-comunicazione-e-la-cooperazione': [
    'magistrale-lingue-moderne-per-la-comunicazione-e-la-cooperazione-internazionale',
  ],
  'medicina-e-chirurgia': ['ciclo_unico-medicina-e-chirurgia'],
  'odontoiatria-e-protesi-dentaria': [
    'ciclo_unico-odontoiatria-e-protesi-dentaria',
  ],
  'scienze-dellambiente-e-della-natura': [
    'triennale-scienze-dell-ambiente-e-della-natura',
  ],
  'scienze-della-mediazione-interlinguistica-e': [
    'triennale-scienze-della-mediazione-interlinguistica-e-interculturale',
  ],
  'scienze-del-turismo': ['triennale-scienze-del-turismo'],
  'scienze-motorie': ['triennale-scienze-motorie'],
  'storia-e-storie-del-mondo-contemporaneo': [
    'triennale-storia-e-storie-del-mondo-contemporaneo',
  ],
  'tecniche-di-fisiopatologia-cardiocircolatoria-e': [
    'triennale-tecniche-di-fisiopatologia-cardiocircolatoria-e-perfusione-cardiovascolare-varese',
  ],
  'tecniche-digitali-lambiente-e-le-costruzioni': [
    'triennale-tecniche-digitali-per-l-ambiente-e-le-costruzioni',
  ],
  'tecniche-di-laboratorio-biomedico-abilitante-alla': [
    'triennale-tecniche-di-laboratorio-biomedico-varese',
  ],
}

const packs = raw.map((p) => {
  const slug = p.path.split('/').pop()
  const name = clean(p.name)
    .replace(/\[[A-Z]\d{2,3}[A-Z]?\]\s*/g, '')
    .replace(/\(abilitante[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const code =
    typeof p.code === 'string' && /^[A-Z]\d{2,3}[A-Z]?$/.test(p.code)
      ? p.code
      : undefined
  return {
    title: name,
    code,
    sourcePath: p.path,
    academicYear: p.ay === '?' ? '2026/2027' : p.ay,
    degreeIds: PATH_MAP[slug] || [],
    calendars: p.calendars.map((c) => ({
      linkId: c.id,
      label: clean(c.label),
      year: parseYear(c.label),
      campus: campus(c.label),
      sourcePath: p.path,
      url: `https://unins.prod.up.cineca.it/calendarioPubblico/linkCalendarioId=${c.id}`,
    })),
  }
})

const degreeCodes = {}
for (const p of packs) {
  if (!p.code) continue
  for (const id of p.degreeIds) degreeCodes[id] = p.code
}
// Informatica Como condivide il codice della triennale Varese
if (
  degreeCodes['triennale-informatica-varese'] &&
  !degreeCodes['triennale-informatica-como']
) {
  degreeCodes['triennale-informatica-como'] =
    degreeCodes['triennale-informatica-varese']
}
for (const p of packs) {
  if (p.code) continue
  for (const id of p.degreeIds) {
    if (degreeCodes[id]) {
      p.code = degreeCodes[id]
      break
    }
  }
}

fs.writeFileSync(
  'src/data/calendar-catalog.json',
  `${JSON.stringify(packs, null, 2)}\n`,
)
fs.writeFileSync(
  'src/data/degree-codes.json',
  `${JSON.stringify(degreeCodes, null, 2)}\n`,
)

console.log(
  'wrote',
  packs.length,
  'packs,',
  Object.keys(degreeCodes).length,
  'degree codes',
)
for (const p of packs) {
  console.log(
    (p.code || '????').padEnd(5),
    '|',
    (p.degreeIds[0] || 'UNMAPPED').slice(0, 36).padEnd(36),
    '|',
    p.title.slice(0, 36),
    '|',
    p.calendars.length,
  )
}
