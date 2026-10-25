-- =====================================================================
-- 0005_programi_kartice_transkripti.sql — sadržaj koji je do sada bio u kodu
--   * programi            — programi za online upis (/upis, obrazac PrijavaForma)
--   * kartice_stranica    — kartice/stavke na statičnim stranicama (pravila ponašanja, mekteb, učenje Kur'ana)
--   * transkript_ispravke — ručne ispravke pojedinih segmenata transkripta (bs/en); sam transkript ostaje u JSON-u
--   * predavanja_rucna    — predavanja dodana ručno (YouTube link) pored onih koje skripta povlači sa kanala
-- Skrivanje predavanja ne traži novu tabelu: ključ "skriveno": true u predavanja_ispravke.podaci.
-- Traka na vrhu sajta: red 'traka' u postojećoj tabeli postavke (bez promjene šeme).
-- Pokretati POSLIJE 0001–0004, pa supabase/seed-0005.sql. Idempotentno (IF NOT EXISTS / OR REPLACE).
-- Privilegije i RLS su identični 0002_rls.sql: svi čitaju, piše samo urednik (private.je_urednik()).
-- =====================================================================

-- ---------- Programi za online upis ----------
create table if not exists public.programi (
  slug          text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug) <= 80),
  naziv         text not null check (length(btrim(naziv)) between 1 and 120), -- upisuje se u prijave.program
  opis          text check (opis is null or length(opis) <= 2000),
  grupa         text not null default 'Ostalo' check (length(btrim(grupa)) between 1 and 60),
  za_koga       text not null default 'svi' check (za_koga in ('muškarci', 'žene', 'djeca', 'svi')),
  za_koga_tekst text check (za_koga_tekst is null or length(za_koga_tekst) <= 80), -- prikaz, npr. "Žene i djeca"; null = iz za_koga
  termin        text check (termin is null or length(termin) <= 200), -- null = "Termin još nije objavljen"
  predavac      text check (predavac is null or length(predavac) <= 160),
  napomena      text check (napomena is null or length(napomena) <= 1000),
  obavjestenje  text check (obavjestenje is null or obavjestenje ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- slug obavještenja sa detaljima
  aktivno       boolean not null default true,
  redoslijed    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists programi_redoslijed_idx on public.programi (redoslijed, slug);

comment on table public.programi is 'Programi za online upis (/upis). za_koga = djeca → obrazac traži godine (i roditelja za mlađe od 15).';

-- ---------- Kartice na statičnim stranicama ----------
-- Nova stranica: dodati vrijednost u ograničenje kartice_stranica_stranica_check (nova migracija) i
-- podržati je u kodu stranice (karticeStranica('<kljuc>') iz src/lib/data.ts).
create table if not exists public.kartice_stranica (
  id          uuid primary key default gen_random_uuid(),
  stranica    text not null,
  naslov      text not null check (length(btrim(naslov)) between 1 and 200),
  tekst       text not null default '' check (length(tekst) <= 3000),
  ikona       text check (ikona is null or ikona ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), -- naziv iz src/components/ui/Icon.astro
  link        text check (link is null or (length(link) <= 600 and link ~ '^(https?://|/)')),
  aktivno     boolean not null default true,
  redoslijed  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint kartice_stranica_stranica_check
    check (stranica in ('pravila-ponasanja', 'mekteb', 'ucenje-kurana', 'ucenje-kurana-izvori'))
);

create index if not exists kartice_stranica_idx on public.kartice_stranica (stranica, redoslijed, created_at);

comment on table public.kartice_stranica is 'Kartice na stranicama. Stranica bez aktivnih kartica prikazuje svoju ugrađenu listu.';

-- ---------- Ispravke transkripata (po segmentu) ----------
create table if not exists public.transkript_ispravke (
  video_id    text not null check (video_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  jezik       text not null check (jezik in ('bs', 'en')),
  segment     integer not null check (segment between 0 and 100000), -- indeks u nizu segmenti
  tekst       text not null check (length(btrim(tekst)) between 1 and 5000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (video_id, jezik, segment)
);

comment on table public.transkript_ispravke is 'Ispravljen tekst jednog segmenta transkripta (bs = lektorisana/automatska verzija, en = prevod). Original ostaje u data/transkripti*.';

-- ---------- Ručno dodana predavanja (YouTube) ----------
create table if not exists public.predavanja_rucna (
  id           text primary key check (id ~ '^[A-Za-z0-9_-]{11}$'), -- YouTube ID
  naslov       text not null check (length(btrim(naslov)) between 1 and 300),
  naslov_cist  text check (naslov_cist is null or length(naslov_cist) <= 300),
  datum        date not null default current_date,
  trajanje     integer not null default 0 check (trajanje between 0 and 86400), -- sekunde
  imam         text check (imam is null or imam ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kategorija   text not null default 'predavanje' check (kategorija ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  serija       text check (serija is null or serija ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  serija_dio   integer check (serija_dio is null or serija_dio between 1 and 999),
  opis         text check (opis is null or length(opis) <= 5000),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists predavanja_rucna_datum_idx on public.predavanja_rucna (datum desc);

comment on table public.predavanja_rucna is 'Predavanja dodana ručno (YouTube link). Ako isti video kasnije stigne sa kanala, koristi se verzija sa kanala.';

-- ---------- Okidači za updated_at ----------
drop trigger if exists programi_updated_at on public.programi;
create trigger programi_updated_at before update on public.programi
  for each row execute function public.postavi_updated_at();

drop trigger if exists kartice_stranica_updated_at on public.kartice_stranica;
create trigger kartice_stranica_updated_at before update on public.kartice_stranica
  for each row execute function public.postavi_updated_at();

drop trigger if exists transkript_ispravke_updated_at on public.transkript_ispravke;
create trigger transkript_ispravke_updated_at before update on public.transkript_ispravke
  for each row execute function public.postavi_updated_at();

drop trigger if exists predavanja_rucna_updated_at on public.predavanja_rucna;
create trigger predavanja_rucna_updated_at before update on public.predavanja_rucna
  for each row execute function public.postavi_updated_at();

-- ---------- Privilegije + RLS (isti obrazac kao 0002_rls.sql) ----------
do $$
declare
  t text;
  tabele text[] := array['programi', 'kartice_stranica', 'transkript_ispravke', 'predavanja_rucna'];
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
