# Podaci o predavanjima (YouTube)

Sva predavanja, hutbe i kratki snimci na sajtu dolaze sa YouTube kanala džamije
**[@DžamijanaJaliji](https://www.youtube.com/@D%C5%BEamijanaJaliji)**
(ID kanala: `UCyw1ppQVijYlaQ6BicgZTVg`).

| Fajl | Šta sadrži | Ko ga piše |
|---|---|---|
| `data/predavanja.json` | sva videa (`Predavanje[]`), najnovija prva | skripta |
| `data/imami.json` | govornici koji se pojavljuju u naslovima (`ImamOsnovno[]`) | skripta |
| `data/kategorije.json` | kategorije (`Kategorija[]`) | skripta (iz configa) |
| `data/serije.json` | serije predavanja (`Serija[]`) | skripta |
| `data/predavanja-ispravke.json` | **ručne ispravke** po videu | čovjek |
| `scripts/podaci-config.json` | imena imama, pravila za kategorije i serije | čovjek |
| `scripts/cache/youtube-sirovo.json` | sirovi podaci sa YouTube-a (keš) | skripta |

Fajlove `data/predavanja.json`, `imami.json`, `kategorije.json` i `serije.json` **ne treba ručno
mijenjati** — skripta ih pri svakom pokretanju ponovo gradi. Ispravke idu u
`data/predavanja-ispravke.json` ili u `scripts/podaci-config.json`.

## Kako se podaci preuzimaju

Skripta `scripts/update-videos.mjs` (Node, bez npm paketa) pokreće se sa:

```bash
npm run update-videos               # nova videa + osvježavanje pregleda i naslova
npm run update-videos -- --sve      # ponovo preuzmi detalje svih videa
npm run update-videos -- --dry-run  # samo ispiši sažetak, ništa ne zapisuj
npm run update-videos -- --offline  # bez mreže: ponovo primijeni pravila/ispravke na keš
npm run update-videos -- --rss      # preskoči yt-dlp i koristi samo RSS (test rezerve)
```

Potreban je [yt-dlp](https://github.com/yt-dlp/yt-dlp) — na PATH-u ili putanja u varijabli `YTDLP`
(`YTDLP=/putanja/do/yt-dlp npm run update-videos`).

Koraci:
1. `yt-dlp --flat-playlist` za tabove **Videos** i **Shorts** → lista svih videa (naslov, pregledi).
2. `yt-dlp --flat-playlist` za tab **Playlists** i svaku playlistu → članstvo u serijama.
3. `yt-dlp -j --skip-download` za nova videa (ili sva uz `--sve`) → tačan datum objave
   (`upload_date`), trajanje u sekundama, opis, broj pregleda.
4. Sličica: `maxresdefault.jpg` ako postoji (provjereno HEAD zahtjevom, rezultat se pamti u kešu),
   inače `hqdefault.jpg` (uvijek postoji). Za Shorts uvijek `hqdefault.jpg`.
5. Primjena pravila (dolje) i ručnih ispravki → upis u `data/*.json`, provjera da svaki
   `imam`/`kategorija`/`serija` postoji. Ako provjera ne prođe, ništa se ne zapisuje.

**Rezerva (RSS):** ako yt-dlp ne radi (YouTube ponekad blokira IP adrese GitHub Actions servera),
skripta čita RSS feed kanala `https://www.youtube.com/feeds/videos.xml?channel_id=UCyw1ppQVijYlaQ6BicgZTVg`
(zadnjih 15 videa) i dodaje nova videa. RSS **ne daje trajanje** — tada je `trajanje: 0`
(UI to mora prikazati kao "nepoznato"), a puni podaci se dopune pri sljedećem uspješnom
pokretanju yt-dlp-a. U RSS režimu se ništa ne briše: sva ranija predavanja se zadržavaju.

**Brisanje:** ako yt-dlp uspješno vrati listu kanala, a neki video iz keša više nije na njoj
(obrisan ili privatan), uklanja se sa sajta. Zaštita: ako bi nestalo više od 20 % videa odjednom,
ništa se ne briše (vjerovatno je greška u preuzimanju).

**Automatski:** `.github/workflows/update-videos.yml` se pokreće svakog ponedjeljka u 05:00 UTC
(i ručno: Actions → "Osvježavanje predavanja sa YouTube-a" → Run workflow). Ako ima izmjena,
commituje ih na `main` i pokreće deploy workflow (push napravljen GitHub tokenom sam po sebi ne
pokreće druge workflowe, zato se deploy pokreće eksplicitno).

## Heuristike

Sva pravila su u `scripts/podaci-config.json`. Regularni izrazi se primjenjuju na
**normalizovan** tekst: mala slova, bez dijakritika (`Džuma` → `dzuma`, `Jašarević` → `jasarevic`).

### Imam
- Za svakog imama u configu postoje `imeObrazac` i `prezimeObrazac`. Prepoznaje se prezime
  (uz padežne nastavke, npr. "Jašarevića"), opcionalno sa imenom, "ef." i titulama ispred
  (`Hfz.`, `hfz`, `Muftija`, `M.`, `prof.`, inicijal). Zato se prepoznaju sve varijante:
  "Hfz.Admir ef.Jašarević", "Hfz Admir ef  Jašarević", "Hfz Admir Jašarević", "Abdurrahman"/"Abdurahman",
  "Salihovic"/"Salihović"…
- Prvo se traži u naslovu, pa u opisu. Ako je ime nađeno → `imamPotvrdjen: true`.
- "Edin Redžepović" i "Edin Salihović" su **različite osobe** — razlikuju se po prezimenu.
- Ako u naslovu postoji nepoznat govornik u obliku "Hfz./Muftija/Prof./ef. Ime Prezime", skripta
  ga sama doda (slug `ime-prezime`) i ispiše upozorenje — tada ga treba dodati u config sa
  lijepim `punoIme`.
- Video bez imena u seriji u kojoj svi ostali dijelovi imaju istog imama → taj imam, ali
  `imamPotvrdjen: false` (pogođeno, treba provjeru).
- `aliasi` u `data/imami.json` = varijante iz configa + sve varijante stvarno nađene u naslovima.

### Kategorija (prvo pravilo koje odgovara)
| Kategorija | Pravilo |
|---|---|
| `kratki-video` | video sa Shorts taba |
| `tefsir` | video iz serije `tefsir-sure-jusuf` ili "tefsir" u naslovu |
| `ucenje-kurana` | naslov sadrži "Sura"/"سورة" i video je kraći od 400 s |
| `halka-hadisa` | "Halka hadisa" u naslovu |
| `hutba` | "Dzuma/Džuma/Hutba" u naslovu **ili u opisu** (većina hutbi ima opis "Hutba 05.12.2025") |
| `ostalo` | nije pronađen govornik (npr. "Poklon umra") |
| `predavanje` | sve ostalo (podrazumijevano) |

Slugovi `hutba` i `predavanje` se ne smiju mijenjati (koristi ih kod sajta).

### Serija i dio
- Video iz playliste → serija te playliste (playlista "TEFSIR SURE JUSUF" → `tefsir-sure-jusuf`).
  Nova playlista koja nije u configu automatski postaje serija (slug iz naziva playliste).
- Pravila `naslovObrazac`/`opisObrazac` u configu (npr. opis "Tefsir sure Jusuf" — za nove dijelove
  koji još nisu dodani u playlistu).
- Naslov oblika "Naziv N.dio" (npr. "Duhovna opskrba vjernika 5.dio") → automatska serija "Naziv".
  Video istog naziva bez broja se pridružuje toj seriji.
- `serijaDio` = broj iz "N.dio"; ako ga nema, dijelovi se numerišu hronološki
  (npr. "Djela koja uvode u Džennet" bez broja = 1. dio, učenje El-Kijame 1–19 = 1, 20–40 = 2).

### Čist naslov (`naslovCist`)
Iz originalnog naslova se uklanjaju: ime govornika sa titulama, "Džamija na Jaliji", "Dzuma",
"Hutba DD.MM.YYYY", "HALKA HADISA" (to je kategorija), oznaka "N.dio" (ide u `serijaDio`),
samostalni datumi, arapski dio naslova ako postoji i latinični, separatori (`|`, ` - `, `;`).
RIJEČI VELIKIM SLOVIMA se pišu malim, prvo slovo veliko. Ako ništa ne ostane: "Hutba DD.MM.YYYY."
(datum iz naslova/opisa, inače datum objave). Shorts sa naslovom koji je samo datum →
"Kratki video (DD.MM.YYYY.)". Dijelovi serije bez posebnog naslova (npr. "Duhovna opskrba
vjernika") imaju isti `naslovCist` — UI treba prikazati i `serijaDio`.

### Opis
Opis sa YouTube-a bez šablonskih linija ("Džamija na Jaliji", "Hutba 05.12.2025", sam datum).
Ako ništa ne ostane → `null`.

### Datum
`datum` je datum **objave na YouTube-u** (`upload_date`), ne datum održavanja hutbe
(on je često u opisu i obično je dan ranije).

## Ručne ispravke

U `data/predavanja-ispravke.json` dodajte objekat po YouTube ID-u (dio linka poslije `watch?v=`):

```json
{
  "_uputstvo": "…",
  "tb5geb6Gxcg": { "kategorija": "hutba" },
  "HcPnSj8Ph34": { "imam": "admir-jasarevic" },
  "Dnqhzz-b4gw": { "naslovCist": "Isječak iz hutbe o grijesima", "imam": "admir-jasarevic", "imamPotvrdjen": false }
}
```

Dozvoljena polja: `imam` (slug ili `null`), `imamPotvrdjen`, `kategorija`, `serija` (slug ili `null`),
`serijaDio`, `naslovCist`, `opis`. Postavljen `imam` se smatra potvrđenim osim ako se navede
`"imamPotvrdjen": false`. Ispravke se primjenjuju poslije automatskih pravila, pa preživljavaju svako
osvježavanje. Poslije izmjene: `npm run update-videos -- --offline` (bez mreže) ili sačekajte
sljedeće automatsko pokretanje.

Novi imam (ili ljepše ime postojećeg), nova kategorija ili nova serija → `scripts/podaci-config.json`.

## Stanje (početni podaci, 25.10.2026.)

81 video (75 sa taba Videos + 6 Shorts), 1 playlista. Nijedan video nije preskočen.

### Videa bez imama ili sa nepotvrđenim imamom

| Video | Datum | Originalni naslov | Kategorija | imam | imamPotvrdjen |
|---|---|---|---|---|---|
| [HcPnSj8Ph34](https://www.youtube.com/watch?v=HcPnSj8Ph34) | 2025-12-19 | POKLON UMRA !!!  Džamija na Jaliji | ostalo | null | false |
| [Dnqhzz-b4gw](https://www.youtube.com/watch?v=Dnqhzz-b4gw) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |
| [GhdekPqiJd4](https://www.youtube.com/watch?v=GhdekPqiJd4) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |
| [m_aOyTS120Q](https://www.youtube.com/watch?v=m_aOyTS120Q) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |
| [WA79h85BTKU](https://www.youtube.com/watch?v=WA79h85BTKU) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |
| [eTjV_BlQIqk](https://www.youtube.com/watch?v=eTjV_BlQIqk) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |
| [fZ_cV_h1pcc](https://www.youtube.com/watch?v=fZ_cV_h1pcc) | 2025-12-12 | 12 December 2025 | kratki-video | null | false |

Nema videa sa pogođenim (nepotvrđenim) imamom — svi dijelovi serija imaju ime u naslovu.
Shorts od 12.12.2025. su vjerovatno isječci iz hutbe "Posljedice grijeha" (12.12.2025.), ali to
nije potvrđeno, pa je imam ostavljen prazan.

### Za provjeru
- `tb5geb6Gxcg` "Ne moraš učiniti svako dobro djelo…" — opis je samo "Džamija na Jaliji 19.06.2026",
  bez riječi "hutba", pa je kategorija `predavanje`. Trajanje (~10 min) liči na hutbu; ako jeste,
  dodajte `{ "kategorija": "hutba" }`.
- `zOmGidryvss` "Musliman je muslimanu brat" — vertikalni snimak od 5 min bez opisa → `predavanje`.
- `43grkcWOjiQ` "Opasnost javnog razvrata" (hfz. Zikret Mustafić, 41 min, bez opisa) → `predavanje`.
- `7GERYBiHmIU` i `wL4N83HAKGk` imaju u opisu godinu 2025 umjesto 2026 (greška na kanalu; ne utiče na `datum`).
- Pravopis naslova je originalan (npr. "Dijela koja uvode u Džennet"); naziv serije je ispravljen u
  "Djela koja uvode u Džennet".
