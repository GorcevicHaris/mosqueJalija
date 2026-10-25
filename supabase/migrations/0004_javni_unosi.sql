-- =====================================================================
-- 0004_javni_unosi.sql — poruke, prijave i pitanja koje šalju posjetioci sajta
--   * anon (i authenticated) smije SAMO INSERT, i to samo "javnih" kolona (privilegije po
--     koloni) — status, procitano, odgovor, objavljeno… se ne mogu postaviti spolja
--   * čitanje/izmjena/brisanje: samo urednici
--   * pitanja: javno se vide samo objavljena + odgovorena, preko pogleda public.pitanja_javna
--     (security_invoker, bez imena i e-maila)
--   * anti-spam: ograničenja dužine + okidač koji ograničava broj poruka po satu
-- Javne forme šalju INSERT bez "return=representation" (supabase-js: .insert(...) bez .select()).
-- =====================================================================

-- ---------- Tabele ----------
create table if not exists public.poruke (
  id          uuid primary key default gen_random_uuid(),
  ime         text not null check (length(btrim(ime)) between 1 and 100),
  email       text not null check (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  tema        text not null default 'Opšte' check (length(btrim(tema)) between 1 and 60),
  poruka      text not null check (length(btrim(poruka)) between 2 and 5000),
  procitano   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists poruke_created_idx on public.poruke (created_at desc);

create table if not exists public.prijave (
  id           uuid primary key default gen_random_uuid(),
  ime_prezime  text not null check (length(btrim(ime_prezime)) between 2 and 120),
  roditelj     text check (roditelj is null or length(roditelj) <= 120),
  telefon      text not null check (length(btrim(telefon)) between 6 and 40),
  email        text check (email is null or (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  program      text not null check (length(btrim(program)) between 1 and 120),
  uzrast       integer check (uzrast is null or uzrast between 3 and 99),
  napomena     text check (napomena is null or length(napomena) <= 2000),
  status       text not null default 'nova' check (status in ('nova', 'kontaktiran', 'upisan', 'odbijen')),
  biljeska     text check (biljeska is null or length(biljeska) <= 2000), -- interna bilješka urednika
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists prijave_created_idx on public.prijave (created_at desc);

create table if not exists public.pitanja (
  id             uuid primary key default gen_random_uuid(),
  ime            text check (ime is null or length(ime) <= 100),
  email          text check (email is null or (length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  pitanje        text not null check (length(btrim(pitanje)) between 10 and 3000),
  odgovor        text check (odgovor is null or length(odgovor) <= 20000),
  odgovorio      text check (odgovorio is null or length(odgovorio) <= 120), -- ime za prikaz, npr. "Hfz. Admir ef. Jašarević"
  odgovoreno_at  timestamptz,
  objavljeno     boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists pitanja_created_idx on public.pitanja (created_at desc);
create index if not exists pitanja_javna_idx on public.pitanja (odgovoreno_at desc) where objavljeno and odgovor is not null;

drop trigger if exists prijave_updated_at on public.prijave;
create trigger prijave_updated_at before update on public.prijave
  for each row execute function public.postavi_updated_at();

drop trigger if exists pitanja_updated_at on public.pitanja;
create trigger pitanja_updated_at before update on public.pitanja
  for each row execute function public.postavi_updated_at();

-- ---------- Anti-spam: najviše 5 unosa po e-mailu (ili telefonu) na sat, 60 ukupno na sat po tabeli ----------
-- SECURITY DEFINER jer anon ne smije čitati ove tabele (a mora se prebrojati).
create or replace function public.ogranici_javne_unose()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  po_adresi integer := 0;
  ukupno    integer := 0;
  kontakt   text;
begin
  -- Ograničenje važi samo za zahtjeve preko API-ja (anon/authenticated). Direktan SQL
  -- (postgres, service_role, uvoz podataka) i urednici (npr. ručni unos prijave) nisu ograničeni.
  if coalesce(auth.jwt() ->> 'role', '') not in ('anon', 'authenticated')
     or (select private.je_urednik()) then
    return new;
  end if;

  if tg_table_name = 'poruke' then
    select count(*) into ukupno from public.poruke where created_at > now() - interval '1 hour';
    kontakt := lower(new.email);
    select count(*) into po_adresi from public.poruke
      where lower(email) = kontakt and created_at > now() - interval '1 hour';
  elsif tg_table_name = 'prijave' then
    select count(*) into ukupno from public.prijave where created_at > now() - interval '1 hour';
    kontakt := regexp_replace(new.telefon, '\D', '', 'g');
    select count(*) into po_adresi from public.prijave
      where regexp_replace(telefon, '\D', '', 'g') = kontakt and created_at > now() - interval '1 hour';
  elsif tg_table_name = 'pitanja' then
    select count(*) into ukupno from public.pitanja where created_at > now() - interval '1 hour';
    if new.email is not null then
      kontakt := lower(new.email);
      select count(*) into po_adresi from public.pitanja
        where lower(email) = kontakt and created_at > now() - interval '1 hour';
    end if;
  end if;

  if po_adresi >= 5 or ukupno >= 60 then
    raise exception 'Previše poruka u kratkom vremenu. Pokušajte ponovo kasnije.'
      using errcode = 'P0001', hint = 'ogranicenje_slanja';
  end if;

  -- javni unos nikad ne može postaviti interna polja (dodatna zaštita uz privilegije po koloni)
  if tg_table_name = 'poruke' then
    new.procitano := false;
  elsif tg_table_name = 'prijave' then
    new.status := 'nova';
    new.biljeska := null;
  elsif tg_table_name = 'pitanja' then
    new.odgovor := null;
    new.odgovorio := null;
    new.odgovoreno_at := null;
    new.objavljeno := false;
  end if;
  return new;
end;
$$;

-- Okidačka funkcija se ne poziva preko /rpc (vraća trigger), ali joj ionako uklanjamo EXECUTE.
revoke all on function public.ogranici_javne_unose() from public, anon, authenticated;

drop trigger if exists poruke_ogranicenje on public.poruke;
create trigger poruke_ogranicenje before insert on public.poruke
  for each row execute function public.ogranici_javne_unose();

drop trigger if exists prijave_ogranicenje on public.prijave;
create trigger prijave_ogranicenje before insert on public.prijave
  for each row execute function public.ogranici_javne_unose();

drop trigger if exists pitanja_ogranicenje on public.pitanja;
create trigger pitanja_ogranicenje before insert on public.pitanja
  for each row execute function public.ogranici_javne_unose();

-- Odgovor na pitanje: automatski upiši vrijeme odgovora.
create or replace function public.pitanja_vrijeme_odgovora()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.odgovor is not null and btrim(new.odgovor) <> ''
     and (old.odgovor is distinct from new.odgovor or new.odgovoreno_at is null) then
    new.odgovoreno_at := coalesce(new.odgovoreno_at, now());
  end if;
  if new.odgovor is null or btrim(new.odgovor) = '' then
    new.odgovor := null;
    new.odgovoreno_at := null;
    new.objavljeno := false; -- neodgovoreno pitanje se ne može objaviti
  end if;
  return new;
end;
$$;

drop trigger if exists pitanja_odgovor on public.pitanja;
create trigger pitanja_odgovor before update on public.pitanja
  for each row execute function public.pitanja_vrijeme_odgovora();

-- ---------- Privilegije (po kolonama) ----------
revoke all on table public.poruke, public.prijave, public.pitanja from anon, authenticated;

grant insert (ime, email, tema, poruka) on table public.poruke to anon, authenticated;
grant insert (ime_prezime, roditelj, telefon, email, program, uzrast, napomena) on table public.prijave to anon, authenticated;
grant insert (ime, email, pitanje) on table public.pitanja to anon, authenticated;

-- urednici (authenticated + RLS ispod) čitaju i mijenjaju
grant select, update, delete on table public.poruke, public.prijave, public.pitanja to authenticated;

-- anon smije čitati samo bezbjedne kolone pitanja (za pogled pitanja_javna)
grant select (id, pitanje, odgovor, odgovorio, odgovoreno_at, objavljeno, created_at) on table public.pitanja to anon;

-- ---------- RLS ----------
alter table public.poruke  enable row level security;
alter table public.prijave enable row level security;
alter table public.pitanja enable row level security;

-- poruke
drop policy if exists "poruke_slanje" on public.poruke;
create policy "poruke_slanje" on public.poruke
  for insert to anon, authenticated
  with check (procitano = false);

drop policy if exists "poruke_citanje" on public.poruke;
create policy "poruke_citanje" on public.poruke
  for select to authenticated using ((select private.je_urednik()));

drop policy if exists "poruke_izmjena" on public.poruke;
create policy "poruke_izmjena" on public.poruke
  for update to authenticated
  using ((select private.je_urednik())) with check ((select private.je_urednik()));

drop policy if exists "poruke_brisanje" on public.poruke;
create policy "poruke_brisanje" on public.poruke
  for delete to authenticated using ((select private.je_urednik()));

-- prijave
drop policy if exists "prijave_slanje" on public.prijave;
create policy "prijave_slanje" on public.prijave
  for insert to anon, authenticated
  with check (status = 'nova' and biljeska is null);

drop policy if exists "prijave_citanje" on public.prijave;
create policy "prijave_citanje" on public.prijave
  for select to authenticated using ((select private.je_urednik()));

drop policy if exists "prijave_izmjena" on public.prijave;
create policy "prijave_izmjena" on public.prijave
  for update to authenticated
  using ((select private.je_urednik())) with check ((select private.je_urednik()));

drop policy if exists "prijave_brisanje" on public.prijave;
create policy "prijave_brisanje" on public.prijave
  for delete to authenticated using ((select private.je_urednik()));

-- pitanja
drop policy if exists "pitanja_slanje" on public.pitanja;
create policy "pitanja_slanje" on public.pitanja
  for insert to anon, authenticated
  with check (objavljeno = false and odgovor is null);

-- anon: samo objavljena i odgovorena (kolone ograničene privilegijama iznad)
drop policy if exists "pitanja_javna_citanje" on public.pitanja;
create policy "pitanja_javna_citanje" on public.pitanja
  for select to anon
  using (objavljeno and odgovor is not null);

-- authenticated: samo urednici (prijavljeni ne-urednik ne vidi tuđe e-mailove)
drop policy if exists "pitanja_citanje" on public.pitanja;
create policy "pitanja_citanje" on public.pitanja
  for select to authenticated using ((select private.je_urednik()));

drop policy if exists "pitanja_izmjena" on public.pitanja;
create policy "pitanja_izmjena" on public.pitanja
  for update to authenticated
  using ((select private.je_urednik())) with check ((select private.je_urednik()));

drop policy if exists "pitanja_brisanje" on public.pitanja;
create policy "pitanja_brisanje" on public.pitanja
  for delete to authenticated using ((select private.je_urednik()));

-- ---------- Javni pogled na pitanja (bez imena i e-maila) ----------
create or replace view public.pitanja_javna
with (security_invoker = true)
as
  select id, pitanje, odgovor, odgovorio, odgovoreno_at, created_at
  from public.pitanja
  where objavljeno and odgovor is not null;

comment on view public.pitanja_javna is 'Objavljena pitanja sa odgovorom, bez ličnih podataka. Javno čitljivo.';

revoke all on table public.pitanja_javna from anon, authenticated;
grant select on table public.pitanja_javna to anon, authenticated;
