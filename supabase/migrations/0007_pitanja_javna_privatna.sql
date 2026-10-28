-- =====================================================================
-- 0007_pitanja_javna_privatna.sql — "Pitaj imama": javno pitanje ili privatna poruka
--   * javno = true  → pitanje se ODMAH vidi na /pitaj-imama (i prije odgovora); ime nije obavezno
--                     i prikazuje se samo ako ga je pitalac upisao. Urednik ga može sakriti (skriveno).
--   * javno = false → privatna poruka: vide je samo urednici; ime je OBAVEZNO (najmanje 2 znaka),
--                     e-mail nije. Kao i do sada, urednik može objaviti ODGOVOR (objavljeno = true) —
--                     tada se pitanje i odgovor prikazuju BEZ imena.
--   * pogled pitanja_javna (security_invoker): id, ime (samo kod javnih), pitanje, odgovor, odgovorio,
--     odgovoreno_at, created_at, javno — nikad e-mail, nikad ime privatnog pitanja.
-- Kompatibilnost: postojeća pitanja dobijaju javno = false (privatna); ona koja su stigla anonimno
-- (bez imena) prije ove migracije ostaju ispravna (izuzetak u provjeri imena po created_at), pa se na
-- njih i dalje može odgovoriti i objaviti odgovor.
-- Obrazac iz 0004 ostaje: anon smije samo INSERT dozvoljenih kolona (sada i `javno`), nikad
-- skriveno/odgovor/objavljeno/odgovorio; okidač ogranici_javne_unose (anti-spam) ih dodatno resetuje.
-- Pokretati POSLIJE 0001–0006. Idempotentno.
-- =====================================================================

-- ---------- Kolone ----------
alter table public.pitanja add column if not exists javno boolean not null default false;
alter table public.pitanja add column if not exists skriveno boolean not null default false;

-- Ime za javni prikaz: samo kod javnog pitanja, prazno → null. Generisana kolona, pa anon može čitati
-- nju (za pogled), a nikad kolonu `ime` (koja kod privatnih poruka ostaje tajna).
alter table public.pitanja add column if not exists ime_javno text
  generated always as (case when javno then nullif(btrim(ime), '') end) stored;

comment on column public.pitanja.javno is 'true = javno pitanje (odmah na sajtu, ime nije obavezno); false = privatna poruka (vide je samo urednici).';
comment on column public.pitanja.skriveno is 'Urednik je sakrio pitanje sa sajta (npr. neprikladno ili duplikat).';
comment on column public.pitanja.ime_javno is 'Ime za prikaz na sajtu (samo javna pitanja; generisano iz ime).';

-- ---------- Ime obavezno za privatnu poruku ----------
-- Pitanja primljena prije ove migracije (anonimna privatna) su izuzeta: vrijeme primjene se upisuje
-- u samu provjeru, da bi ostala ispravna i kod kasnijih izmjena (odgovor, objava).
do $$
begin
  alter table public.pitanja drop constraint if exists pitanja_ime_privatno_check;
  execute format(
    'alter table public.pitanja add constraint pitanja_ime_privatno_check check ('
    'javno or (ime is not null and length(btrim(ime)) >= 2) or created_at < %L::timestamptz)',
    now()
  );
end;
$$;

create index if not exists pitanja_sajt_idx on public.pitanja (created_at desc)
  where not skriveno and (javno or (objavljeno and odgovor is not null));

-- ---------- Anti-spam okidač (kao 0004) + interna polja pitanja uključujući `skriveno` ----------
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
    new.skriveno := false;
    new.javno := coalesce(new.javno, false);
  end if;
  return new;
end;
$$;

revoke all on function public.ogranici_javne_unose() from public, anon, authenticated;

-- ---------- Privilegije po koloni ----------
-- (revoke + grant iz 0004 ponovo, da je stanje isto bez obzira na redoslijed pokretanja)
revoke insert on table public.pitanja from anon, authenticated;
grant insert (ime, email, pitanje, javno) on table public.pitanja to anon, authenticated;

revoke select on table public.pitanja from anon;
grant select (id, pitanje, odgovor, odgovorio, odgovoreno_at, objavljeno, created_at, javno, skriveno, ime_javno)
  on table public.pitanja to anon;
-- urednici (authenticated + RLS) i dalje: select, update, delete (0004)

-- ---------- RLS ----------
drop policy if exists "pitanja_slanje" on public.pitanja;
create policy "pitanja_slanje" on public.pitanja
  for insert to anon, authenticated
  with check (objavljeno = false and odgovor is null and skriveno = false);

-- anon: javna (nesakrivena) pitanja — i bez odgovora — i objavljeni odgovori na privatna pitanja
drop policy if exists "pitanja_javna_citanje" on public.pitanja;
create policy "pitanja_javna_citanje" on public.pitanja
  for select to anon
  using (not skriveno and (javno or (objavljeno and odgovor is not null)));

-- ---------- Javni pogled (bez e-maila; ime samo kod javnih pitanja) ----------
-- Kolone se mijenjaju (novi redoslijed), pa se pogled pravi iznova.
drop view if exists public.pitanja_javna;
create view public.pitanja_javna
with (security_invoker = true)
as
  select id,
         ime_javno as ime,
         pitanje,
         odgovor,
         odgovorio,
         odgovoreno_at,
         created_at,
         javno
  from public.pitanja
  where not skriveno
    and (javno or (objavljeno and odgovor is not null));

comment on view public.pitanja_javna is 'Javna pitanja (odmah, i bez odgovora; ime samo ako ga je pitalac upisao) i objavljeni odgovori na privatna pitanja (bez imena). Nikad e-mail. Javno čitljivo.';

revoke all on table public.pitanja_javna from anon, authenticated;
grant select on table public.pitanja_javna to anon, authenticated;
