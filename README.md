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

## Izmjena sadržaja

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

## Deploy (GitHub Pages)

Svaki push na `main` pokreće `.github/workflows/deploy.yml`, koji gradi sajt i objavljuje ga na
GitHub Pages: https://gorcevicharis.github.io/mosqueJalija/

Jednokratno podešavanje: GitHub → Settings → Pages → Source: **GitHub Actions**.
Napomena: GitHub Pages za **privatni** repozitorij radi samo uz plaćeni plan (Pro/Team). Na besplatnom
planu repozitorij mora biti javan.

### Vlastiti domen

1. U `astro.config.mjs` (ili kao varijable okruženja u workflow-u) postavite `SITE=https://vas-domen.rs`
   i `BASE=/`.
2. Dodajte `public/CNAME` sa nazivom domena i podesite DNS po uputstvu GitHub Pages.
3. Ažurirajte `Sitemap:` u `public/robots.txt`.

## Kontakt forma

Bez backend-a forma otvara e-mail klijent (mailto) sa popunjenom porukom. Za slanje direktno sa sajta
napravite besplatan formular na npr. [Formspree](https://formspree.io) i postavite varijablu
`PUBLIC_FORM_ENDPOINT` (lokalno u `.env`, na GitHub-u u workflow-u). Detalji: `docs/funkcionalnosti.md`.
