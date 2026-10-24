# Arhitektura i podjela posla

Sajt za **Džamiju na Jaliji**, po uzoru na https://arapdzamija.rs. Jezik sajta: **srpski, latinica**
(ijekavica, kao uzor i kao kanal džamije: "obavještenja", "predavanje", "dova").

## Stack
- **Astro 7**, statički export (`output: 'static'`), bez frontend frameworka. Interaktivnost = male
  `<script>` skripte (TypeScript) u komponentama. Bez React/Vue.
- Deploy: GitHub Pages preko `.github/workflows/deploy.yml`. Sajt živi na podfolderu
  **`/mosqueJalija/`** → **svaki interni link i statički fajl ide kroz `url()`** iz `src/lib/url.ts`
  (`url('/predavanja')`, `url('/images/x.jpg')`). U klijentskim skriptama koristiti
  `import.meta.env.BASE_URL`. Hardkodovan `href="/..."` je bug.
- Vaktija: biblioteka `adhan` (instalirana), računa se u pregledaču, za koordinate iz `data/dzamija.json`.
- Fontovi (instalirani, self-hosted preko @fontsource): `@fontsource/amiri` (arapski tekst),
  `@fontsource/aref-ruqaa` i `@fontsource-variable/reem-kufi` (kaligrafija/ukrasni arapski),
  `@fontsource-variable/manrope` (tekst), `@fontsource-variable/fraunces` (naslovi). Dizajner bira.
- Instalirani paketi: astro, @astrojs/sitemap, adhan, fontovi. **Agenti NE pokreću `npm install`**
  (paralelne instalacije se sudaraju). Ako nešto zaista treba, napiši u svoj izvještaj.
- **Agenti NE pokreću git** (orkestrator commituje).

## Podaci
Svi podaci su u `/data/*.json`, tipovi u `src/lib/types.ts`, čitaju se ISKLJUČIVO kroz `src/lib/data.ts`.
`null` = nepoznato → UI prikazuje vidljiv placeholder (komponenta `src/components/ui/Placeholder.astro`).
**Ne izmišljati činjenice** o džamiji i imamima. Nepotvrđeno = placeholder ili `potvrdjeno: false`.

| Fajl | Vlasnik |
|---|---|
| `data/predavanja.json`, `data/imami.json`, `data/kategorije.json`, `data/serije.json` | YouTube/podaci |
| `data/dzamija.json`, `data/imami-bio.json`, `data/obavjestenja.json`, `data/dove.json`, `data/ajeti-hadisi.json`, `data/galerija.json` | Istraživač |

Slug imama: ascii, mala slova, `ime-prezime` (npr. `admir-jasarevic`). Oba agenta koriste isto pravilo.

## Stranice i vlasništvo fajlova
Uzor ima: Početna, Namazi (vaktija), Hutbe, Predavanja, Mediji, Kontakt, Obavještenja, Objave (+detalj),
Doniraj, Historijat, Obnova, Pravila ponašanja, Kur'an i hadisi, Mekteb, Učenje Kur'ana.

| Ruta | Vlasnik |
|---|---|
| `src/styles/**`, `src/layouts/**`, `src/components/ui/**`, `src/components/layout/**`, `public/` (favicon, OG slika, ornamenti) | Dizajner |
| `/` (`index.astro`), `/404` | Dizajner |
| `/o-dzamiji` (historija, činjenice, lokacija), `/galerija` | Dizajner |
| `/mekteb` (mekteb i halke, prijava), `/donacije` | Dizajner |
| `/dove`, `/kuran-hadisi` (ajet/hadis dana), `/pravila-ponasanja`, `/ucenje-kurana`, `/mediji` | Dizajner |
| `src/components/predavanja/**`, `src/components/vaktija/**`, `src/components/forms/**`, `src/lib/*` osim `url.ts`/`types.ts`/`data.ts` | Funkcionalnosti |
| `/predavanja`, `/predavanja/[id]`, `/hutbe` (predavanja sa preset filterom kategorija=hutba) | Funkcionalnosti |
| `/imami`, `/imami/[slug]` | Funkcionalnosti |
| `/vaktija` (danas, odbrojavanje do sljedećeg namaza, mjesečna tabela) | Funkcionalnosti |
| `/obavjestenja`, `/obavjestenja/[slug]`, `/objave` | Funkcionalnosti |
| `/kontakt` (mapa, forma) | Funkcionalnosti |
| `scripts/**`, `.github/workflows/update-videos.yml` | YouTube/podaci |
| `astro.config.mjs`, `package.json`, `src/lib/url.ts`, `src/lib/types.ts`, `src/lib/data.ts`, `.github/workflows/deploy.yml` | Orkestrator (Funkcionalnosti smije DODAVATI exporte u data.ts) |

Ugovori (props se ne mijenjaju bez potrebe; ako moraš, ažuriraj sve pozive):
- `src/layouts/BaseLayout.astro` — props `{ title, description?, image?, noindex? }`, `<slot />` = sadržaj.
- `src/components/predavanja/LectureCard.astro` — props `{ predavanje: Predavanje }`.
- `src/components/vaktija/VaktijaToday.astro` — props `{ compact?: boolean }`.
- `src/components/ui/PageHero.astro` (dizajner) — props `{ title, subtitle?, eyebrow?, arabic? }` — zaglavlje podstranice.
- `src/components/ui/Placeholder.astro` (dizajner) — props `{ label: string }` — vidljiva oznaka da podatak fali.

## Dizajn smjernice
Profesionalan islamski stil, bez generičkog šablona: geometrijski ornamenti (SVG, npr. osmokraka
zvijezda / girih), zelena/zlatna/krem paleta, Amiri za arapski, moderan sans za tekst, arapska
kaligrafija u zaglavlju. Svjetla + tamna tema (toggle + `prefers-color-scheme`, bez bljeska),
potpuno responzivno (od 360px), brzo, pristupačno (kontrast AA, fokus stilovi, skip-link, aria), SEO
(meta, canonical, OG/Twitter, JSON-LD `Mosque`, sitemap preko integracije).
CSS tokeni se definišu u `src/styles/global.css` (uvozi ga BaseLayout). Ostali agenti koriste tokene,
ne hardkodovane boje. **Obavezni nazivi** (dizajner ih definiše za obje teme, smije dodati još):
`--color-bg`, `--color-surface`, `--color-surface-2`, `--color-text`, `--color-text-muted`,
`--color-primary` (zelena), `--color-primary-hover`, `--color-on-primary`, `--color-accent` (zlatna),
`--color-accent-soft`, `--color-border`, `--color-focus`, `--color-danger`, `--color-success`,
`--font-sans`, `--font-serif`, `--font-arabic`, `--font-calligraphy`,
`--space-1` … `--space-8` (4px→64px), `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`,
`--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--container` (max širina), `--transition`.
Zajedničke klase koje dizajner pravi: `.container`, `.btn`, `.btn--primary`, `.btn--ghost`, `.card`,
`.badge`, `.visually-hidden`, `.prose` (tipografija dužeg teksta), `.grid-cards` (responzivna mreža kartica).

## Lokalni rad (paralelni agenti)
- Dev server: Dizajner port 4321, Funkcionalnosti 4322, QA 4323: `npx astro dev --port 43xx`.
- Build bez sudara: `npx astro build --outDir /tmp/dist-<uloga>` (ne dirati zajednički `dist/`).
- Pregledač: otvori SVOJU karticu (`tabs_create`), ne zatvaraj tuđe.
