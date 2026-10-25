-- =====================================================================
-- 0001_sadrzaj.sql — tabele sa sadržajem sajta Džamije na Jaliji
-- Postgres 15+ (Supabase). Pokretati redom: 0001 → 0002 → 0003 → seed.sql
-- Sve je idempotentno (IF NOT EXISTS / OR REPLACE), pa ponovno pokretanje ne smeta.
-- =====================================================================

-- ---------- updated_at okidač ----------
create or replace function public.postavi_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Obavještenja i objave ----------
create table if not exists public.obavjestenja (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique
              check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 120),
  tip         text not null default 'obavjestenje'
              check (tip in ('obavjestenje', 'objava')),
  naslov      text not null check (length(btrim(naslov)) between 1 and 300),
  datum       date not null default current_date,
  kategorija  text not null default 'Ostalo' check (length(btrim(kategorija)) between 1 and 60),
  sazetak     text not null default '',
  sadrzaj     text[] not null default '{}'::text[],
  slika       text,
  objavljeno  boolean not null default true,
  placeholder boolean not null default false,
  autor       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists obavjestenja_datum_idx on public.obavjestenja (datum desc);
create index if not exists obavjestenja_autor_idx on public.obavjestenja (autor);

comment on table public.obavjestenja is 'Obavještenja (tip=obavjestenje) i objave (tip=objava). sadrzaj = paragrafi.';
comment on column public.obavjestenja.slika is 'Javni URL slike iz storage bucketa "slike" (ili lokalna putanja /images/...).';
comment on column public.obavjestenja.placeholder is 'true = primjer sadržaja, prikazuje se bedž "Primjer" i noindex.';

-- ---------- Galerija ----------
create table if not exists public.galerija (
  id          uuid primary key default gen_random_uuid(),
  src         text not null check (length(btrim(src)) > 0),
  alt         text not null default '',
  opis        text,
  izvor       text,
  licenca     text,
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists galerija_redoslijed_idx on public.galerija (redoslijed, created_at);

-- ---------- Biografije imama (ključ = slug iz data/imami.json) ----------
create table if not exists public.imami_bio (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  uloga       text,
  bio         text,
  slika       text,
  potvrdjeno  boolean not null default false,
  izvori      jsonb not null default '[]'::jsonb check (jsonb_typeof(izvori) = 'array'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Postavke (ključ → JSON); red 'dzamija' = cijeli objekat Dzamija iz types.ts ----------
create table if not exists public.postavke (
  kljuc       text primary key check (kljuc ~ '^[a-z0-9_-]+$'),
  vrijednost  jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Ručne ispravke predavanja (isti oblik kao data/predavanja-ispravke.json) ----------
create table if not exists public.predavanja_ispravke (
  video_id    text primary key check (video_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  podaci      jsonb not null default '{}'::jsonb check (jsonb_typeof(podaci) = 'object'),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Urednici (ko smije mijenjati sadržaj) ----------
create table if not exists public.urednici (
  email       text primary key
              check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  uloga       text not null default 'urednik' check (uloga in ('admin', 'urednik')),
  dodao       uuid default auth.uid() references auth.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists urednici_dodao_idx on public.urednici (dodao);

-- ---------- Imami (osnovni podaci; dopunjuje/zamjenjuje data/imami.json koji pravi YouTube skripta) ----------
create table if not exists public.imami (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  puno_ime    text not null check (length(btrim(puno_ime)) between 2 and 120),
  aliasi      text[] not null default '{}'::text[],
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Kategorije i serije predavanja ----------
create table if not exists public.kategorije (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  naziv       text not null check (length(btrim(naziv)) between 1 and 80),
  opis        text,
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.serije (
  slug        text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  naziv       text not null check (length(btrim(naziv)) between 1 and 160),
  opis        text,
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Dove ----------
create table if not exists public.dove (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  naslov          text not null check (length(btrim(naslov)) between 1 and 200),
  kategorija      text not null default 'Ostalo' check (length(btrim(kategorija)) between 1 and 60),
  arapski         text,
  transliteracija text,
  prevod          text not null check (length(btrim(prevod)) > 0),
  izvor           text not null default '',
  redoslijed      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists dove_redoslijed_idx on public.dove (redoslijed, created_at);

-- ---------- Ajeti i hadisi (ajet/hadis dana) ----------
create table if not exists public.ajeti_hadisi (
  id          uuid primary key default gen_random_uuid(),
  tip         text not null check (tip in ('ajet', 'hadis')),
  arapski     text,
  tekst       text not null check (length(btrim(tekst)) > 0),
  izvor       text not null check (length(btrim(izvor)) > 0),
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists ajeti_hadisi_redoslijed_idx on public.ajeti_hadisi (redoslijed, created_at);

-- ---------- Sedmični raspored (halke, mekteb, kursevi) ----------
create table if not exists public.raspored (
  id          uuid primary key default gen_random_uuid(),
  dan         smallint not null check (dan between 1 and 7), -- 1 = ponedjeljak … 7 = nedjelja
  vrijeme     text not null check (length(btrim(vrijeme)) between 1 and 60), -- "17:00" ili "nakon akšama"
  naziv       text not null check (length(btrim(naziv)) between 1 and 160),
  opis        text,
  za_koga     text not null default 'svi' check (za_koga in ('muškarci', 'žene', 'djeca', 'svi')),
  aktivno     boolean not null default true,
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists raspored_dan_idx on public.raspored (dan, redoslijed);

-- ---------- Uvodni tekstovi statičnih stranica ----------
create table if not exists public.stranice_tekstovi (
  kljuc       text primary key check (kljuc ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  naslov      text,
  sadrzaj     text, -- paragrafi odvojeni praznim redom; prazno/null = stranica koristi svoj ugrađeni tekst
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------- Okidači za updated_at ----------
drop trigger if exists obavjestenja_updated_at on public.obavjestenja;
create trigger obavjestenja_updated_at before update on public.obavjestenja
  for each row execute function public.postavi_updated_at();

drop trigger if exists galerija_updated_at on public.galerija;
create trigger galerija_updated_at before update on public.galerija
  for each row execute function public.postavi_updated_at();

drop trigger if exists imami_bio_updated_at on public.imami_bio;
create trigger imami_bio_updated_at before update on public.imami_bio
  for each row execute function public.postavi_updated_at();

drop trigger if exists postavke_updated_at on public.postavke;
create trigger postavke_updated_at before update on public.postavke
  for each row execute function public.postavi_updated_at();

drop trigger if exists predavanja_ispravke_updated_at on public.predavanja_ispravke;
create trigger predavanja_ispravke_updated_at before update on public.predavanja_ispravke
  for each row execute function public.postavi_updated_at();

drop trigger if exists imami_updated_at on public.imami;
create trigger imami_updated_at before update on public.imami
  for each row execute function public.postavi_updated_at();

drop trigger if exists kategorije_updated_at on public.kategorije;
create trigger kategorije_updated_at before update on public.kategorije
  for each row execute function public.postavi_updated_at();

drop trigger if exists serije_updated_at on public.serije;
create trigger serije_updated_at before update on public.serije
  for each row execute function public.postavi_updated_at();

drop trigger if exists dove_updated_at on public.dove;
create trigger dove_updated_at before update on public.dove
  for each row execute function public.postavi_updated_at();

drop trigger if exists ajeti_hadisi_updated_at on public.ajeti_hadisi;
create trigger ajeti_hadisi_updated_at before update on public.ajeti_hadisi
  for each row execute function public.postavi_updated_at();

drop trigger if exists raspored_updated_at on public.raspored;
create trigger raspored_updated_at before update on public.raspored
  for each row execute function public.postavi_updated_at();

drop trigger if exists stranice_tekstovi_updated_at on public.stranice_tekstovi;
create trigger stranice_tekstovi_updated_at before update on public.stranice_tekstovi
  for each row execute function public.postavi_updated_at();

-- ---------- Zaštita: uvijek mora ostati bar jedan admin ----------
create or replace function public.zastiti_zadnjeg_admina()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.uloga = 'admin'
     and (tg_op = 'DELETE' or new.uloga <> 'admin' or new.email <> old.email)
     and not exists (
       select 1 from public.urednici u
       where u.uloga = 'admin' and u.email <> old.email
     )
  then
    raise exception 'Mora ostati bar jedan administrator.'
      using errcode = 'P0001', hint = 'Dodajte drugog administratora prije uklanjanja ovog.';
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists urednici_zadnji_admin on public.urednici;
create trigger urednici_zadnji_admin before update or delete on public.urednici
  for each row execute function public.zastiti_zadnjeg_admina();
