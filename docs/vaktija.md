# Vaktija — računanje i kalibracija

Vaktija se računa **u pregledaču** (statički sajt, bez backenda) bibliotekom
[`adhan`](https://github.com/batoulapps/adhan-js) 4.4.6. Kod: `src/lib/vaktija.ts`,
podesivi parametri: `src/lib/vaktija-config.ts`. Koordinate se uvijek čitaju iz
`data/dzamija.json` (`koordinate`) — trenutno Jalija 69, Novi Pazar (43.148048, 20.524462).

Referenca za tačnost: zvanična vaktija Islamske zajednice na **vaktija.ba**, lokacija
**Novi Pazar** (`https://api.vaktija.ba/vaktija/v1/110/...`, isti izvor koristi i uzor arapdzamija.rs).
Na stranici se uvijek linkuje zvanični izvor: https://vaktija.ba/novi-pazar.

## Ključno otkriće: kako nastaje zvanična vaktija za Novi Pazar

Poređenjem cijele 2026. godine (`/vaktija/v1/110/2026` i `/vaktija/v1/77/2026`):

> **Novi Pazar = Sarajevo + stalna razlika u minutama za svaki mjesec** (razlika je ista za svaki dan
> u mjesecu; zora i izlazak dijele jednu razliku, ikindija/akšam/jacija drugu, podne je uvijek −8).

| Mjesec | Zora/Izlazak | Podne | Ikindija/Akšam/Jacija |
|---|---|---|---|
| jan | −7 | −8 | −10 |
| feb | −7 | −8 | −9 |
| mar | −8 | −8 | −8 |
| apr | −9 | −8 | −8 |
| maj | −10 | −8 | −7 |
| jun | −11 | −8 | −4 |
| jul | −10 | −8 | −4 |
| avg | −10 | −8 | −7 |
| sep | −9 | −8 | −8 |
| okt | −8 | −8 | −9 |
| nov | −7 | −8 | −10 |
| dec | −6 | −8 | −10 |

Zato direktno astronomsko računanje za koordinate Novog Pazara **ne može** dati ±1–2 min
(najbolji pokušaj sa slobodnim uglovima i pomacima: do 4–8 min greške; čisto astronomski do 11 min,
npr. akšam u junu). Umjesto toga emuliramo zvanični postupak:

1. `adhan` računa vremena za **Sarajevo** (43.8563, 18.4131) sa parametrima ispod,
2. dodaje se korekcija (stalni pomak + sezonski članovi), zaokruži se na minut,
3. dodaje se mjesečna razlika iz tabele za Novi Pazar.

Tabela se primjenjuje ako su koordinate džamije unutar `radiusKm` (30 km) od Novog Pazara; u
suprotnom (druga lokacija u budućnosti) vaktija se računa direktno za koordinate džamije sa istim
uglovima i korekcijama (≈ astronomski tačno, ali ne nužno identično zvaničnoj tabeli).

## Parametri (`vaktija-config.ts`)

| Parametar | Vrijednost | Napomena |
|---|---|---|
| `fajrAngle` (zora) | 18° | najbolje poklapanje (85 % dana tačno u minut) |
| `ishaAngle` (jacija) | 16,1° | fit 14–20° u koraku 0,1° |
| `madhab` | šafijski (sjena 1×) | ikindija |
| `korekcije` c0 | zora +0,05, izlazak −6,15, podne +0,96, ikindija −0,10, akšam +5,99, jacija −0,65 min | "ihtijat" zvanične vaktije: izlazak ~6 min ranije, akšam ~6 min kasnije, podne ~1 min kasnije |
| `korekcije` sezonski | 2 harmonika po danu u godini | dobijeni metodom najmanjih kvadrata na 2026.; upijaju razliku algoritma zvanične tabele i adhan-a |
| `timeZone` | Europe/Belgrade | ljetno/zimsko vrijeme rješava `Intl` — radi isto bez obzira na zonu posjetioca |

Za jednostavniji model dovoljno je ostaviti samo c0 (prvi broj u svakom redu `korekcije`): tada
je odstupanje i dalje ≤ 2 min, ali sa manje tačnih pogodaka (≈ 55 % umjesto 82 %).

## Rezultat poređenja (cijela 2026., 365 dana × 6 vremena = 2190 vrijednosti)

| Vakat | tačno | ±1 min | ±2 min |
|---|---|---|---|
| Zora | 353 | 12 | 0 |
| Izlazak sunca | 266 | 99 | 0 |
| Podne | 350 | 15 | 0 |
| Ikindija | 219 | 144 | 2 |
| Akšam | 288 | 77 | 0 |
| Jacija | 327 | 38 | 0 |
| **Ukupno** | **1803 (82 %)** | **385** | **2** |

Najveće odstupanje: **2 minute** (dva dana, ikindija). Provjera u zonama America/Los_Angeles,
Asia/Tokyo, Pacific/Kiritimati daje identične rezultate (računanje ne zavisi od zone posjetioca).

Primjeri (izračunato / zvanično, Novi Pazar):

| Datum | Zora | Izlazak | Podne | Ikindija | Akšam | Jacija |
|---|---|---|---|---|---|---|
| 15. 1. 2026. | 05:28 / 05:28 | 07:05 / 07:05 | 11:49 / 11:49 | 14:04 / 14:04 | 16:30 / 16:30 | 17:55 / 17:55 |
| 29. 3. 2026. (prelazak na ljetno) | 04:47 / 04:47 | 06:20 / 06:21 | 12:44 / 12:44 | 16:15 / 16:15 | 19:07 / 19:07 | 20:27 / 20:28 |
| 21. 6. 2026. | 02:29 / 02:29 | 04:46 / 04:46 | 12:41 / 12:41 | 16:51 / 16:51 | 20:34 / 20:34 | 22:30 / 22:30 |
| 25. 10. 2026. (prelazak na zimsko) | 04:29 / 04:29 | 05:59 / 05:59 | 11:23 / 11:23 | 14:12 / 14:12 | 16:45 / 16:45 | 18:04 / 18:04 |
| 21. 12. 2026. | 05:27 / 05:27 | 07:06 / 07:05 | 11:37 / 11:37 | 13:44 / 13:45 | 16:07 / 16:07 | 17:34 / 17:34 |

Napomena: API je dostupan kroz Cloudflare; pri većem broju zahtjeva vraća stranicu "Just a moment"
(zato je kalibracija rađena na 2026. godini; ostale godine nisu mogle biti preuzete u ovoj sesiji).
Ako IZ promijeni tabelu razlika, ažurirati `tabela.razlike` u `vaktija-config.ts`.

## Kako ponovo kalibrisati

1. Preuzeti godinu: `curl https://api.vaktija.ba/vaktija/v1/110/GGGG > np.json` i
   `.../v1/77/GGGG > sa.json` (Sarajevo).
2. Razlike po mjesecima = `np − sa` (moraju biti konstantne u mjesecu) → `tabela.razlike`.
3. Za Sarajevo izračunati sirova adhan vremena (bez zaokruživanja, `Rounding.None`) i fitovati
   `t_zvanično − t_adhan = c0 + a1·cos w + b1·sin w + a2·cos 2w + b2·sin 2w` po vaktu
   (najmanji kvadrati) → `korekcije`.

## Prikaz

- `VaktijaToday` (`compact` na početnoj, puni na /vaktija): 6 vremena, isticanje trenutnog vakta
  (između izlaska sunca i podne nema "trenutnog") i sljedećeg, odbrojavanje u sekundi, gregorijanski
  i hidžretski datum (`Intl` kalendar `islamic-umalqura`, uz napomenu ±1 dan). Build iscrtava
  `--:--`, skripta popunjava (bez pomjeranja rasporeda); u ponoć (po Beogradu) se dan sam osvježi.
- `/vaktija`: mjesečna tabela sa navigacijom (`?mjesec=GGGG-MM` u adresi), današnji dan istaknut,
  petak označen "Džuma", štampa (CSS za print), preuzimanje mjeseca kao CSV.
- Sabah u džamiji: `sabahNapomena` / `sabahMinutaPrijeIzlaska` u configu (trenutno nepoznato →
  placeholder). Ako se postavi broj minuta, tabela dobija kolonu "Sabah u džamiji".
