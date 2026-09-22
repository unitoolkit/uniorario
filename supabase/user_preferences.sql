-- Aggiungi solo la tabella preferenze (se lo schema base è già applicato)
create table if not exists public.user_preferences (
  user_id text primary key,
  degree_id text,
  calendar_ids text[] not null default '{}',
  selected_subjects text[] not null default '{}',
  setup_complete boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

drop policy if exists "user_preferences_select" on public.user_preferences;
drop policy if exists "user_preferences_insert" on public.user_preferences;
drop policy if exists "user_preferences_update" on public.user_preferences;
drop policy if exists "user_preferences_delete" on public.user_preferences;

create policy "user_preferences_select" on public.user_preferences for select using (true);
create policy "user_preferences_insert" on public.user_preferences for insert with check (true);
create policy "user_preferences_update" on public.user_preferences for update using (true);
create policy "user_preferences_delete" on public.user_preferences for delete using (true);

grant select, insert, update, delete on public.user_preferences to anon, authenticated;
