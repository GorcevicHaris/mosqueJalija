-- =====================================================================
-- 0002_rls.sql — prava pristupa (Row Level Security)
--   * svi (anon + authenticated) čitaju javni sadržaj (12 sadržajnih tabela)
--   * obavještenja: javno samo objavljeno = true; urednik vidi sve
--   * kategorije 'hutba' i 'predavanje' se ne mogu obrisati
--   * pisanje (insert/update/delete) samo urednik (private.je_urednik())
--   * tabela urednici: čita urednik, mijenja samo admin (private.je_admin())
-- =====================================================================

-- ---------- Pomoćne funkcije (šema "private", NIJE izložena preko API-ja) ----------
-- Funkcije su u šemi private, a ne public, da se ne bi mogle zvati preko /rest/v1/rpc
-- (Supabase advisor 0028/0029: security definer funkcija izvršiva za anon/authenticated).
-- anon/authenticated ipak trebaju USAGE + EXECUTE jer se funkcije izvršavaju unutar RLS politika.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- SECURITY DEFINER: čitaju public.urednici i auth.users bez RLS-a (inače bi politika na
-- tabeli urednici pozivala samu sebe). search_path je prazan, sve je potpuno kvalifikovano.
-- E-mail se uzima iz auth.users (izvor istine) i mora biti potvrđen — ne iz user_metadata.
create or replace function private.je_urednik()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.urednici u
    join auth.users au on lower(au.email) = u.email
    where au.id = auth.uid()
      and au.email_confirmed_at is not null
  );
$$;

create or replace function private.je_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.urednici u
    join auth.users au on lower(au.email) = u.email
    where au.id = auth.uid()
      and au.email_confirmed_at is not null
      and u.uloga = 'admin'
  );
$$;

comment on function private.je_urednik() is 'true ako je prijavljeni korisnik (potvrđen e-mail) u tabeli urednici.';
comment on function private.je_admin() is 'true ako je prijavljeni korisnik urednik sa ulogom admin.';

-- anon mora moći izvršiti je_urednik() jer je dio SELECT politike za obavjestenja.
revoke all on function private.je_urednik() from public;
revoke all on function private.je_admin() from public;
grant execute on function private.je_urednik() to anon, authenticated, service_role;
grant execute on function private.je_admin() to anon, authenticated, service_role;

-- ---------- Sadržajne tabele: privilegije + RLS ----------
-- Za svaku tabelu: SELECT za sve (anon + authenticated), INSERT/UPDATE/DELETE samo urednik.
-- Napisano petljom da bi sve tabele imale identične, provjerene politike.
do $$
declare
  t text;
  tabele text[] := array[
    'obavjestenja', 'galerija', 'imami', 'imami_bio', 'kategorije', 'serije', 'dove',
    'ajeti_hadisi', 'raspored', 'stranice_tekstovi', 'postavke', 'predavanja_ispravke'
  ];
begin
  foreach t in array tabele loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on table public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_citanje', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true)',
      t || '_citanje', t);

    execute format('drop policy if exists %I on public.%I', t || '_unos', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.je_urednik()))',
      t || '_unos', t);

    execute format('drop policy if exists %I on public.%I', t || '_izmjena', t);
    execute format(
      'create policy %I on public.%I for update to authenticated '
      'using ((select private.je_urednik())) with check ((select private.je_urednik()))',
      t || '_izmjena', t);

    execute format('drop policy if exists %I on public.%I', t || '_brisanje', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.je_urednik()))',
      t || '_brisanje', t);
  end loop;
end;
$$;

-- Obavještenja: javnost vidi samo objavljena; urednik vidi i skice.
drop policy if exists "obavjestenja_citanje" on public.obavjestenja;
create policy "obavjestenja_citanje" on public.obavjestenja
  for select to anon, authenticated
  using (objavljeno or (select private.je_urednik()));

-- Kategorije 'hutba' i 'predavanje' koristi kod sajta — ne smiju se obrisati.
drop policy if exists "kategorije_brisanje" on public.kategorije;
create policy "kategorije_brisanje" on public.kategorije
  for delete to authenticated
  using ((select private.je_urednik()) and slug not in ('hutba', 'predavanje'));

-- ---------- urednici (anon nema nikakav pristup) ----------
revoke all on table public.urednici from anon, authenticated;
grant select, insert, update, delete on table public.urednici to authenticated;
alter table public.urednici enable row level security;

drop policy if exists "urednici_citanje" on public.urednici;
create policy "urednici_citanje" on public.urednici
  for select to authenticated using ((select private.je_urednik()));

drop policy if exists "urednici_unos" on public.urednici;
create policy "urednici_unos" on public.urednici
  for insert to authenticated with check ((select private.je_admin()));

drop policy if exists "urednici_izmjena" on public.urednici;
create policy "urednici_izmjena" on public.urednici
  for update to authenticated
  using ((select private.je_admin())) with check ((select private.je_admin()));

drop policy if exists "urednici_brisanje" on public.urednici;
create policy "urednici_brisanje" on public.urednici
  for delete to authenticated using ((select private.je_admin()));
