-- =====================================================================
-- 0006_aktivnosti_citati.sql — objave efendije
--   * aktivnosti — kratke objave sa tekstom i/ili slikama (/aktivnosti, blok na početnoj)
--   * citati     — citati, hadisi, ajeti i pouke (/citati, "Citat dana" na početnoj)
-- Javnost čita samo objavljeno = true; urednik (private.je_urednik()) vidi i skice i jedini piše.
-- Slike su javni URL-ovi iz postojećeg bucketa "slike" (0003_storage.sql) — bez nove storage politike.
-- Pokretati POSLIJE 0001–0005. Idempotentno (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
-- Bez početnih podataka: prazne tabele = stranice prikazuju prazno stanje.
-- =====================================================================

-- ---------- Aktivnosti (objave sa tekstom i/ili slikama) ----------
create table if not exists public.aktivnosti (
  id          uuid primary key default gen_random_uuid(),
  naslov      text check (naslov is null or length(btrim(naslov)) between 1 and 200),
  tekst       text check (tekst is null or length(tekst) <= 5000),
  slike       text[] not null default '{}'::text[]
              check (cardinality(slike) <= 10 and array_position(slike, null) is null),
  datum       timestamptz not null default now(),
  objavljeno  boolean not null default true,
  autor       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- objava mora imati tekst ili bar jednu sliku
  constraint aktivnosti_sadrzaj_check
    check ((tekst is not null and length(btrim(tekst)) > 0) or cardinality(slike) > 0)
);

create index if not exists aktivnosti_datum_idx on public.aktivnosti (datum desc, id desc);
create index if not exists aktivnosti_autor_idx on public.aktivnosti (autor);

comment on table public.aktivnosti is 'Objave aktivnosti džemata (tekst i/ili do 10 slika). Prikaz: /aktivnosti i početna.';
comment on column public.aktivnosti.slike is 'Javni URL-ovi slika iz storage bucketa "slike", redom prikaza (najviše 10).';

-- ---------- Citati, hadisi, ajeti i pouke ----------
create table if not exists public.citati (
  id          uuid primary key default gen_random_uuid(),
  tekst       text not null check (length(btrim(tekst)) between 1 and 3000),
  izvor       text check (izvor is null or length(btrim(izvor)) between 1 and 300), -- npr. "Buhari", "El-Bekare, 286", autor
  vrsta       text not null default 'citat' check (vrsta in ('citat', 'hadis', 'ajet', 'pouka')),
  arapski     text check (arapski is null or length(arapski) <= 3000),
  slika       text check (slika is null or length(slika) <= 600),
  datum       timestamptz not null default now(),
  objavljeno  boolean not null default true,
  autor       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists citati_datum_idx on public.citati (datum desc, id desc);
create index if not exists citati_autor_idx on public.citati (autor);

comment on table public.citati is 'Citati, hadisi, ajeti i pouke (vrsta). Prikaz: /citati; najnoviji objavljeni = "Citat dana" na početnoj.';
comment on column public.citati.slika is 'Opciona ilustracija — javni URL iz storage bucketa "slike".';

-- ---------- Okidači za updated_at ----------
drop trigger if exists aktivnosti_updated_at on public.aktivnosti;
create trigger aktivnosti_updated_at before update on public.aktivnosti
  for each row execute function public.postavi_updated_at();

drop trigger if exists citati_updated_at on public.citati;
create trigger citati_updated_at before update on public.citati
  for each row execute function public.postavi_updated_at();

-- ---------- Privilegije + RLS (obrazac iz 0002_rls.sql / 0005) ----------
-- Razlika: čitanje je kao kod obavjestenja — javno samo objavljeno, urednik vidi i skice.
do $$
declare
  t text;
  tabele text[] := array['aktivnosti', 'citati'];
begin
  foreach t in array tabele loop
    execute format('revoke all on table public.%I from anon, authenticated', t);
    execute format('grant select on table public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on table public.%I to authenticated', t);
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t || '_citanje', t);
    execute format(
      'create policy %I on public.%I for select to anon, authenticated '
      'using (objavljeno or (select private.je_urednik()))',
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
