# Islamski alati (`/alati`)

Svi alati rade u pregledaču (mali vanilla TS u `<script>`), bez novih zavisnosti i bez slanja podataka.
Početni prikaz se generiše pri buildu (isti HTML kao u pregledaču → bez pomjeranja sadržaja).

## Fajlovi

| Putanja | Šta je |
|---|---|
| `src/pages/alati/index.astro` | pregled svih alata (kartice) + „Povezano na sajtu” |
| `src/pages/alati/kibla.astro` + `src/components/alati/KiblaKompas.astro` | pravac kible, SVG kompas, DeviceOrientation |
| `src/pages/alati/tesbih.astro` + `Tesbih.astro`, `src/lib/alati/tesbih.ts` | digitalni tesbih (preseti, arapski tekst) |
| `src/pages/alati/zekat.astro` + `ZekatKalkulator.astro`, `SadekatulFitr.astro`, `src/lib/alati/zekat.ts` | kalkulator zekata i sadekatul-fitr |
| `src/pages/alati/ramazan.astro` + `Imsakija.astro`, `src/lib/alati/ramazan.ts` | datum Ramazana, imsakija, odbrojavanje, CSV/ICS |
| `src/pages/alati/namaz-podsjetnik.astro` + `NamazPodsjetnik.astro` | obavještenja (Notification API) i `.ics` vaktija za mjesec |
| `src/components/alati/IpsQr.astro`, `src/lib/alati/ips.ts`, `src/lib/alati/qr.ts` | NBS IPS QR kod za donacije |
| `src/lib/alati/ics.ts` | iCalendar (VTIMEZONE Europe/Belgrade, VALARM, presavijanje redova) i CSV |
| `src/lib/alati/kibla.ts` | azimut ortodrome, udaljenost, strane svijeta |
| `src/lib/alati/alati.ts` | katalog alata i SVG ikonice |
| `src/components/alati/AlatKartica.astro`, `OstaliAlati.astro` | kartica alata, blok „Ostali alati” |

Ponovo se koriste: `src/lib/vaktija.ts` + `vaktija-config.ts` (kalibrisana vaktija), `src/lib/extras/hidzra.ts`
(Umm al-Qura), `PageHero`, `Placeholder`, tokeni i klase iz `global.css`.

## Kibla
- Formula: početni azimut velikog kruga, `θ = atan2(sin Δλ·cos φ2, cos φ1·sin φ2 − sin φ1·cos φ2·cos Δλ)`, Kaba 21,422487° N, 39,826206° E.
- **Džamija na Jaliji (43,148048, 20,524462): 137,4°** (jugoistok), udaljenost ≈ 3.005 km.
  Provjera formule na poznatim vrijednostima: London 119,0°, New York 58,5°, Sarajevo 134,8° — poklapa se sa
  objavljenim kalkulatorima kible. (Procjena „136–137°” iz zadatka je bila približna; tačno je 137,4°.)
- Lokacija korisnika: `navigator.geolocation` tek na dodir dugmeta, uz objašnjenje; koordinate se ne šalju/čuvaju.
- Živi kompas: `deviceorientationabsolute` (Android Chrome: `heading = 360 − alpha`), na iOS-u `deviceorientation`
  sa `webkitCompassHeading`; `DeviceOrientationEvent.requestPermission()` se poziva na dodir dugmeta. Ugao ekrana
  (`screen.orientation.angle`) se dodaje. Ako za 3,5 s nema podataka → tekst sa zamjenskim uputstvom. Vibracija kad je
  telefon okrenut ka kibli (±4°). Na uređajima bez dodira dugme je skriveno i prikazuje se objašnjenje.

## Tesbih
- Preseti: tesbihat poslije namaza (33/33/34, automatski prelaz), Subhanallah 33, Elhamdulillah 33, Allahu ekber 34
  (brzi izbor 33), La ilahe illallah 100, istigfar 100, salavat 100, slobodno brojanje; cilj po želji.
- Vibracija na svakih 33 i na cilju (samo nakon korisnikovog dodira, `userActivation`), tastatura: razmaknica/Enter
  (+1), Backspace (−1). Stanje u `localStorage` (`dzj-tesbih-v1`, uz try/catch). Poništavanje traži potvrdu (drugi klik).

## Zekat
- Nisab: 85 g zlata ili 595 g srebra × cijena po gramu koju **unosi korisnik** (RSD ili EUR); nema API-ja.
  Linkovi: LBMA (referentna cijena u USD/unci) i kursna lista NBS; ugrađen preračun USD/oz → cijena po gramu.
- Zlato po čistoći (24/22/18/14/9 k). Rezultat = 2,5 % neto imovine (imovina − kratkoročni dugovi) ako je ≥ nisab.
- Pamte se samo valuta i cijene metala (`dzj-zekat-cijene-v1`), iznosi imovine se ne čuvaju. Dugme „Štampaj”.
- Sadekatul-fitr: iznos se NE izmišlja — `IZNOS_PO_OSOBI` u `SadekatulFitr.astro` je `null` → Placeholder; kada
  Mešihat objavi iznos, upisati broj (RSD) i `GODINA`. Do tada korisnik upisuje iznos u polje (× broj članova).

## Ramazan
- Tekući ili sljedeći Ramazan: `hijriUDan(hy, 9, 1)` … `hijriUDan(hy, 10, 1) − 1` (Umm al-Qura, napomena ±1 dan).
  Trenutno: **Ramazan 1448: 8. 2. – 8. 3. 2027.**, bajram 9. 3. 2027. (orijentaciono).
- Imsakija: `izracunajDan()` za svaki dan; imsak = zora, iftar = akšam; na < 640 px samo imsak i iftar
  (ostali vakti u pejzažu, na širem ekranu i u štampi). Označeni: danas, petak, 27. noć.
- Odbrojavanje: van Ramazana do prvog imsaka; u Ramazanu do imsaka / iftara / sutrašnjeg imsaka.
- Izvoz: CSV (`;`, UTF-8 BOM) i `.ics` (imsak + iftar, izborni podsjetnik). Teravih: Placeholder.

## Podsjetnik za namaz
- Notification API dok je sajt otvoren: provjera svakih 15 s i pri povratku na karticu; poslani podsjetnici se
  pamte da se ne ponavljaju. Ako `new Notification` nije dozvoljen (Android Chrome), pokušava se
  `serviceWorker.getRegistration().showNotification` (sajt trenutno nema service worker), inače poruka na stranici.
  Na stranici su iskreno navedena ograničenja (radi samo dok je otvoreno; iOS samo kao PWA).
- „Dodaj vaktiju u kalendar”: `.ics` za tekući ili jedan od naredna dva mjeseca, odabrani vakti, VALARM
  (bez / 0–45 min), `DTSTART;TZID=Europe/Belgrade` + VTIMEZONE (CET/CEST), stabilni UID-ovi (ponovni uvoz ne duplira).

## IPS QR (donacije)
Upotreba (orkestrator stavlja na `/donacije`):
```astro
<IpsQr racun={dzamija.donacije.racun} primalac={dzamija.donacije.primalac} svrha={dzamija.donacije.svrha} />
```
Props `{ racun: string | null; primalac: string | null; svrha?: string | null }` (+ opciono `sifraPlacanja`,
podrazumijevano `289`, i `pozivNaBroj`). `racun === null` → Placeholder „Broj računa nije objavljen”; neispravan
kontrolni broj ili prazan primalac → odgovarajući Placeholder. Korisnik unosi iznos (brzi izbor 500–5.000 RSD) i
svrhu; QR se regeneriše odmah.

Format (NBS, Odluka o instant transferu, Prilog 1), provjeren na zvaničnom validatoru
`https://nbs.rs/QRcode/api/qr/v1/validate`:
`K:PR|V:01|C:1|R:<18 cifara>|N:<primalac, do 70 zn., najviše 3 reda>|I:RSD<iznos sa zarezom>|SF:<3 cifre>|S:<do 35 zn.>|RO:<opciono>`
- R: 18 cifara (3 banka + 13 sa vodećim nulama + 2 kontrolne), kontrola mod 97 — `normalizujRacun` prihvata
  „160-123456-54”.
- I: obavezan, decimalni **zarez** (`RSD1000,00`; tačka se odbija), 5–18 znakova.
- SF: prva cifra 1 ili 2 (289 = transakcije po nalogu građana, 221 = promet robe i usluga).
- RO: do 25 zn., prve dvije cifre su model; model 97 sa kontrolom mod 97.
- Znakove `|`, `\`, tipografske crtice i `€` validator odbija — `ocistiTekst` ih zamjenjuje.

QR enkoder (`qr.ts`) je napisan za projekat: bajt mod UTF-8, nivo M (NBS preporuka za štampu), verzije 1–40,
izbor maske po kaznama iz standarda. Testirano: 94 uzorka (sve verzije, nivoi L i M) dekodirana jsQR-om bez
greške; QR iscrtan u pregledaču je identičan (SHA-256 matrice) izlazu u Node-u, dekodiran tekst je prošao NBS
validator (`code 0, OK`) sa probnim računom `160-0000000123456-54`.

## Navigacija (dodaje orkestrator)
U `src/components/layout/nav.ts`, grupa „Korisno” — dodati `{ label: 'Islamski alati', href: '/alati', opis: 'Kibla, tesbih, zekat, imsakija, podsjetnik' }`.
Footer: link „Islamski alati” → `url('/alati')`.
