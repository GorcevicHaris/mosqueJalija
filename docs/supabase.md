# Supabase: baza sadržaja i admin panel

Urednici (imam, sekretar) mijenjaju sadržaj sajta na **`/mosqueJalija/admin/`** — prijava e-mailom,
bez lozinke i bez pristupa kodu. Sajt ostaje statički (GitHub Pages); Supabase je samo baza i
skladište slika.

```
 urednik ──(prijava e-mailom, supabase-js sa CDN-a)──► /admin/ ──► Supabase (Postgres + RLS, Storage "slike")
                                                                       │
 GitHub Actions: svaki sat deploy.yml ──► npm run build ──(PostgREST, anon ključ, samo čitanje)──┘
                                                │
                                        statičke stranice ──► GitHub Pages
 posjetilac ──► /obavjestenja/ (+ skripta čita najnovije objave direktno iz baze — vide se odmah)
            └─► forme (kontakt, prijave, pitanja) ──► INSERT u poruke / prijave / pitanja
```

- Bez varijabli `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` sve radi kao ranije (data/*.json),
  a `/admin/` prikazuje "Supabase nije podešen".
- Ključ je **javni po dizajnu** (anon / `sb_publishable_…`). Podatke štite RLS politike u bazi.
  Novi `sb_publishable_…` ključ nije JWT: šalje se samo kao zaglavlje `apikey` (ne kao `Authorization`).
- Projekat: `dzamija-na-jaliji`, ref `rcpdboohgumvezbtafrg`, URL `https://rcpdboohgumvezbtafrg.supabase.co`.

## Fajlovi

| Fajl | Uloga |
|---|---|
| `supabase/migrations/0001_sadrzaj.sql` | sadržajne tabele, okidači `updated_at`, zaštita zadnjeg admina |
| `supabase/migrations/0002_rls.sql` | šema `private`, `private.je_urednik()` / `private.je_admin()`, privilegije, RLS |
| `supabase/migrations/0003_storage.sql` | bucket `slike` (javni, JPEG/PNG/WebP, ≤ 5 MB) + politike |
| `supabase/migrations/0004_javni_unosi.sql` | `poruke`, `prijave`, `pitanja`, pogled `pitanja_javna`, anti-spam |
| `supabase/seed.sql` | početni sadržaj iz `data/*.json` — **generisan**: `node scripts/supabase-seed.mjs` |
| `src/lib/supabase/config.ts` | URL/ključ, `supabaseUkljucen`, REST zaglavlja, nazivi tabela |
| `src/lib/supabase/sadrzaj.ts` | build: `ucitajIzBaze()` + `spojiDzamiju`, `spojiPoSlugu`, `primijeniIspravke` |
| `src/lib/supabase/tipovi.ts` | tipovi koji postoje samo u bazi (`TerminRasporeda`, `StranicaTekst`, `JavnoPitanje`…) |
| `src/lib/supabase/klijent.ts` | pregledač: `dopuniObavjestenja()`, `ucitajPoSlugu()`, `ucitajJavnaPitanja()` |
| `src/pages/obavjestenja/prikaz.astro` | `/obavjestenja/prikaz/?slug=…` — objava iz baze koja još nema statičnu stranicu |
| `src/pages/admin/index.astro`, `src/components/admin/**` | admin panel |
| `.github/workflows/osvjezi-sadrzaj.yml` | svaki sat pokreće `deploy.yml` |

## Tabele

| Tabela | Ključ | Sadržaj |
|---|---|---|
| `obavjestenja` | `id` (uuid), `slug` unique | obavještenja i objave (`tip`), `sadrzaj text[]` = paragrafi, `objavljeno`, `placeholder`, `autor` |
| `galerija` | `id` | `src` (URL), `alt`, `opis`, `izvor`, `licenca`, `redoslijed` |
| `imami` | `slug` | `puno_ime`, `aliasi text[]` — dopuna/zamjena za `data/imami.json` |
| `imami_bio` | `slug` | `uloga`, `bio`, `slika`, `potvrdjeno`, `izvori jsonb` |
| `kategorije`, `serije` | `slug` | `naziv`, `opis`, `redoslijed` |
| `dove` | `id`, `slug` unique | `naslov`, `kategorija`, `arapski`, `transliteracija`, `prevod`, `izvor` |
| `ajeti_hadisi` | `id` | `tip` (ajet/hadis), `arapski`, `tekst`, `izvor` |
| `raspored` | `id` | `dan` 1–7 (1 = ponedjeljak), `vrijeme` (tekst: "17:00" / "nakon akšama"), `naziv`, `opis`, `za_koga` (muškarci/žene/djeca/svi), `aktivno` |
| `stranice_tekstovi` | `kljuc` | `naslov`, `sadrzaj` (paragrafi odvojeni praznim redom; prazno = stranica koristi svoj tekst). Ključevi: `mekteb`, `donacije`, `pravila-ponasanja`, `ucenje-kurana` |
| `postavke` | `kljuc` | `vrijednost jsonb`; red `dzamija` = cijeli objekat `Dzamija` (types.ts) |
| `predavanja_ispravke` | `video_id` | `podaci jsonb` — isti oblik kao `data/predavanja-ispravke.json` |
| `urednici` | `email` (mala slova) | `uloga` admin/urednik, `dodao`, `created_at` |
| `poruke` | `id` | kontakt forma: `ime`, `email`, `tema`, `poruka`, `procitano` |
| `prijave` | `id` | `ime_prezime`, `roditelj`, `telefon`, `email`, `program`, `uzrast`, `napomena`, `status` (nova/kontaktiran/upisan/odbijen), `biljeska` (interna) |
| `pitanja` | `id` | `ime`, `email`, `pitanje`, `odgovor`, `odgovorio` (ime za prikaz), `odgovoreno_at`, `objavljeno` |
| pogled `pitanja_javna` | — | objavljena pitanja sa odgovorom, **bez** `ime`/`email` (`security_invoker`) |

Sve tabele imaju `created_at` (i `updated_at` sa okidačem, osim `urednici` i `poruke`).

## Prava pristupa (RLS) — sažetak

| | anon (posjetilac) | prijavljen, nije urednik | urednik | admin |
|---|---|---|---|---|
| sadržajne tabele (12) | čita | čita | čita + piše | čita + piše |
| `obavjestenja` sa `objavljeno = false` | — | — | vidi | vidi |
| `kategorije` `hutba`, `predavanje` | | | ne može obrisati | ne može obrisati |
| `urednici` | — | vidi 0 redova | čita | čita + piše (ne može ukloniti zadnjeg admina) |
| `poruke`, `prijave` | samo INSERT javnih kolona | samo INSERT | čita, mijenja, briše | isto |
| `pitanja` | INSERT (`ime`, `email`, `pitanje`); čita samo objavljena+odgovorena, bez `ime`/`email` | INSERT | sve | sve |
| storage `slike` | čita preko javnog URL-a (bez listanja) | isto | upload/izmjena/brisanje | isto |

- `private.je_urednik()` = prijavljeni korisnik ima **potvrđen** e-mail (`auth.users.email_confirmed_at`)
  koji postoji u `urednici`. E-mail se čita iz `auth.users` (izvor istine), ne iz `user_metadata`.
  Funkcije su `security definer`, `stable`, `set search_path = ''`, u šemi `private` koju API ne
  izlaže (ne mogu se zvati preko `/rpc`).
- Politike koriste `(select private.je_urednik())` (jednom po upitu, preporuka Supabase-a za brzinu).
- Javni unosi: privilegije **po koloni** (anon ne može postaviti `procitano`, `status`, `biljeska`,
  `odgovor`, `objavljeno`) + provjere dužine i formata e-maila + okidač `ogranici_javne_unose`
  (najviše 5 unosa po e-mailu/telefonu na sat i 60 ukupno na sat po tabeli; ne važi za urednike ni
  za direktan SQL).

Testirano lokalno (PGlite / Postgres 17, uz imitaciju `auth`/`storage` šema): 40 provjera — anon ne
može pisati ni čitati urednike/poruke, ne-urednik i nepotvrđen e-mail ne mogu pisati, urednik može,
samo admin mijenja urednike, zadnji admin se ne briše, anon ne čita `email` iz `pitanja`,
anti-spam radi, storage upload samo za urednike u bucket `slike`, migracije i seed su idempotentni.

## Postavljanje (redom)

1. **Migracije** (SQL editor ili Supabase MCP `apply_migration`), tačno ovim redom:
   `0001_sadrzaj` → `0002_rls` → `0003_storage` → `0004_javni_unosi`. Sve su idempotentne.
2. **Seed**: `supabase/seed.sql` (početni sadržaj; `ON CONFLICT DO NOTHING`, ne prepisuje izmjene).
   Ponovno generisanje poslije izmjena u `data/*.json`: `node scripts/supabase-seed.mjs`.
3. **Prvi administrator** (SQL editor, radi kao `postgres`, pa RLS ne smeta):
   ```sql
   insert into public.urednici (email, uloga) values ('ime@primjer.com', 'admin');
   ```
   Dalje urednike dodaje admin u panelu (**Administracija → Urednici**). E-mail se upisuje malim slovima.
4. **Auth podešavanja** (dashboard, vidi dolje) — posebno **vlastiti SMTP**.
5. **GitHub**: repo varijable i `deploy.yml` (vidi dolje).
6. `get_advisors` (security + performance) — vidi "Advisor" dolje.

## Auth podešavanja (Supabase dashboard)

- **Authentication → URL Configuration**
  - Site URL: `https://gorcevicharis.github.io/mosqueJalija/admin/`
  - Redirect URLs: `https://gorcevicharis.github.io/mosqueJalija/admin/`,
    `http://localhost:4321/mosqueJalija/admin/` (po želji `http://localhost:*/mosqueJalija/admin/` za
    druge lokalne portove). Panel šalje `emailRedirectTo` = tačna adresa admin stranice.
- **Authentication → Sign In / Providers → Email**: ostaviti uključeno; "Confirm email" uključeno
  (prava zahtijevaju potvrđen e-mail).
- **SMTP — obavezno za stvarne urednike.** Ugrađeni Supabase mailer šalje **samo članovima
  organizacije** na Supabase-u i najviše ~2 e-maila na sat; ostale adrese dobijaju grešku
  "Email address not authorized" (panel tada prikazuje razumljivu poruku). Podesiti
  **Authentication → Emails → SMTP Settings** (npr. Resend, Brevo, Mailjet ili Gmail SMTP sa
  "app password"), pa po potrebi povećati limit u **Rate Limits**.
- **E-mail šabloni** (Authentication → Emails → Templates): u šablone **Magic Link** i **Confirm
  signup** (prvi put za novu adresu stiže "Confirm signup") dodati kod `{{ .Token }}`, da urednik može
  upisati kod kad se link otvori u drugom pregledaču/uređaju. Primjer:
  ```html
  <h2>Prijava — Džamija na Jaliji</h2>
  <p><a href="{{ .ConfirmationURL }}">Kliknite ovdje da se prijavite</a></p>
  <p>Ili na stranici za prijavu upišite kod: <strong style="font-size:22px;letter-spacing:4px">{{ .Token }}</strong></p>
  <p>Link i kod važe ograničeno vrijeme. Ako niste tražili prijavu, zanemarite ovu poruku.</p>
  ```
- Panel koristi `signInWithOtp({ shouldCreateUser: true })`: urednik koji je upisan u `urednici`
  prvi put se samo prijavi (nalog nastaje sam). Bilo ko može napraviti nalog, ali bez reda u
  `urednici` vidi samo "Nemate urednička prava". Za dodatnu zaštitu, kad se svi urednici jednom
  prijave, može se isključiti "Allow new users to sign up"; novi urednik se tada poziva preko
  Authentication → Users → Invite.

## Povezivanje sa `src/lib/data.ts` (orkestrator)

Top-level `await` u `data.ts` je u redu (Astro build). Zamijeniti odgovarajuće exporte:

```ts
import { ucitajIzBaze, spojiDzamiju, spojiPoSlugu, primijeniIspravke } from './supabase/sadrzaj';
import type { TerminRasporeda, StranicaTekst, JavnoPitanje } from './supabase/tipovi';

const baza = await ucitajIzBaze(); // null = nema varijabli / baza nedostupna → data/*.json

export const dzamija = spojiDzamiju(dzamijaJson as Dzamija, baza?.dzamija);
export const kategorije = spojiPoSlugu(kategorijeJson as Kategorija[], baza?.kategorije ?? []);
export const serije = spojiPoSlugu(serijeJson as Serija[], baza?.serije ?? []);
const imamiOsnovno = spojiPoSlugu(imamiJson as ImamOsnovno[], baza?.imami ?? []);

export const predavanja: Predavanje[] = primijeniIspravke(predavanjaJson as Predavanje[], baza?.ispravke ?? {}, {
  imami: new Set(imamiOsnovno.map((i) => i.slug)),
  kategorije: new Set(kategorije.map((k) => k.slug)),
  serije: new Set(serije.map((s) => s.slug)),
}).slice().sort((a, b) => b.datum.localeCompare(a.datum));

const bio = { ...(imamiBioJson as Record<string, Partial<ImamBio>>), ...(baza?.imamiBio ?? {}) };
export const imami: Imam[] = imamiOsnovno.map((i) => ({ /* postojeći kod, koristi `bio` */ })) /* … */;

export const obavjestenja: Obavjestenje[] = (baza?.obavjestenja ?? (obavjestenjaJson as Obavjestenje[]))
  .slice().sort((a, b) => b.datum.localeCompare(a.datum));
export const dove = baza?.dove ?? (doveJson as Dova[]);
export const ajetiHadisi = baza?.ajetiHadisi ?? (ajetiHadisiJson as AjetHadis[]);
export const galerija = baza?.galerija ?? (galerijaJson as GalerijaSlika[]);
export const raspored: TerminRasporeda[] = baza?.raspored ?? [];          // samo aktivni, po danu
export const tekstoviStranica: Record<string, StranicaTekst> = baza?.stranice ?? {};
export const javnaPitanja: JavnoPitanje[] = baza?.pitanja ?? [];
```

Redoslijed je bitan: kategorije/serije/imami prije `predavanja` (validacija ispravki), `predavanja`
prije `imami` (broj predavanja). `ucitajIzBaze` je "sve ili ništa" (osim pitanja): ako ijedna
tabela ne odgovori, cijeli sajt koristi JSON — nikad mješavina. Baza je izvor istine: **seed mora
biti pokrenut prije postavljanja varijabli**, inače bi prazne tabele ispraznile stranice.

Tekstovi stranica (npr. `mekteb.astro`):
```astro
const t = tekstoviStranica['mekteb'];
{t?.paragrafi.length ? t.paragrafi.map((p) => <p>{p}</p>) : <Fragment>/* postojeći tekst */</Fragment>}
```
`nazivDana(dan)` iz `src/lib/supabase/tipovi.ts` daje "ponedjeljak" … "nedjelja".

### Nova obavještenja bez čekanja na build

U `<script>` stranica (klijentski kod uvozi samo `klijent.ts`, ne `data.ts`):

```ts
import { dopuniObavjestenja } from '../../lib/supabase/klijent';
dopuniObavjestenja('[data-ol]', { tip: 'obavjestenje', oblik: 'lista' });   // obavjestenja/index.astro
dopuniObavjestenja('[data-ol]', { tip: 'objava', oblik: 'lista' });         // objave.astro
dopuniObavjestenja('ul.news', { oblik: 'pocetna', max: 3 });                // index.astro (Aktuelno)
```

Dodaje samo objave kojih još nema na stranici (prepoznaje postojeće po linkovima), istim markupom i
klasama kao `_Lista.astro` / sekcija "Aktuelno", i kopira `data-astro-cid-*` atribut da važe scoped
stilovi. Link vodi na statičnu stranicu ako postoji, inače na `/obavjestenja/prikaz/?slug=…` (koja
sama preusmjeri na statičnu kad ona nastane). Poštuje trenutno izabran čip kategorije; filter skripta
u `_Lista.astro` pamti stavke pri učitavanju, pa za potpuno filtriranje novih stavki treba je pozvati
poslije događaja `obavjestenja:dopunjeno` (ili pokrenuti filter poslije `await dopuniObavjestenja`).
Na početnoj, ako je lista prazna, poruka "nema obavještenja" (`.empty`) se zamjenjuje listom.
U `/obavjestenja/[slug].astro` slug `prikaz` je rezervisan (admin ga ne dozvoljava).

### `astro.config.mjs` — izuzeti iz sitemap-a

```js
integrations: [sitemap({ filter: (page) => !/\/admin\/|\/obavjestenja\/prikaz\//.test(page) })],
```

### `deploy.yml` — varijable za build

Korak `npm run build` dobija:
```yaml
      - run: npm run build
        env:
          PUBLIC_SUPABASE_URL: ${{ vars.PUBLIC_SUPABASE_URL }}
          PUBLIC_SUPABASE_ANON_KEY: ${{ vars.PUBLIC_SUPABASE_ANON_KEY }}
```
Repo varijable (Settings → Secrets and variables → Actions → **Variables**, ne Secrets — javne su):
```bash
gh variable set PUBLIC_SUPABASE_URL --body "https://rcpdboohgumvezbtafrg.supabase.co"
gh variable set PUBLIC_SUPABASE_ANON_KEY --body "sb_publishable_…"
```
Lokalno ih čita `.env` (u `.gitignore`).

## Automatsko osvježavanje

`.github/workflows/osvjezi-sadrzaj.yml`: svaki sat (u :17) i ručno pokreće `deploy.yml`
(`gh workflow run`, `permissions: actions: write`). Preskače se dok `vars.PUBLIC_SUPABASE_URL` nije
postavljen. Nova obavještenja se vide odmah (klijentska skripta), ostalo za najviše ~1 sat.
Napomene:
- GitHub **isključuje zakazane workflowe u javnom repou poslije 60 dana bez aktivnosti** (commita).
  Sedmično osvježavanje predavanja commituje samo kad ima novih snimaka; ako workflow bude
  isključen, uključiti ga u Actions (dugme "Enable workflow").
- Zakazana pokretanja mogu kasniti (GitHub ih odgađa pri opterećenju).

## Pauziranje besplatnog projekta (Free plan)

Supabase pauzira besplatni projekat poslije **7 dana slabe aktivnosti**; prema zvaničnoj
dokumentaciji ([Project pausing](https://supabase.com/docs/guides/platform/free-project-pausing))
dovoljno je "nekoliko zahtjeva prema bazi dnevno". Build svakog sata pravi 13 REST upita (stvarni
SELECT-i), pa bi projekat trebalo da ostane aktivan — **ali to nije zvanično garantovano** (tačan
prag Supabase ne objavljuje i mijenjao se). Ako stigne e-mail upozorenja o pauzi, otvoriti projekat
u dashboardu ili ručno pokrenuti workflow. Pauziran projekat se može vratiti iz dashboarda; dok je
pauziran, build koristi JSON rezervu (stari sadržaj), a admin ne radi.

Ostala ograničenja Free plana (provjeriti na supabase.com/pricing, mijenjaju se): ~500 MB baza,
1 GB storage, ~5 GB saobraćaja mjesečno, 2 aktivna besplatna projekta po nalogu. Slike se zato
smanjuju u pregledaču na najviše 1600 px / WebP (obično 100–400 KB).

## Rezervna kopija

Free plan nema preuzimljive automatske backupe ni point-in-time oporavak. Preporuka (npr. mjesečno):
- `npx supabase db dump --db-url "<connection string>" -f backup.sql` (connection string:
  Project Settings → Database), ili `pg_dump` istim stringom;
- slike: Storage → `slike` → preuzimanje, ili skripta preko Storage API-ja;
- sadržaj se može vratiti i u `data/*.json` (početni podaci) — `seed.sql` je generisan iz njih.

## Javne forme (za agenta koji pravi forme)

```js
const res = await fetch(`${SUPABASE_URL}/rest/v1/prijave`, {
  method: 'POST',
  headers: { apikey: SUPABASE_ANON_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
  body: JSON.stringify({ ime_prezime, roditelj, telefon, email, program, uzrast, napomena }),
});
// 201 = primljeno. Ne tražiti return=representation (anon ne smije čitati tabelu).
```
- `poruke`: `ime` (1–100), `email` (obavezan, format), `tema` (1–60, podrazumijevano "Opšte"), `poruka` (2–5000).
- `prijave`: `ime_prezime` (2–120), `telefon` (6–40), `program` (1–120), `uzrast` (3–99 ili null),
  `roditelj`/`email`/`napomena` opcionalno.
- `pitanja`: `pitanje` (10–3000), `ime`/`email` opcionalno. Javno čitanje: `GET /rest/v1/pitanja_javna?select=*&order=odgovoreno_at.desc` (ili `ucitajJavnaPitanja()` iz `klijent.ts`).
- Greške: HTTP 400 sa `code: "23514"` (dužina/format), `code: "P0001"` i porukom "Previše poruka u
  kratkom vremenu…" (anti-spam), 401/403 `42501` (pokušaj slanja nedozvoljene kolone).

## Ispravke predavanja i `scripts/update-videos.mjs` (opciono)

Ispravke iz admina se već primjenjuju pri svakom buildu (`primijeniIspravke` u `data.ts`), pa nije
potrebno mijenjati skriptu. Ako treba da i `data/predavanja.json` u repou sadrži ispravke iz baze,
u `update-videos.yml` prije koraka "Osvježi podatke" dodati korak koji ih spaja u JSON (baza ima
prednost):
```yaml
      - name: Ispravke iz baze
        if: ${{ vars.PUBLIC_SUPABASE_URL != '' }}
        env:
          U: ${{ vars.PUBLIC_SUPABASE_URL }}
          K: ${{ vars.PUBLIC_SUPABASE_ANON_KEY }}
        run: |
          node -e '
            const fs=require("fs"), f="data/predavanja-ispravke.json";
            fetch(process.env.U+"/rest/v1/predavanja_ispravke?select=video_id,podaci",{headers:{apikey:process.env.K}})
              .then(r=>{if(!r.ok)throw new Error(r.status);return r.json()})
              .then(rows=>{const j=JSON.parse(fs.readFileSync(f,"utf8"));for(const r of rows)j[r.video_id]=r.podaci;
                fs.writeFileSync(f,JSON.stringify(j,null,2)+"\n")})
              .catch(e=>console.log("Ispravke iz baze preskočene:",e.message))'
```
i dodati `data/predavanja-ispravke.json` u `git add` istog workflowa. Novi imami/serije iz baze
(tabele `imami`, `serije`) skripta ne poznaje — za prepoznavanje u naslovima i dalje treba unos u
`scripts/podaci-config.json` (aliasi iz tabele `imami` mogu se spojiti na isti način).

## Advisor (Supabase)

Pokrenuti `get_advisors` (security i performance) poslije migracija. Očekivano: nema ERROR/WARN za
RLS, `search_path` ni security definer funkcije u izloženoj šemi (zato šema `private`). Mogući
INFO "unused index" za nove indekse dok nema saobraćaja — ignorisati. Auth upozorenja (npr. OTP
expiry, leaked password protection) se podešavaju u dashboardu.
