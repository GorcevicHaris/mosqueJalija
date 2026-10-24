# Dodaci: pretraga, islamski kalendar, RSS, manifest

Vlasnik: agent "dodaci". Fajlovi: `src/pages/pretraga.astro`, `src/pages/kalendar.astro`,
`src/pages/predavanja.xml.ts`, `src/pages/obavjestenja.xml.ts`, `public/manifest.webmanifest`,
`src/components/extras/**`, `src/lib/extras/**`.

## 1. Pretraga (`/pretraga`)

- **Indeks se pravi pri buildu** (`src/lib/extras/pretraga-indeks.ts`) i ugrađuje u stranicu kao
  `<script type="application/json">`. Sadrži: predavanja (naslovCist, imam, kategorija, serija i dio,
  datum), obavještenja/objave (naslov, kategorija, sažetak), dove (naslov, kategorija, izvor, početak
  prevoda), imame (ime, aliasi, uloga, broj predavanja) i statičke stranice iz menija (`nav.ts`) sa
  opisima i sinonimima (npr. „doniraj“ → Donacije, „sabah“ → Vaktija).
- Kompaktan oblik: nizovi umjesto objekata, a nazivi imama/kategorija/serija su tabele na koje
  predavanja pokazuju indeksom (~150 bajtova po predavanju).
- Stranice koje ne postoje u `src/pages` se ne indeksiraju (nema linkova na 404).
- **Pretraga u pregledaču** (`src/lib/extras/pretraga-pretrazi.ts`, `normalizuj.ts`):
  bez obzira na dijakritike (č/ć→c, š→s, ž→z, đ→dj, a za tekst sa „đ“ i varijanta đ→d), mala/velika
  slova i apostrofe (Ša'ban = saban). Sve riječi upita moraju se naći; pogodak u naslovu i na početku
  riječi nosi više bodova, pa datum (novije prvo).
- Rezultati su **grupisani** (Stranice, Predavanja i hutbe, Obavještenja, Dove, Imami), po 6 u grupi uz
  „Prikaži sve (N)“, filteri-čipovi po vrsti, **označeni pogoci** (`<mark>`), prazno stanje sa čestim
  pretragama i stanje „Nema rezultata“ sa savjetima.
- **Adresa** `?q=…` se ažurira dok se kuca (dijeljiv link); zaglavlje može voditi na
  `/pretraga?q=…` (forma je obična GET forma).
- **Tastatura:** `/` fokusira polje, `↓` iz polja na prvi rezultat, `↑`/`↓` kroz rezultate (sa prvog
  `↑` nazad u polje), `Esc` briše upit. Broj rezultata se najavljuje čitačima ekrana (`role="status"`).

## 2. Islamski kalendar (`/kalendar`)

- Računanje: `src/lib/extras/hidzra.ts` — `Intl.DateTimeFormat('en-u-ca-islamic-umalqura')` za brojeve,
  nazivi mjeseci na našem jeziku (Muharrem … Zul-hidždže, uz genitiv za „noć uoči 27. redžeba“).
  Datumi su interno „broj dana“ (UTC), bez problema sa vremenskim zonama.
- **Danas**: hidžretski i gregorijanski datum + napomena da hidžretski dan počinje akšamom.
- **Odbrojavanje** do sljedećeg važnog datuma (npr. „Do Ramazana: 123 dana“, „Sutra“, „Večeras“) i
  manja odbrojavanja do Ramazana, Ramazanskog i Kurban-bajrama.
- **Mjesečni prikaz** (tabela, sedmica od ponedjeljka): veliki broj = gregorijanski, mali = hidžretski
  datum; označeni su danas (`aria-current="date"`), petak, početak hidžretskog mjeseca i važni dani.
  Navigacija Prethodni/Sljedeći, „Ovaj mjesec“, strelice ←/→ (i PageUp/PageDown); `?m=GGGG-MM` u adresi.
  Ispod mreže je spisak početaka mjeseci i važnih datuma u tom mjesecu.
- **Važni datumi** tekuće i sljedeće hidžretske godine: Nova hidžretska godina (1. muharrem), Ašura
  (10. muharrem), Mevlud (12. rebiul-evvel), Lejletul-regaib (noć uoči prvog petka u redžebu, označeno
  „približno“), Lejletul-mi'radž (noć uoči 27. redžeba), Lejletul-berat (noć uoči 15. ša'bana), početak
  Ramazana, Lejletul-kadr (noć uoči 27. ramazana), Ramazanski bajram (1. ševval), Arefat (9. zul-hidždže),
  Kurban-bajram (10. zul-hidždže). Za noći se prikazuje gregorijanski datum večeri kada noć počinje.
  Prošli datumi su prigušeni, sljedeći je istaknut.
- **Ograda** na stranici: datumi su izračunati; zvanične datume objavljuje Rijaset/Mešihat Islamske
  zajednice, moguće odstupanje ±1 dan.
- Početni prikaz se generiše pri buildu (radi i bez JS-a), a skripta ga ponovo iscrtava za stvarni
  današnji dan korisnika. HTML prave iste funkcije na serveru i u pregledaču (`kalendar-render.ts`).

## 3. RSS

- `/predavanja.xml` — 50 najnovijih predavanja: naslov, link na `/predavanja/<id>/`, datum, opis
  (imam · kategorija · serija · trajanje + opis sa YouTube-a ako postoji), kategorije, `media:thumbnail`.
- `/obavjestenja.xml` — obavještenja i objave (bez stavki sa `placeholder: true`), sa punim tekstom u
  `content:encoded`.
- RSS 2.0 je pisan ručno (`src/lib/extras/rss.ts`; `@astrojs/rss` nije instaliran), sa ispravnim
  escapovanjem i apsolutnim URL-ovima (`site` + `base`) i `atom:link rel="self"`. Provjereno parsiranjem.

## 4. Web manifest

`public/manifest.webmanifest`: naziv „Džamija na Jaliji“, kratko „Jalija“, `start_url`/`scope`/`id`
`/mosqueJalija/`, `theme_color` `#0c3b2e` (isti kao `<meta name="theme-color">` i `--inverse-bg`),
`background_color` `#f7f1e3` (`--color-bg`), ikonica `favicon.svg` (sizes „any“) i prečice (Vaktija,
Predavanja, Kalendar, Pretraga).

- **Pažnja:** putanje u manifestu su fiksne (`/mosqueJalija/`). Ako se pređe na vlastiti domen
  (`BASE=/`), treba ih ručno promijeniti.
- Za bolju instalaciju na Androidu/iOS-u preporučuju se i PNG ikonice 192×192 i 512×512 (+ „maskable“)
  — kada dizajner doda npr. `public/icon-192.png` i `public/icon-512.png`, dopisati ih u `icons`.

## Integracija (orkestrator)

U `<head>` (BaseLayout):

```astro
<link rel="manifest" href={url('/manifest.webmanifest')} />
<link rel="alternate" type="application/rss+xml" title="Predavanja — Džamija na Jaliji" href={url('/predavanja.xml')} />
<link rel="alternate" type="application/rss+xml" title="Obavještenja — Džamija na Jaliji" href={url('/obavjestenja.xml')} />
```

Navigacija: zaglavlje i footer već vode na `/pretraga` i `/kalendar`. Preporuka: u footer dodati
„RSS predavanja“ (`/predavanja.xml`) i „RSS obavještenja“ (`/obavjestenja.xml`); u `nav.ts` grupa
„Korisno“ može dobiti stavku `{ label: 'Islamski kalendar', href: '/kalendar', opis: 'Hidžretski datumi, Ramazan i bajrami' }`.
