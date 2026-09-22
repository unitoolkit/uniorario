-- Fix rapido: esegui questo se vedi "permission denied for table courses"
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.courses to anon, authenticated;
grant select, insert, update, delete on public.lessons to anon, authenticated;
