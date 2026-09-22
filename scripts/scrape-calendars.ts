/**
 * Scrapa i link calendario Cineca e i codici CdL dalle pagine Uninsubria.
 * Uso: npx tsx scripts/scrape-calendars.ts [filtro]
 * Scrive scripts/scraped-calendars.json
 */
import fs from 'node:fs'

const BASE = 'https://www.uninsubria.it'
const AJAX = `${BASE}/views/ajax`
const COURSE_RE =
  /href="(\/formazione\/offerta-formativa\/corsi-di-laurea\/[^"?#]+)"/g
const CINECA_RE =
  /href="https:\/\/unins\.prod\.up\.cineca\.it\/calendarioPubblico\/linkCalendarioId=([a-f0-9]+)"[^>]*>(?:<[^>]+>)*([^<]+)/gi
const AY_RE = /Anno Accademico (\d{4})\/(\d{4})/
const H1_RE = /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/i
const TITLE_RE = /<title[^>]*>\s*([^<]+?)\s*<\/title>/i
/** Es. F04R, L006, A18R */
const CODE_RE = /\[([A-Z]\d{2,3}[A-Z]?)\]/

function clean(s: string) {
  return s
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function courseUrls(): Promise<string[]> {
  const res = await fetch(AJAX, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'UniOrario-Scraper/1.0',
    },
    body: new URLSearchParams({
      view_name: 'corsi_di_laurea_e_post_laurea',
      view_display_id: 'block_1',
    }),
  })
  if (!res.ok) throw new Error(`ajax ${res.status}`)
  const data = (await res.json()) as Array<{ data?: string }>
  const urls = new Set<string>()
  for (const cmd of data) {
    if (typeof cmd.data !== 'string') continue
    for (const m of cmd.data.matchAll(COURSE_RE)) urls.add(m[1])
  }
  return [...urls]
}

async function scrapePage(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': 'UniOrario-Scraper/1.0' },
  })
  if (!res.ok) throw new Error(`${path} ${res.status}`)
  const html = await res.text()
  const name = clean(H1_RE.exec(html)?.[1] ?? path)
  const title = clean(TITLE_RE.exec(html)?.[1] ?? '')
  const code =
    CODE_RE.exec(title)?.[1] ?? CODE_RE.exec(name)?.[1] ?? undefined
  const ay = AY_RE.exec(html)
  const academicYear = ay ? `${ay[1]}/${ay[2]}` : '?'
  const calendars: Array<{ id: string; label: string }> = []
  const seen = new Set<string>()
  for (const m of html.matchAll(CINECA_RE)) {
    const id = m[1]
    if (seen.has(id)) continue
    seen.add(id)
    calendars.push({
      id,
      label: clean(m[2]),
    })
  }
  return { path, name, code, ay: academicYear, calendars }
}

const filter = (process.argv[2] ?? '').toLowerCase()

const urls = (await courseUrls()).filter((u) =>
  filter ? u.toLowerCase().includes(filter) : true,
)

console.log(`Pagine: ${urls.length}`)
const pages: Array<{
  path: string
  name: string
  code?: string
  ay: string
  calendars: Array<{ id: string; label: string }>
}> = []

for (const url of urls) {
  try {
    const page = await scrapePage(url)
    if (page.calendars.length === 0) {
      console.log(`skip (no calendars): ${url}`)
      continue
    }
    pages.push(page)
    const codeLabel = page.code ? `[${page.code}] ` : ''
    console.log(
      `\n## ${codeLabel}${page.name} (${page.ay}) — ${page.calendars.length} cal`,
    )
    console.log(page.path)
    for (const c of page.calendars) {
      console.log(`  - ${c.label}: ${c.id}`)
    }
  } catch (e) {
    console.error(url, e)
  }
  await new Promise((r) => setTimeout(r, 250))
}

pages.sort((a, b) => a.path.localeCompare(b.path))
fs.writeFileSync(
  'scripts/scraped-calendars.json',
  `${JSON.stringify(pages, null, 2)}\n`,
)
console.log(`\nWrote scripts/scraped-calendars.json (${pages.length} packs)`)
