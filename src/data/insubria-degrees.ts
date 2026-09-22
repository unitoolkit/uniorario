/**
 * Offerta formativa Università degli Studi dell'Insubria — A.A. 2026/2027
 * Fonte: https://www.uninsubria.it/formazione/offerta-formativa/corsi-di-laurea
 * Guide ufficiali triennali/ciclo unico e magistrali (luglio 2026).
 * Codici CdL: src/data/degree-codes.json (generato dallo scrape).
 */
import degreeCodes from './degree-codes.json'

export type DegreeLevel = 'triennale' | 'magistrale' | 'ciclo_unico'

export type DegreeProgram = {
  id: string
  name: string
  level: DegreeLevel
  /** Codice ufficiale CdL, es. F04R */
  code?: string
  /** Sede principale, se rilevante */
  campus?: string
}

export const UNIVERSITY = {
  id: 'insubria',
  name: "Università degli Studi dell'Insubria",
  shortName: 'Insubria',
} as const

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, string> = {
  triennale: 'Laurea triennale',
  magistrale: 'Laurea magistrale',
  ciclo_unico: 'Laurea magistrale a ciclo unico',
}

function slug(name: string, campus?: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return campus ? `${base}-${campus.toLowerCase()}` : base
}

const triennale: Omit<DegreeProgram, 'id' | 'level'>[] = [
  { name: 'Biotecnologie' },
  { name: 'Chimica e chimica industriale' },
  { name: "Economia e management dell'innovazione e della sostenibilità" },
  {
    name: "Economia e management dell'innovazione e della sostenibilità — digitale integrato",
  },
  {
    name: 'Educazione professionale',
    campus: 'Varese',
  },
  { name: 'Fisica' },
  { name: 'Fisioterapia', campus: 'Varese' },
  { name: 'Igiene dentale', campus: 'Varese' },
  { name: 'Infermieristica' },
  { name: 'Informatica', campus: 'Varese' },
  { name: 'Informatica', campus: 'Como' },
  { name: "Ingegneria per la sicurezza del lavoro e dell'ambiente" },
  { name: 'Matematica' },
  { name: 'Ostetricia', campus: 'Varese' },
  { name: 'Scienze biologiche' },
  { name: 'Scienze del turismo' },
  { name: "Scienze dell'ambiente e della natura" },
  { name: 'Scienze della comunicazione' },
  { name: 'Scienze della mediazione interlinguistica e interculturale' },
  { name: 'Scienze motorie' },
  { name: 'Storia e storie del mondo contemporaneo' },
  {
    name: "Tecniche della prevenzione nell'ambiente e nei luoghi di lavoro",
    campus: 'Como',
  },
  {
    name: 'Tecniche di fisiopatologia cardiocircolatoria e perfusione cardiovascolare',
    campus: 'Varese',
  },
  { name: 'Tecniche di laboratorio biomedico', campus: 'Varese' },
  {
    name: 'Tecniche di radiologia medica, per immagini e radioterapia',
    campus: 'Varese',
  },
  { name: "Tecniche digitali per l'ambiente e le costruzioni" },
]

const magistrale: Omit<DegreeProgram, 'id' | 'level'>[] = [
  { name: 'Biologia e sostenibilità' },
  { name: 'Biomedical Sciences' },
  { name: 'Biotechnology for the Bio-Based and Health Industry' },
  { name: 'Chimica' },
  { name: "Economia, diritto e finanza d'impresa" },
  { name: 'Fisica' },
  {
    name: 'Global Entrepreneurship Economics and Management (GEEM)',
  },
  { name: 'Hospitality for Sustainable Tourism Development' },
  { name: 'Informatica' },
  {
    name: "Ingegneria ambientale e per la sostenibilità degli ambienti di lavoro",
  },
  { name: 'Linguaggi e competenze per la formazione' },
  {
    name: 'Lingue moderne per la comunicazione e la cooperazione internazionale',
  },
  { name: 'Matematica' },
  { name: 'Scienze ambientali' },
  { name: 'Scienze delle attività motorie preventive ed adattate' },
  { name: 'Scienze e tecniche della comunicazione' },
]

const cicloUnico: Omit<DegreeProgram, 'id' | 'level'>[] = [
  { name: 'Farmacia' },
  { name: 'Giurisprudenza', campus: 'Como' },
  { name: 'Giurisprudenza', campus: 'Varese' },
  { name: 'Medicina e chirurgia' },
  { name: 'Odontoiatria e protesi dentaria' },
]

const CODE_BY_ID = degreeCodes as Record<string, string>

function withIds(
  items: Omit<DegreeProgram, 'id' | 'level'>[],
  level: DegreeLevel,
): DegreeProgram[] {
  return items.map((item) => {
    const id = `${level}-${slug(item.name, item.campus)}`
    return {
      ...item,
      level,
      id,
      code: CODE_BY_ID[id],
    }
  })
}

export const INSUBRIA_DEGREES: DegreeProgram[] = [
  ...withIds(triennale, 'triennale'),
  ...withIds(magistrale, 'magistrale'),
  ...withIds(cicloUnico, 'ciclo_unico'),
]

export function degreesByLevel(level: DegreeLevel): DegreeProgram[] {
  return INSUBRIA_DEGREES.filter((d) => d.level === level).sort((a, b) =>
    a.name.localeCompare(b.name, 'it'),
  )
}

export function findDegree(id: string): DegreeProgram | undefined {
  return INSUBRIA_DEGREES.find((d) => d.id === id)
}

export function degreeDisplayName(d: DegreeProgram): string {
  const base = d.campus ? `${d.name} (${d.campus})` : d.name
  return d.code ? `[${d.code}] ${base}` : base
}
