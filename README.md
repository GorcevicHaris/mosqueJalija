# Džamija na Jaliji — web sajt

Zvanični web sajt džemata Džamije na Jaliji: predavanja i hutbe sa YouTube kanala, vaktija,
obavještenja, imami, dove, mekteb, donacije i kontakt. Statički sajt (Astro), bez backend-a.

## Pokretanje lokalno

Potreban je **Node.js 22.23+** (preporuka: 24).

```bash
npm install
npm run dev
```

Sajt je tada na http://localhost:4321/mosqueJalija/

```bash
npm run build      # pravi statički sajt u dist/
npm run preview    # pregled build-a
```

## Struktura

| Putanja | Šta je |
|---|---|
| `data/*.json` | Svi podaci (džamija, predavanja, imami, obavještenja, dove…). Sadržaj se mijenja OVDJE. |
| `src/pages/` | Stranice (svaki fajl = jedna ruta) |
| `src/components/` | Komponente (UI, predavanja, vaktija, forme) |
| `src/lib/` | Logika: učitavanje podataka, vaktija, filteri |
| `src/styles/global.css` | Dizajn sistem (boje, fontovi, razmaci) za svijetlu i tamnu temu |
| `scripts/update-videos.mjs` | Osvježavanje predavanja sa YouTube kanala |
| `docs/` | Arhitektura, analiza uzora, istraživanje, napomene o vaktiji i podacima |

## Admin panel i baza (Supabase)

Urednici mijenjaju sadržaj na **https://dzamija-na-jaliji.vercel.app/admin/**, bez pristupa
kodu. Ulaz je link „Prijava za urednike“ u podnožju sajta. Prijava ide preko linka na e-mail ili
lozinkom (nalog sa lozinkom pravi administrator u Supabase → Authentication → Users → Add user).
Prvi administrator je upisan u tabelu `urednici`. Ostale urednike admin dodaje u sekciji „Urednici“. U adminu se uređuju obavještenja, objave, podaci o džamiji, imami, galerija, dove, raspored,
ispravke predavanja, inbox poruka, prijave i pitanja. Sadržaj je u Supabase bazi; sajt ga čita pri
buildu, a nova obavještenja i direktno u pregledaču. Workflow `.github/workflows/osvjezi-sadrzaj.yml`
obnavlja sajt svakih 15 minuta.

- Lokalno: napravite `.env` sa `PUBLIC_SUPABASE_URL` i `PUBLIC_SUPABASE_ANON_KEY` (javni ključ). Bez
  njih sajt koristi `data/*.json`.
- Na GitHub-u su iste vrijednosti u Settings → Secrets and variables → Actions → **Variables**.
- Šema baze: `supabase/migrations/`. Početni podaci: `node scripts/supabase-seed.mjs` → `supabase/seed.sql`.
- Dodavanje urednika, podešavanje prijave i sigurnost: `docs/supabase.md`.

## Transkripti predavanja

Svako predavanje ima automatski transkript (`data/transkripti/`), uz lektorisanu verziju u
`data/transkripti-lektura/`. Lektorisana verzija ima prednost. Engleski prevod je u
`data/transkripti-en/` (isti odlomci i vremena). Stranica predavanja ima dugme „Bosanski | English“,
koje se prikazuje kad prevod postoji. Za nove videe, na Mac-u sa Homebrew-om:

```bash
brew install ffmpeg whisper-cpp
node scripts/transkripcija/transkribuj.mjs
```

Skripta preskače već obrađene videe. Detalji: `docs/transkripcija.md`.

## Izmjena sadržaja (bez admina, direktno u fajlovima)

Ako Supabase nije podešen, sadržaj se mijenja u fajlovima:

- **Podaci o džamiji** (adresa, kontakt, historija, račun za donacije, vrijeme džume): `data/dzamija.json`.
  Polje sa vrijednošću `null` se na sajtu prikazuje kao vidljiva oznaka "Podatak nedostaje".
- **Obavještenja i objave**: `data/obavjestenja.json` (novi unos na vrh; `placeholder: false`).
- **Biografije imama**: `data/imami-bio.json` (ključ je slug imama iz `data/imami.json`).
- **Slike za galeriju**: stavite u `public/images/galerija/` i dodajte unos u `data/galerija.json`.
- **Ispravke predavanja** (pogrešan imam, kategorija, serija): `data/predavanja-ispravke.json` —
  ispravke preživljavaju svako osvježavanje videa.

## Osvježavanje videa sa YouTube kanala

Automatski: GitHub Action `.github/workflows/update-videos.yml` jednom sedmično povlači nove videe,
commituje promjene u `data/` i time pokreće novi deploy. Može se pokrenuti i ručno:
GitHub → Actions → "Osvježavanje predavanja" → Run workflow.

Ručno, lokalno (potreban [yt-dlp](https://github.com/yt-dlp/yt-dlp)):

```bash
python3 -m pip install --user yt-dlp
npm run update-videos
```

Detalji (kako se određuju imam, kategorija i serija): `docs/predavanja-podaci.md`.

## Deploy

Sajt se objavljuje na dva mjesta, oba automatski pri svakom pushu na `main`:

| Hosting | Adresa | Kako |
|---|---|---|
| **Vercel (glavni)** | https://dzamija-na-jaliji.vercel.app/ | Vercel projekat `dzamija-na-jaliji` povezan sa repoom; podešavanja u `vercel.json` |
| GitHub Pages (rezerva) | https://gorcevicharis.github.io/mosqueJalija/ | `.github/workflows/deploy.yml` |

Isti kod radi na oba mjesta. Na Vercel-u (env `VERCEL=1`) sajt je na korijenu domena (`BASE=/`), a na
GitHub Pages u podfolderu `/mosqueJalija/`. Manifest i `robots.txt` se generišu prema adresi.

Sadržaj iz admina ulazi u stranice pri buildu. `.github/workflows/osvjezi-sadrzaj.yml` zato svakih
15 minuta pokreće novi build: na GitHub Pages i na Vercel-u, preko Deploy Hook-a sačuvanog kao GitHub
secret `VERCEL_DEPLOY_HOOK`.

### Vlastiti domen (Vercel)

1. Vercel → projekat **dzamija-na-jaliji** → **Settings → Domains → Add** → upišite domen (npr.
   `dzamijanajaliji.rs`) i kod registra domena podesite DNS zapise koje Vercel pokaže.
2. Vercel sam postavlja HTTPS. Kanonski URL-ovi, sitemap i `robots.txt` automatski koriste domen, jer
   ga Vercel daje kroz `VERCEL_PROJECT_PRODUCTION_URL`.
3. U Supabase → Authentication → URL Configuration dodajte `https://vas-domen/admin/**` u Redirect
   URLs i postavite Site URL na `https://vas-domen/admin/`, da prijava u admin radi na domenu.

## Kontakt forma

Kontakt forma, online upis i „Pitaj imama“ spremaju poruke u Supabase (tabele `poruke`, `prijave`,
`pitanja`), a urednici ih čitaju u inboxu admin panela. Bez Supabase-a kontakt forma koristi rezervu:
kopira poruku i otvara Instagram poruku, mailto, ili `PUBLIC_FORM_ENDPOINT` (npr. Formspree) ako je
podešen. Detalji: `docs/obrasci.md`, `docs/funkcionalnosti.md`.
