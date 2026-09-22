/**
 * Calendari pubblici Cineca — A.A. 2026/2027
 * Fonte: pagine corso su uninsubria.it (sezione Orario delle lezioni)
 */

export type PublicCalendar = {
  linkId: string
  label: string
  year: number
  campus?: string
  /** Path pagina corso Uninsubria da cui è stato estratto */
  sourcePath: string
  url: string
}

export type DegreeCalendars = {
  degreeIds: string[]
  academicYear: string
  calendars: PublicCalendar[]
}

const CINECA = 'https://unins.prod.up.cineca.it/calendarioPubblico/linkCalendarioId='

function cal(
  linkId: string,
  label: string,
  year: number,
  sourcePath: string,
  campus?: string,
): PublicCalendar {
  return {
    linkId,
    label,
    year,
    campus,
    sourcePath,
    url: `${CINECA}${linkId}`,
  }
}

/** Triennale Informatica Varese (+ slot Como per 2°/3°) — pagina /informatica */
const INFORMATICA_VARESE: DegreeCalendars = {
  degreeIds: ['triennale-informatica-varese'],
  academicYear: '2026/2027',
  calendars: [
    cal(
      '6a71a88e0b02d70019eb3983',
      'I° anno - I° semestre Varese',
      1,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Varese',
    ),
    cal(
      '6a71a8c57a011e0019803ed6',
      'II° anno - I° semestre Varese',
      2,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Varese',
    ),
    cal(
      '6a71a92111ef0b00197b3421',
      'II° anno - I° semestre Como',
      2,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Como',
    ),
    cal(
      '6a71a9ef1d1e660014fb0aef',
      'III° anno - I° semestre Varese',
      3,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Varese',
    ),
    cal(
      '6a71aa3f7a011e0019803fbc',
      'III° anno - I° semestre Como',
      3,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Como',
    ),
  ],
}

/** Triennale Informatica Como — pagina /informatica-como */
const INFORMATICA_COMO: DegreeCalendars = {
  degreeIds: ['triennale-informatica-como'],
  academicYear: '2026/2027',
  calendars: [
    cal(
      '6a71a7df9384ea001988c35a',
      'I° anno - I° semestre',
      1,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica-como',
      'Como',
    ),
    // Anni 2–3 Como sono pubblicati anche sulla pagina Varese
    cal(
      '6a71a92111ef0b00197b3421',
      'II° anno - I° semestre Como',
      2,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Como',
    ),
    cal(
      '6a71aa3f7a011e0019803fbc',
      'III° anno - I° semestre Como',
      3,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica',
      'Como',
    ),
  ],
}

/** Magistrale Informatica — pagina /informatica-0 (F08R) */
const INFORMATICA_LM: DegreeCalendars = {
  degreeIds: ['magistrale-informatica'],
  academicYear: '2026/2027',
  calendars: [
    cal(
      '6a71aaa911ef0b00197b3594',
      'I° anno - I° semestre',
      1,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica-0',
    ),
    cal(
      '6a71aae17a011e0019804000',
      'II° anno - I° semestre',
      2,
      '/formazione/offerta-formativa/corsi-di-laurea/informatica-0',
    ),
  ],
}

export const DEGREE_CALENDARS: DegreeCalendars[] = [
  INFORMATICA_VARESE,
  INFORMATICA_COMO,
  INFORMATICA_LM,
]

export function calendarsForDegree(degreeId: string): DegreeCalendars | null {
  return DEGREE_CALENDARS.find((d) => d.degreeIds.includes(degreeId)) ?? null
}
