/**
 * Scrapa i link calendario Cineca dalle pagine corso Uninsubria.
 * Uso: npx tsx scripts/scrape-calendars.ts [filtro]
 * Esempio: npx tsx scripts/scrape-calendars.ts informatica
 */
const BASE = 'https://www.uninsubria.it'
const AJAX = `${BASE}/views/ajax`
const COURSE_RE =
  /href="(\/formazione\/offerta-formativa\/corsi-di-laurea\/[^"?#]+)"/g
const CINECA_RE =
  /href="https:\/\/unins\.prod\.up\.cineca\.it\/calendarioPubblico\/linkCalendarioId=([a-f0-9]+)"[^>]*>(?:<[^>]+>)*([^<]+)/gi
const AY_RE = /Anno Accademico (\d{4})\/(\d{4})/
const H1_RE = /<h1[^>]*>\s*([^<]+?)\s*<\/h1>/i

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
  const name = H1_RE.exec(html)?.[1]?.trim() ?? path
  const ay = AY_RE.exec(html)
  const academicYear = ay ? `${ay[1]}/${ay[2]}` : '?'
  const calendars: Array<{ linkId: string; label: string }> = []
  for (const m of html.matchAll(CINECA_RE)) {
    calendars.push({
      linkId: m[1],
      label: m[2].trim().replace(/&amp;/g, '&').replace(/&#039;/g, "'"),
    })
  }
  return { path, name, academicYear, calendars }
}

const filter = (process.argv[2] ?? '').toLowerCase()

const urls = (await courseUrls()).filter((u) =>
  filter ? u.toLowerCase().includes(filter) : true,
)

console.log(`Pagine: ${urls.length}`)
for (const url of urls) {
  try {
    const page = await scrapePage(url)
    if (page.calendars.length === 0) continue
    console.log(`\n## ${page.name} (${page.academicYear})`)
    console.log(page.path)
    for (const c of page.calendars) {
      console.log(`  - ${c.label}: ${c.linkId}`)
    }
  } catch (e) {
    console.error(url, e)
  }
  await new Promise((r) => setTimeout(r, 250))
}
