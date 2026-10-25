# Funkcionalnosti (predavanja, imami, vaktija, obavještenja, kontakt)

Sve stranice su statičke (Astro). Interaktivnost = male vanilla TS skripte; bez njih stranice i
dalje prikazuju sadržaj. Klijentske skripte NE uvoze `src/lib/data.ts` (da se u pregledač ne bi
slali svi JSON-ovi) — podaci idu kroz ugrađeni `<script type="application/json">` ili `data-*` atribute.

## Fajlovi

| Fajl | Uloga |
|---|---|
| `src/components/predavanja/LectureCard.astro` | kartica predavanja (ugovor `{ predavanje }`, opcionalno `headingLevel`) |
| `src/components/predavanja/kartica.ts` | jedini izvor HTML-a kartice (koriste ga i build i filter skripta) |
| `src/components/predavanja/LectureBrowser.astro` | filteri, pretraga, sortiranje, "Učitaj još", stanje u URL-u |
| `src/components/predavanja/YouTubeFacade.astro` | klikni-za-pokretanje player (youtube-nocookie) |
| `src/components/predavanja/ShareButton.astro` | Web Share API, rezerva: kopiranje linka + toast |
| `src/components/predavanja/ImamAvatar.astro` | fotografija ili ornamentalni monogram |
| `src/components/vaktija/VaktijaToday.astro` | današnja vaktija (ugovor `{ compact? }`) |
| `src/components/vaktija/VaktijaMonth.astro`, `mjesec-render.ts` | mjesečna tabela |
| `src/components/forms/ContactForm.astro` | kontakt forma |
| `src/lib/vaktija.ts`, `src/lib/vaktija-config.ts` | računanje vaktije (vidi `docs/vaktija.md`) |
| `src/lib/predavanja.ts` | srodna predavanja, dijelovi serije, opis → HTML, kompaktni podaci za klijent |
| `src/lib/obavjestenja.ts` | liste obavještenja, automatske vijesti o novim snimcima |
| `src/lib/format.ts`, `src/lib/pretraga.ts` | formatiranje (datum, trajanje) i pretraga bez dijakritika (bez zavisnosti) |

## Predavanja (`/predavanja`, `/hutbe`)

- Filteri (kombinuju se, I): **imam**, **kategorija**, **serija**, **godina**; pretraga po naslovu
  (i imenu imama/serije); poredak **najnovije / najstarije / najgledanije** (ako postoje pregledi) i
  **redoslijed dijelova** (samo kad je izabrana serija).
- Pretraga ne razlikuje velika/mala slova ni dijakritike: `č/ć→c`, `š→s`, `ž→z`, `đ→dj` ili `d`
  ("dzennet", "DŽENNET" i "džennet" daju isto). Više riječi = sve moraju postojati.
- Stanje je u adresi: `?imam=&kategorija=&serija=&godina=&q=&sort=` (`history.replaceState`),
  vraća se pri učitavanju, na `popstate` i pri povratku "Nazad" — kopiran link daje isti prikaz.
  Nepoznate vrijednosti u URL-u se ignorišu.
- Broj rezultata (`aria-live`), čipovi aktivnih filtera (klik uklanja), "Poništi filtere",
  brojevi uz opcije (fasetno: računaju ostale aktivne filtere; opcije sa 0 su onemogućene),
  prazno stanje.
- "Učitaj još" po 12; fokus prelazi na prvu novu karticu.
- Build iscrtava prvih 12 kartica (SEO); bez JS-a `<noscript>` lista sadrži linkove na sve snimke.
- Mobilni (< 768px): filteri su u panelu koji se otvara dugmetom "Filteri" (broj aktivnih filtera
  u bedžu; panel je otvoren ako link već sadrži filtere).
- `/hutbe` = isti pregled sa fiksnom kategorijom `hutba` (filter kategorije se ne prikazuje).
- Kartica: sličica (lazy, 16:9, `mqdefault` + `hqdefault`), trajanje (skriveno ako je 0),
  kategorija + "Dio N" za serije, naslov (`naslovCist`), imam, datum; cijela kartica je link.

## Detalj predavanja (`/predavanja/[id]`)

Fasada playera (sličica + dugme; iframe `youtube-nocookie.com` se učitava tek na klik; bez JS-a
link na YouTube), naslov (+ "dio N"), datum, trajanje (ako je poznato), pregledi, imam (link na
profil; bedž **nepotvrđeno** kad je `imamPotvrdjen: false`), bedževi kategorije/serije (vode na
filtrirana predavanja), opis (linkovi + prelomi reda), navigacija prethodni/sljedeći dio i lista
svih dijelova serije, 6 srodnih (ista serija → isti imam i kategorija → isti imam → ista kategorija),
"Pogledaj na YouTube-u", "Podijeli", JSON-LD `VideoObject`, OG slika = sličica.

## Imami (`/imami`, `/imami/[slug]`)

Kartice (foto ili monogram, puno ime, uloga, broj snimaka). Profil: biografija ili placeholder,
izvori, broj snimaka po kategorijama (linkovi na filtere), 12 najnovijih snimaka i
"Sva predavanja" → `/predavanja?imam=slug`.

## Vaktija (`/vaktija`)

Vidi `docs/vaktija.md`. Danas + odbrojavanje, mjesečna tabela (`?mjesec=GGGG-MM`), džuma, CSV, štampa.

## Obavještenja / Objave

- `/obavjestenja`: tip `obavjestenje` + **automatske vijesti o 3 najnovija snimka** (iz
  `predavanja.json`, bez kratkih videa; link vodi na snimak), najnovije prvo, filter čipovima po
  kategoriji (`?kategorija=` u adresi).
- `/objave`: tip `objava`. `/obavjestenja/[slug]`: detalj za oba tipa (paragrafi sa linkovima,
  slika, dijeljenje, ostala obavještenja). Stavke sa `placeholder: true` imaju bedž **Primjer**
  (i `noindex`). Prazno stanje kad nema stavki.

## Kontakt (`/kontakt`) i forma

- OpenStreetMap iframe (bez API ključa) centriran na `dzamija.koordinate`, linkovi
  "Navigacija do džamije" (Google Maps directions), "Otvori u Google Maps", Apple Maps, "Veća mapa" (OSM).
- Adresa, e-mail, telefon, društvene mreže — placeholder kad je podatak `null`.
- `ContactForm`: ime, e-mail, tema (Opšte, Mekteb, Halke, Donacije, Ostalo), poruka.
  Validacija na klijentu (poruke uz polja, `aria-invalid`, sažetak grešaka sa linkovima, fokus na
  prvo neispravno polje), honeypot polje `_gotcha`.
- Slanje — bez backenda, bira se automatski:
  1. **`PUBLIC_FORM_ENDPOINT`** postavljen pri buildu (npr. Formspree:
     `PUBLIC_FORM_ENDPOINT=https://formspree.io/f/xxxx npm run build`, ili kao varijabla u GitHub
     Actions deploy workflowu) → `fetch` POST (`FormData`, `Accept: application/json`), poruke o
     uspjehu/grešci.
  2. inače, ako postoji `dzamija.kontakt.email` → otvara se `mailto:` sa popunjenom temom i porukom.
  3. inače, ako postoji Instagram/Facebook (trenutno stanje — e-mail nije javno objavljen) → „Pripremi
     poruku“: provjera polja, sastavljena poruka se kopira u međuspremnik i nude se dugmad „Otvori poruku na
     Instagramu“ (`https://ig.me/m/<profil>`) i Facebook stranica; e-mail korisnika je tada neobavezan.
  4. inače → placeholder, dugme za slanje je onemogućeno uz objašnjenje.
- Prijave za mekteb/halke: `src/components/forms/PrijavaDugme.astro` (mailto, a bez e-maila Instagram poruka
  uz automatsko kopiranje pripremljenog teksta prijave).
