-- UniOrario — schema Supabase
-- Esegui questo SQL nell'editor SQL del progetto Supabase

create extension if not exists "pgcrypto";

-- Corsi (es. "Analisi Matematica I")
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  year integer,
  academic_year text,
  color text not null default '#2f7bff',
  created_at timestamptz not null default now()
);

-- Slot ricorrenti settimanali
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  owner_id text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = lunedì
  start_time time not null,
  end_time time not null,
  room text,
  professor text,
  lesson_type text not null default 'Lezione',
  created_at timestamptz not null default now(),
  constraint lessons_time_order check (end_time > start_time)
);

create index if not exists idx_courses_owner on public.courses (owner_id);
create index if not exists idx_lessons_owner on public.lessons (owner_id);
create index if not exists idx_lessons_course on public.lessons (course_id);
create index if not exists idx_lessons_day on public.lessons (day_of_week);

alter table public.courses enable row level security;
alter table public.lessons enable row level security;

-- Accesso anonimo filtrato lato client tramite owner_id (MVP).
-- Per produzione: passa ad auth.uid() e restringi le policy.
drop policy if exists "courses_select" on public.courses;
drop policy if exists "courses_insert" on public.courses;
drop policy if exists "courses_update" on public.courses;
drop policy if exists "courses_delete" on public.courses;

create policy "courses_select" on public.courses for select using (true);
create policy "courses_insert" on public.courses for insert with check (true);
create policy "courses_update" on public.courses for update using (true);
create policy "courses_delete" on public.courses for delete using (true);

drop policy if exists "lessons_select" on public.lessons;
drop policy if exists "lessons_insert" on public.lessons;
drop policy if exists "lessons_update" on public.lessons;
drop policy if exists "lessons_delete" on public.lessons;

create policy "lessons_select" on public.lessons for select using (true);
create policy "lessons_insert" on public.lessons for insert with check (true);
create policy "lessons_update" on public.lessons for update using (true);
create policy "lessons_delete" on public.lessons for delete using (true);

-- Permessi API (senza questi l'anon key riceve "permission denied")
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.courses to anon, authenticated;
grant select, insert, update, delete on public.lessons to anon, authenticated;
