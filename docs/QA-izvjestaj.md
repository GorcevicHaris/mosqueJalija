# QA izvještaj — Džamija na Jaliji

Datum: 25. 10. 2026. Testirano na produkcijskom buildu (`npm run build` → `npx astro preview --port 4323`,
adresa `http://localhost:4323/mosqueJalija/`), Chrome (ugrađeni pregledač + headless Chrome preko
privremenog puppeteer-core/axe-core/Lighthouse u scratch folderu — ništa nije dodato u `package.json`).

## 1. Šta je testirano

| Oblast | Obim |
|---|---|
| Build | `npm run build` — 113 stranica, 0 grešaka, 0 upozorenja; `npx astro check` — 0 grešaka, 0 upozorenja, 0 hintova |
| Linkovi | skripta prolazi kroz svih 118 HTML/XML/manifest fajlova u `dist/` (href, src, srcset, url(), `<loc>`, manifest): **0 pokvarenih internih linkova**, svaki interni link ima `/mosqueJalija` base. Vanjski: YouTube kanal, Instagram, `ig.me/m/dzamija_na_jaliji`, Facebook, vaktija.ba, OSM, Wikipedia, youtube-nocookie embed → 200; mesihat.org i sandzak.tv vraćaju 406 samo botovima, sa zaglavljima pregledača 200 |
| Konzola | svih 113 stranica + nepostojeća adresa (404) × 3 širine (360, 768, 1280) × 2 teme (svijetla, tamna): **0 grešaka/upozorenja** (osim očekivanog 404 statusa same 404 stranice) |
| Raspored | iste kombinacije: horizontalni skrol, broj `h1`, redoslijed naslova, `alt`, labele polja, validnost JSON-LD |
| Pristupačnost | axe-core (WCAG 2.1 AA + best-practice) na 26 tipova stranica × 375/1280 × svijetla/tamna: **0 prekršaja** (uklj. kontrast) |
| Funkcije | automatizovani scenariji (puppeteer) + ručno u ugrađenom pregledaču, vidi §3 |
| Lighthouse | mobilni profil (Moto G, spori 4G), 8 stranica, vidi §4 |

Stranice: `/`, `/o-dzamiji`, `/predavanja` (+ filteri), svih 81 `/predavanja/<id>`, `/hutbe`, `/imami`, svih 8
`/imami/<slug>`, `/vaktija` (+ `?mjesec=`), `/kalendar` (+ `?m=`), `/pretraga` (+ `?q=`), `/obavjestenja` + 4 detalja,
`/objave`, `/kontakt`, `/galerija`, `/mekteb`, `/donacije`, `/dove`, `/kuran-hadisi`, `/pravila-ponasanja`,
`/ucenje-kurana`, `/mediji`, `/404`, RSS (`/predavanja.xml`, `/obavjestenja.xml`), sitemap, robots, manifest, štampa vaktije.

## 2. Pronađene greške i ispravke

### Linkovi, SEO
1. **404 stranica imala `canonical`/`og:url` na nepostojeći `/404/`** (jedini pokvaren link u crawlu). → `BaseLayout`: stranice sa `noindex` (404, primjeri obavještenja) nemaju `canonical` ni `og:url`.
2. **Interni linkovi bez završne kose crte** (`/mosqueJalija/predavanja`) — GitHub Pages ih preusmjerava (301), dodatni zahtjev na svaki klik. → `url()` (`src/lib/url.ts`, nova `saKosomCrtom`) dodaje `/` stranicama (fajlovi sa ekstenzijom i `?upit`/`#sidro` ostaju ispravni); isto i u klijentskim karticama (`LectureBrowser`) i rezultatima pretrage (`PretragaApp`).
3. **Duplirani `<title>`/opisi**: 6 „Kratki video“ snimaka (podaci su u međuvremenu dobili jedinstvene naslove) i 25+5+3 dijelova serija sa istim YouTube opisom. → meta opis detalja = naslov + kategorija/predavač/datum + početak opisa (≤160 znakova, rez po riječi). Uklonjena i **dvostruka tačka** „2026.. Snimak…“.
4. **JSON-LD `Mosque`**: `streetAddress` je sadržavao i poštanski broj i grad. → `streetAddress: "Jalija 69"`, `postalCode: "36300"`, `addressCountry: "RS"` (`adresaDijelovi()` u `data.ts`).
5. Sitemap: sve stranice, bez 404; `robots.txt` pokazuje na `…/mosqueJalija/sitemap-index.xml` — ispravno, bez izmjena.

### Pristupačnost
6. Link logotipa imao `aria-label` različit od vidljivog teksta (Lighthouse *label-content-name-mismatch*). → bez `aria-label`, dodat skriven tekst „— početna stranica“.
7. **Dugme „Doniraj“ na mobilnom nije imalo ime** (tekst sakriven sa `display:none`). → tekst se sakriva samo vizuelno.
8. `/predavanja` i `/hutbe`: skok `h1 → h3` (kartice). → skriveni `h2` „Rezultati“.
9. Kontrast (axe): prošli datumi u kalendaru (providnost 0,6 → 2,6:1), brojevi pravila ponašanja (2,0:1), „± 1 dan“ u vaktiji (3,9:1). → prošli datumi se prigušuju pozadinom/isprekidanim okvirom umjesto providnosti; brojevi u `--color-accent`; uklonjena providnost.
10. Gornja traka (datum, bismillah, linkovi) bila van landmark regiona → `<aside aria-label="Datum i brzi linkovi">`.
11. Dugme teme imalo i `aria-pressed` i promjenjivu oznaku (kontradiktorno za čitače) → samo oznaka („Uključi tamnu/svijetlu temu“).
12. Dugme „Kopiraj“: `aria-live` se postavljao tek poslije promjene teksta (ne bi se najavilo) → live region je u markupu.
13. Površine za dodir < 40 px: `.btn--sm` 36→40 px, logo i „Doniraj“ u zaglavlju 44 px, bedževi-linkovi (kategorija/serija) dobijaju nevidljivu površinu od 40 px, `.link-arrow`, linkovi predavača i kategorija na profilu imama 40 px, strelice kalendara 44 px, datum u gornjoj traci 38 px (visina trake).

### Raspored / mobilni
14. **Horizontalni skrol na 360 px na 11 stranica predavanja** (dug naslov u „putanji“ — `max-width: 40ch` šire od ekrana). → posljednja stavka putanje se skraćuje (`min-width:0`, elipsa).
15. Datum u gornjoj traci se sjekao usred riječi → elipsa.
16. Mobilni meni (otvaranje, fokus na „Zatvori“, zarobljen fokus kroz 40× Tab, Esc vraća fokus na dugme, zaključan skrol), filter panel na mobilnom (zatvoren; otvoren ako link ima filtere; bedž sa brojem), mjesečna tabela vaktije u svom kontejneru — provjereno, ispravno.

### Performanse
17. **CSS je blokirao iscrtavanje** (2 fajla, ~2,1 s na sporom 4G). → `build.inlineStylesheets: 'always'` u `astro.config.mjs` (≈9 KB gzip po stranici).
18. **Fontovi**: `@fontsource-variable/*/index.css` je deklarisao i ćirilicu, grčki i vijetnamski. → novi `src/styles/fonts.css` sa samo latin + latin-ext za Manrope/Fraunces (Amiri/Aref Ruqaa: arabic + latin, kao i prije). Manrope (tekst) se predučitava (`<link rel="preload">`).
19. **CLS**: `/pretraga` 0,168 (zamjena fonta prelama pomoćni tekst), `/vaktija` 0,082 (red sa datumom se prelamao tek kad skripta upiše datum). → rezervni fontovi sa izmjerenom metrikom (`Manrope Fallback` = Arial 100 %, `Fraunces Fallback` = Georgia 92 %, ascent/descent iz fajlova fontova) i rezervisana širina datuma u `VaktijaToday`. Sada CLS ≤ 0,01 svuda.
20. LCP slika na `/predavanja` bila `loading="lazy"` → prva kartica `fetchpriority="high"` (bez lazy). Fasada playera: `sizes` prema stvarnoj širini + `sddefault.jpg 640w` (provjereno da postoji za sve snimke sa maxres sličicom).
21. JS po stranici: 0–2 modula, ukupno 51 KB za cijeli sajt (vaktija 15,7 KB je najveći, `adhan`). Sličice: lazy + 16:9 `mqdefault`/`hqdefault` srcset. `dist/` = 11 MB (od toga 113 HTML stranica sa ugrađenim CSS-om i JSON podacima).

### Tekst (lektura, ijekavica)
22. Naslovi snimaka (prikazni `naslovCist`, kroz `data/predavanja-ispravke.json` da prežive osvježavanje): „osećaju“→„osjećaju“, „Dijela“→„Djela“ (3×), „Najlepša“→„Najljepša“, „griješnika“→„grješnika“, „pripadnost Islamu“→„islamu“, „Allahov poslanik“→„Poslanik“, „Sura Smak svijeta - El-Kijame Surah Al-Qiyamah 1-19“→„Sura El-Kijame (Smak svijeta), ajeti 1–19“ (i 20–40). Originalni YouTube naslov (`naslov`) nije diran.
23. Hidžretski mjeseci različito pisani: zaglavlje „džumade-l-ula“, vaktija „džumadel-ula“ → ujednačeno na „džumadel-ula, rebiul-evvel, zul-hidždže…“.
24. „Pretražuje se 132 stavki“ → pravilna množina („132 stavke“). Kalendar (čitač ekrana): „1448. h.. Danas“ → „1448. h. (danas)“.
25. **Grad dupliran u adresi** („Jalija 69, 36300 Novi Pazar, Novi Pazar, Srbija“ u podnožju i na početnoj) → `punaAdresa()`.
26. Nije pronađena ekavica ni engleski ostaci u UI tekstu (pretraga cijelog izlaznog teksta + atributa `aria-label/title/alt/placeholder`).

### Tačnost sadržaja
27. Činjenica „Svečano otvorena: 8. mart 2024. (**ramazan** 1445.)“ — 8. 3. 2024. je bio ša'ban; ramazan je počeo 11. 3. (izvor kaže „uoči ramazana“). → „8. mart 2024. (uoči ramazana 1445. h. g.)“; na početnoj se pojašnjenje u zagradi ne prikazuje (kratka pločica).
28. `/mekteb`: „Imam:“ se prikazivao za svakoga čija uloga sadrži riječ „imam“ (npr. „Glavni imam Medžlisa…“ bi se pogrešno prikazao kao imam džamije). → samo ako podaci izričito kažu „imam džamije“. Trenutno se niko ne prikazuje kao imam džamije (u skladu sa `istrazivanje.md`). Sve `null` vrijednosti prikazuju Placeholder; primjeri imaju bedž „Primjer“.

### Štampa
29. Vaktija štampana iz tamne teme: tamne površine + svijetlosivi tekst. → u `@media print` uvijek svijetli tokeni (crno na bijelom).

## 3. Nove funkcije (zadatak QA-a)

**Kontakt forma bez e-maila i servisa** (`src/components/forms/ContactForm.astro`): novi način `drustvene`
(automatski kad nema `PUBLIC_FORM_ENDPOINT` ni `dzamija.kontakt.email`, a postoji Instagram/Facebook).
Dugme „Pripremi poruku“ provjerava polja (iste poruke, sažetak grešaka, fokus), sastavlja poruku
(„Selam alejkum, Tema: …, tekst, ime, e-mail“), kopira je u međuspremnik i prikazuje:
„Poruka je kopirana — zalijepite je u poruku na Instagramu…“ + dugmad **Otvori poruku na Instagramu**
(`https://ig.me/m/dzamija_na_jaliji`, izvedeno iz Instagram adrese) i **Facebook stranica**. Ako kopiranje
ne uspije, otvara se polje sa tekstom za ručno kopiranje. E-mail je tada neobavezan (odgovor stiže porukom).
Status je `role="status"`, dugme Instagrama je fokusirano i opisano statusom. Kad se postavi e-mail ili
endpoint, radi staro ponašanje (mailto / fetch) bez izmjena.

**Prijave za mekteb i halke** (`src/components/forms/PrijavaDugme.astro`, koristi ga `/mekteb`): sa e-mailom →
`mailto` kao prije; bez e-maila → link na Instagram poruku koji u istom kliku (sinhrono, prije otvaranja nove
kartice) kopira pripremljen tekst prijave, uz napomenu, link na Facebook i „Prikaži tekst prijave“. Bez JS-a
je to običan link. `/donacije` „Pitajte porukom na Instagramu“ vodi direktno u DM.
Zajednički `src/lib/kopiraj.ts` (Clipboard API + sinhrona rezerva) koriste i „Kopiraj“ i „Podijeli“.

Provjereno: prazna forma → 2 greške + fokus na „Ime“; ispravna → status, ispravan tekst u međuspremniku,
link `ig.me`; mekteb → tekst prijave u međuspremniku; „Podijeli“ bez Web Share API-ja → „Link je kopiran.“

## 4. Predavanja, vaktija, kalendar, pretraga, tema — rezultati

- Filteri imam/kategorija/serija/godina i kombinacije (fasetni brojevi, opcije sa 0 onemogućene), poredak
  najnovije/najstarije/najgledanije/redoslijed dijelova (samo uz seriju: Dio 1, 2, 3…), pretraga
  „džennet“ = „dzennet“ = „DŽENNET“ (5), „Jašarević“ = „jasarevic“ (62), više riječi; „Učitaj još“ (+12, fokus
  na 13. karticu), uklanjanje čipova, „Poništi filtere“, prazno stanje + reset, URL sa filterima otvoren u
  novoj kartici daje isti prikaz, „Nazad“ sa detalja vraća filtere, nepoznati parametri se ignorišu,
  `/hutbe` (36, bez filtera kategorije), bedževi sa detalja i linkovi sa profila imama vode na ispravne filtere.
- Detalj: fasada učitava `youtube-nocookie.com/embed/…?autoplay=1` tek na klik (fokus na iframe), prethodni/
  sljedeći dio, 6 srodnih, „Podijeli“.
- Vaktija: poklapa se sa tabelom iz `docs/vaktija.md` (28/29. 3. prelazak na ljetno, 21. 6., 25/26. 10. prelazak
  na zimsko, 21. 12.); odbrojavanje tačno i u noći promjene vremena (02:25 CEST → zora 04:29 CET = 3:04 h);
  isti rezultat u zoni Asia/Tokyo; CSV sa BOM-om; štampa sakriva navigaciju. Widget na početnoj radi.
- Kalendar: Prethodni/Sljedeći/Ovaj mjesec, `?m=2026-11`, odbrojavanja do Ramazana/bajrama, važni datumi.
- Pretraga: `?q=` radi, ikonica u zaglavlju vodi na `/pretraga/`, „Nema rezultata“ stanje.
- Tema: prekidač, pamćenje u `localStorage` između stranica, bez bljeska (skripta u `<head>` prije CSS-a),
  obje teme čitljive (axe 0 kontrast grešaka u obje).

## 5. Lighthouse (mobilni, lokalni preview)

| Stranica | Performanse | Pristupačnost | Najbolje prakse | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 97 (prije 87) | 100 (97) | 100 | 100 | 2,3 s | 0,004 |
| `/predavanja/` | 97 (95) | 100 (95) | 100 | 100 | 2,4 s | 0,002 |
| `/predavanja/MI8D-L8UAJg/` | 92 (92) | 100 (97) | 100 | 100 | 3,2 s | 0 |
| `/vaktija/` | 98 (95) | 100 | 100 | 100 | 2,2 s | 0,029 (prije 0,082) |
| `/pretraga/` | 98 (90) | 100 | 100 | 100 | 2,1 s | 0,001 (prije 0,168) |
| `/kontakt/` | 98 (97) | 100 | 100 | 100 | 2,1 s | 0,001 |
| `/mekteb/`, `/kalendar/` | 97 | 100 | 100 | 100 | 2,1 s | ≤ 0,006 |

## 6. Poznata ograničenja (nije moguće riješiti u kodu)

- Podaci koje džemat treba dostaviti (ostaju jasno označeni placeholderima): e-mail i telefon, vrijeme džume i
  sabaha u džamiji, raspored mekteba i halki, fotografije (galerija, hero, OG slika), podaci za donacije,
  biografije/fotografije predavača, potvrda imama džamije.
- Instagram poruka (`ig.me`) zahtijeva prijavljen Instagram nalog; kopiranje u međuspremnik u vrlo starim
  pregledačima može ne uspjeti — tada se nudi ručno kopiranje.
- Detalj predavanja: LCP 3,0 s zbog YouTube sličice (JPEG sa i.ytimg.com; WebP varijanta nije zagarantovana za
  sve snimke). Keš zaglavlja (GitHub Pages ~10 min) se ne mogu podesiti.
- CSS je ugrađen u svaku stranicu (bolji prvi prikaz, ali se ne kešira između stranica; ~9 KB gzip).
- Filteri koriste `history.replaceState` (po specifikaciji): pojedinačne promjene filtera ne prave nove
  unose u istoriji; „Nazad“ sa detalja vraća posljednje stanje.
- Vaktija je izračunata (±1–2 min od zvanične), hidžretski datumi ±1 dan — naznačeno na stranicama.
- Putanje u `manifest.webmanifest` su fiksne (`/mosqueJalija/`) — pri prelasku na vlastiti domen promijeniti ručno.
- Web Share API (mobilni) nije testiran na stvarnom uređaju; testirana je rezerva (kopiranje linka).

---

## Drugi krug (završni)

Datum: 25. 10. 2026. Produkcijski build sa `.env` (`npx astro preview --port 4332`), JSON build bez varijabli
(`/tmp/dist-qa2-json`, lokalni statički server), živi sajt (ugrađeni pregledač). Headless Chrome preko privremenih
puppeteer-core/axe-core/Lighthouse u scratch folderu — `package.json` nije diran.

### Šta je testirano

| Oblast | Rezultat |
|---|---|
| Build | `npm run build` i JSON build: 124 stranice, 0 grešaka/upozorenja. `npx astro check`: 0/0/0 (prije: 8 upozorenja u `scripts/transkripcija/obrada.mjs` — ispravljeno) |
| Linkovi | 257 fajlova u oba builda: 0 pokvarenih internih linkova/resursa, sve sa `/mosqueJalija/`. Sitemap 121 URL, bez `/admin` i `/obavjestenja/prikaz`; `robots.txt` ispravan; jedinstveni naslovi/opisi (noindex: 404, admin, prikaz) |
| Raspored/konzola | svih 124 stranice × 360/768/1280 × svijetla/tamna: 0 grešaka u konzoli, 0 horizontalnog skrola, tačno jedan vidljiv `h1`, površine za dodir ≥ 40 px (jedini nalaz: OSM pločice na `/kontakt` pri 6. uzastopnom učitavanju — ograničenje OSM servera, samostalno čisto) |
| Pristupačnost | axe (WCAG 2.1 AA + best-practice) na 35 tipova stranica + dinamička stanja (filteri, `?q=`, `#t-N`, `?mjesec=`, `?m=`, `?program=`) × 375/1280 × obje teme, i JSON build: **0 prekršaja** |
| Živi sajt | početna, `/raspored` (9 termina iz baze), `/upis` (Supabase obrazac), predavanje `#t-111`, `/admin` (ekran prijave), `/galerija`, `/predavanja` na 375/768/1280, svijetla/tamna: bez grešaka i skrola |

Funkcionalno (sve prolazi): filteri/pretraga (ž=z, „džennet“ 5)/sortiranje (dio 1, 2, 3)/„Učitaj još“ (fokus)/URL u novoj
kartici; transkript — otvaranje, pretraga sa `<mark>`, Esc, kopiranje (tekst sa vremenima), `.txt`, klik na vrijeme →
iframe `start=93`, drugi klik → `seekTo`, `#t-111` otvara i označava odlomak; `/pretraga` sa rezultatima iz transkripata
(link `#t-N`); vaktija (odbrojavanje, mjesec, CSV), kalendar, kibla (137,4°, London 119,0°), tesbih (pamćenje, potvrda
brisanja), zekat (2,5 %, nisab), ramazan (29 dana, `.ics`/CSV), podsjetnik (`.ics` 155 termina, CRLF, redovi ≤ 75 B);
obrasci: validacija (sažetak, fokus), roditelj se pojavi za uzrast < 15, `?program=`, po jedno slanje → 201 + kartica
uspjeha; `/raspored` iz baze; „Danas u džamiji“ (nedjelja bez termina → skriveno); dopuna obavještenja; lightbox
(Esc, strelice, potpis, fokus nazad); fotografije imama; `/donacije` samo placeholderi, bez izmišljenog računa;
`/admin` validacija oba obrasca bez slanja e-maila; JSON build: „Supabase nije podešen“ + rezervni obrasci.

### Pronađene greške i ispravke

1. **Lighthouse početna 85** (FCP 2,9 s: prije prvog prikaza preuzimalo se ~480 KB, među njima arapski Amiri 106 KB za
   ajet daleko ispod). → `content-visibility: auto` za sekcije ispod prvog ekrana (`index.astro`): **94**, CLS pri skrolu 0.
2. Mekteb/ostali podmeniji (desktop): prelazak mišem otvori podmeni, a klik na isto dugme ga zatvori. → prvi klik poslije
   hover-otvaranja ostavlja meni otvoren (`Header.astro`).
3. `/obavjestenja/prikaz`: HEAD provjera statične stranice davala 404 u konzoli za svaku objavu iz baze. → lista statičnih
   slugova ugrađena u stranicu (bez mrežnog zahtjeva; radi i bez Supabase-a).
4. Pretraga: `/alati/*` nisu bili u indeksu („zekat“ nije nalazio kalkulator) → dodati sa ključnim riječima; status
   „1 rezultat“ uz 10 pogodaka u transkriptima → „2 rezultata … (i 10 u transkriptima predavanja)“.
5. `#t-N` otvarao transkript, ali „Pokreni video“ je kretao od početka → kreće od tog odlomka.
6. axe: kontrast prošlog izlaska sunca u vaktiji (2,4:1; providnost) → prigušena boja; tesbih „−1“ (oznaka ≠ tekst).
7. Dodir < 40 px: vremena u transkriptu (32 px), datum u gornjoj traci (38), čip aktivnog filtera (34), „Imami i
   predavači“ na profilu, „Izvor: mesihat.org“ na početnoj, vibracija u tesbihu → 40+ px (nevidljivo proširenje gdje
   raspored ne smije da se mijenja).
8. Sitno: `<img>` bez `src` u lightboxu; „tačnost oko 0 m“ u kibli; „in šā Allāh“ → „inšallah“.

### Lighthouse (mobilni, lokalni preview)

| Stranica | Perf. | Pristupačnost | Najbolje prakse | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| `/` | 94 (prije 85) | 100 | 100 | 100 | 2,9 s | 0,004 |
| `/predavanja/` | 98 | 100 | 100 | 100 | 2,3 s | 0,002 |
| `/predavanja/-QKGCdrGiRQ/` | 94 | 100 | 100 | 100 | 3,0 s | 0,013 |
| `/pitaj-imama/` | 97 | 100 | 100 | 100 | 2,3 s | 0,001 |
| `/upis/`, `/raspored/` | 98 | 100 | 100 | 100 | 2,2 s | ≤ 0,05 |

### Testni redovi u bazi (obrisati u adminu)

- `poruke`: 1 red — ime „TEST — obrisati“, `test@example.com`
- `prijave`: 1 red — ime_prezime i roditelj „TEST — obrisati“, `test@example.com`, tel. 060 000 0000, program Mekteb, uzrast 9
- `pitanja`: 1 red — ime „TEST — obrisati“, `test@example.com`

### Preostala ograničenja

- Prijava urednika (magic link/kod, lozinka) nije testirana do kraja — namjerno bez slanja e-maila i bez diranja `urednici`/auth.
- `pretraga-transkripti.json` ≈ 790 KB (267 KB gzip) — učitava se tek kod upita od 3+ znaka.
- Transkripti su mašinski (govor sa ekavskim/dijalekatskim oblicima ostaje kako je izgovoren; jasno označeno).
- Živi sajt još nema ispravke iz ovog kruga dok orkestrator ne objavi commit.
- Ostala ograničenja iz prvog kruga (§6) važe i dalje (placeholderi za kontakt, donacije, džumu; fotografije Mešihata traže dozvolu).

## Treći krug — provjera objavljenog sajta (25. 10. 2026.)

Sve na javnoj adresi https://gorcevicharis.github.io/mosqueJalija/, poslije pojednostavljenja dizajna:

| Provjera | Rezultat |
|---|---|
| Svih 124 stranice na 375 px (sitemapa + 404 + admin + prikaz) | status 200, 0 horizontalnog skrola, svaka ima `h1`, 0 JS grešaka, 0 grešaka u konzoli |
| Interni linkovi (121 stranica iz sitemape, 230 jedinstvenih linkova) | 0 pokvarenih |
| Filteri predavanja: 8 imama, 7 kategorija, 4 serije, 2 godine, 3 kombinacije, pretraga „dzennet“ / „DŽENNET“, sortiranje | 27/27 tačno, broj rezultata jednak broju u `data/predavanja.json`, filteri ostaju u URL-u |
| „Učitaj još“, najstarije prvo, /hutbe | 12 → 24; prvo je „Opasnost javnog razvrata“ (23. 7. 2025., najstarije); /hutbe = 36 |
| Mobilni filteri | dugme „Filteri“ otvara panel, filter radi, nema skrola |
| Mape | sve vode na Google Maps; u buildu nema OpenStreetMap ni Apple Maps linkova |
| Admin | javni /admin povezan sa bazom; nalog admina se prijavio linkom iz e-maila; u bazi potvrđena prava urednika i admina (pisanje testirano u poništenoj transakciji) |
| Build / `astro check` | 124 stranice, 0 grešaka; 0 grešaka, 0 upozorenja, 0 napomena |

### Poređenje sa uzorom (arapdzamija.rs) — automatska provjera objavljenog sajta

Za svaku funkciju iz `docs/analiza-uzora.md` („Funkcije koje Jalija sajt mora imati“) provjereno je da
postoji na objavljenom sajtu: **44/44**.

- **Isto kao uzor:**
  - početna sa kaligrafijom, fotografijom, vaktijom, predavanjima, obavještenjima i mrežama;
  - header sa padajućim menijem i dugmetom „Doniraj“; top bar sa hidžretskim datumom; footer;
  - vaktija sa mjesečnom tabelom, zvaničnim izvorom i napomenama;
  - hutbe i predavanja sa filterima; detalj sa plejerom, punim tekstom (transkript), srodnim
    predavanjima i YouTube linkom;
  - mediji; kontakt sa Google mapom i formom; obavještenja sa kategorijama; objave;
  - donacije bez izmišljenog računa; historijat sa izvorima;
  - pravila ponašanja (14 kartica, uzor ima 13); Kur'an i hadisi (ajet i hadis dana);
  - dove sa kopiranjem; mekteb sa rasporedom i prijavom; učenje Kur'ana; galerija sa lightboxom.
- **Više od uzora:**
  - imami sa fotografijama i profilima; pretraga cijelog sajta, uključujući transkripte;
  - islamski kalendar; islamski alati; online upis; sedmični raspored; Pitaj imama;
  - RSS; instalacija na telefon (PWA); admin panel.
- **Svjesno izostavljeno:** stranica „Obnova“ uzora, jer je Džamija na Jaliji nova (otvorena 2024.),
  pa obnove nije bilo.

Nepoznati podaci su na sajtu vidljivo označeni („Podatak nedostaje“): kontakt (5 oznaka), donacije (8),
mekteb (2), vaktija (3, sabah i džuma u džamiji), profili Metjahića i Salihovića (2).
Mobilni prikaz je provjeren u emulaciji telefona (375 px, Android Chrome user-agent, touch), ne na
fizičkom uređaju.
