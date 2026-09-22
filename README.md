# UniOrario

Web app per gestire e visualizzare l'orario universitario.

Ispirata a [UniApplication](../UniApplication) (viste settimana/mese, prossima lezione, gestione corsi) con lo stile visuale di [UniToolkit](../unitoolkit.github.io) (Syne + Outfit, navy/royal, sfondo paper).

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- Supabase (PostgreSQL)

## Setup

1. Copia le variabili d'ambiente:

```bash
cp .env.example .env
```

Compila `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.

2. Nell'editor SQL di Supabase esegui lo schema:

[`supabase/schema.sql`](supabase/schema.sql)

3. Avvia in locale:

```bash
npm install
npm run dev
```

## Funzionalità

- Vista settimanale con selezione giorno e dettaglio lezioni
- Vista mensile con indicatori colore per corso
- Card “in corso / prossima lezione”
- CRUD corsi e slot orari ricorrenti (giorno + orario + aula + docente)

I dati sono isolati per dispositivo tramite un `owner_id` salvato in `localStorage`.
