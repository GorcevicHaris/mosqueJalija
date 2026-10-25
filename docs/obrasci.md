# Javni obrasci (Supabase)

Kontakt poruke, online upis, „Pitaj imama“ i sedmični raspored. Sajt ostaje statičan (GitHub Pages);
preglednik šalje podatke direktno u Supabase (PostgREST) javnim ključem. Zaštita je u bazi:
RLS + privilegije po koloni + okidač protiv spama (`supabase/migrations/0004_javni_unosi.sql`).

## Fajlovi

| Fajl | Šta radi |
| --- | --- |
| `src/lib/obrasci/supabase-rest.ts` | `unesi(tabela, red)` (POST, `Prefer: return=minimal`), `procitaj()` (GET), `procitajZaBuild()` (greška → prazna lista), razvrstavanje grešaka i poruke na srpskom |
| `src/lib/obrasci/zastita.ts` | honeypot, minimalno vrijeme popunjavanja (3 s), ograničenje po pregledniku (localStorage: 30 s pauze, najviše 5 slanja na sat po obrascu) |
| `src/lib/obrasci/forma-ui.ts` | zajednička logika obrazaca: provjera polja, greške uz polje (`aria-invalid`, `aria-describedby`), sažetak grešaka sa linkovima, stanja učitavanja / uspjeha / greške |
| `src/lib/obrasci/programi.ts` | **lista programa za upis** (konstanta `PROGRAMI`, iz `data/obavjestenja.json`) |
| `src/lib/obrasci/raspored.ts` | tipovi i HTML render rasporeda (isti u buildu i u pregledniku), „Danas“ po vremenu u Beogradu |
| `src/lib/obrasci/pitanja.ts` | tipovi i HTML render objavljenih pitanja i odgovora |
| `src/components/obrasci/obrasci.css` | stilovi obrazaca (`.ob-*`), samo tokeni iz `global.css` |
| `src/components/obrasci/ObrazacPodnozje.astro` | honeypot + dugme sa spinnerom + status (`aria-live`) + rezervni kanal (Instagram poruka) |
| `src/components/obrasci/ObrazacUspjeh.astro` | kartica uspjeha (zamijeni obrazac, dobija fokus) |
| `src/components/obrasci/KontaktSupabase.astro` | kontakt → `poruke` |
| `src/components/obrasci/PrijavaForma.astro` | upis → `prijave`; prop `program?` (id iz `programi.ts`) |
| `src/components/obrasci/PitanjeForma.astro` | pitanje → `pitanja` (anonimno dozvoljeno) |
| `src/pages/upis.astro` | `/upis` — programi + obrazac; `?program=<id>` preselektuje program |
| `src/pages/pitaj-imama.astro` | `/pitaj-imama` — obrazac + objavljeni odgovori (`pitanja_javna`), pretraga, kategorije ako postoje, FAQ JSON-LD |
| `src/pages/raspored.astro` | `/raspored` — tabela `raspored` po danima, „Danas“, filter po `za_koga`, prazno stanje sa linkom na obavještenja |

## Kolone koje se šalju

Samo kolone za koje anon ima `INSERT` privilegiju:

- `poruke`: `ime`, `email`, `tema`, `poruka`
- `prijave`: `ime_prezime`, `roditelj`, `telefon`, `email`, `program`, `uzrast`, `napomena`
  (`program` = čitljiv naziv programa, npr. „Sufara (arapsko pismo) — muškarci“)
- `pitanja`: `ime`, `email`, `pitanje`

Čitanje: `pitanja_javna` (bez imena i e-maila) i `raspored` (`aktivno = true`).

## Ponašanje

- **Bez env varijabli** (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` nisu postavljeni u buildu):
  kontakt prikazuje staru `ContactForm`, upis prikazuje `PrijavaDugme` (poruka na Instagramu),
  „Pitaj imama“ upućuje na kontakt, raspored prikazuje prazno stanje.
- **Build** povlači raspored i objavljene odgovore u HTML (SEO, radi i bez JS-a). Ako baza nije
  dostupna, build ne pada — stranica se napravi sa praznim stanjem.
- **Preglednik** zatim osvježi podatke iz baze (nove odgovore i izmjene rasporeda vidi se odmah,
  bez novog builda).
- **Greške** → poruke na srpskom: nema mreže / server odbio (401/403/42501) / neispravni podaci
  (400/409/422) / previše slanja (okidač `ogranicenje_slanja` ili 429) / tabela još ne postoji (404) /
  greška servera (5xx). Kod svake greške osim validacije pojavi se dugme „Poruka na Instagramu“
  (`https://ig.me/m/dzamija_na_jaliji`).
- **Privatnost**: ništa lično se ne loguje u konzolu. Obrazac za upis ima obavještenje (šta se čuva,
  ko vidi, kako zatražiti brisanje) i obavezno polje saglasnosti (saglasnost se ne čuva u bazi —
  bez nje se obrazac ne može poslati).
- **Roditelj**: polje se pojavi kada su godine < 15 (`UZRAST_DIJETE`) i tada je obavezno.
  Za programe označene `zaDjecu` godine su obavezne.

## Kako promijeniti listu programa

Uredite `PROGRAMI` u `src/lib/obrasci/programi.ts` (id, naziv ≤ 120 znakova, grupa, zaKoga, termin,
predavač, napomena, izvor = slug obavještenja). Kasnije se lista može prebaciti u tabelu u bazi —
oblik objekta je namjerno ravan.

## Uključivanje u postojeće stranice

1. `src/pages/kontakt.astro`: zamijeniti `import ContactForm from '../components/forms/ContactForm.astro';`
   sa `import KontaktSupabase from '../components/obrasci/KontaktSupabase.astro';` i `<ContactForm />`
   sa `<KontaktSupabase />` (stara forma ostaje kao rezerva unutar nove komponente).
2. `src/pages/mekteb.astro`: u `<aside class="enroll card">` zamijeniti `<PrijavaDugme … tema="Prijava za mekteb" … />`
   sa `<PrijavaForma id="prijava-mekteb" program="mekteb" />` (import iz `../components/obrasci/PrijavaForma.astro`),
   a Placeholder-e „raspored mekteba“ / „raspored halki“ linkom `<a href={url('/raspored')}>Sedmični raspored</a>`.
   Dugme „Upit za halku“ može voditi na `url('/upis?program=hifz-amme-muskarci')`.
3. `src/components/layout/nav.ts` → grupa „Korisno“ (ili nova grupa „Mekteb i halke“):
   `{ label: 'Online upis', href: '/upis', opis: 'Prijava za mekteb, halke i Školu Kur\'ana' }`,
   `{ label: 'Raspored', href: '/raspored', opis: 'Sedmični raspored halki i mekteba' }`,
   `{ label: 'Pitaj imama', href: '/pitaj-imama', opis: 'Pitanja i odgovori' }`.
4. `.github/workflows/deploy.yml`, korak `npm run build`: dodati
   `env: { PUBLIC_SUPABASE_URL: ${{ vars.PUBLIC_SUPABASE_URL }}, PUBLIC_SUPABASE_ANON_KEY: ${{ vars.PUBLIC_SUPABASE_ANON_KEY }} }`
   (i postaviti te repo varijable) — `.env` je u `.gitignore`, pa bez ovoga produkcija radi u rezervnom režimu.
5. (Opcionalno) dodati `/upis`, `/raspored`, `/pitaj-imama` u pretragu stranica (`src/lib/extras/stranice.ts`).

## Testiranje

Testni unosi smiju biti samo očigledno lažni (ime „TEST — obrisati“, e-mail `test@example.com`) i
moraju se obrisati iz admin panela poslije testa.
