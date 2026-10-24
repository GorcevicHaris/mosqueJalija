# Izvještaj — sajt Džamije na Jaliji

## Ukratko

Napravljen je kompletan statički sajt za **Džamiju na Jaliji (Jalija 69, Novi Pazar)** po uzoru na
arapdzamija.rs, sa svim njegovim sekcijama i nizom dodataka. Sajt ima ~115 stranica: 81 stranica
predavanja sa plejerom, 8 profila predavača i sve informativne stranice. Build prolazi bez grešaka,
a provjera tipova (`astro check`) daje 0 grešaka.

- Repozitorij: https://github.com/GorcevicHaris/mosqueJalija
- Javna adresa (kad se uključi GitHub Pages, vidi dolje): https://gorcevicharis.github.io/mosqueJalija/

## ⚠️ Jedan korak koji morate uraditi vi

**GitHub Pages ne radi na privatnom repozitoriju uz besplatni plan** (GitHub je to odbio pri
uključivanju). Vidljivost repozitorija nisam mijenjao, to je vaša odluka. Dvije opcije:

1. **Repozitorij učiniti javnim**: Settings → General → Danger Zone → Change visibility → Public.
   Zatim Settings → Pages → Source: **GitHub Actions**, pa Actions → "Deploy na GitHub Pages" → Run workflow.
2. Ostaviti ga privatnim i preći na GitHub Pro, pa isti korak Settings → Pages → GitHub Actions.

Dok se to ne uradi, korak "deploy" u GitHub Actions će javljati grešku. Sam build se i dalje provjerava
pri svakom pushu.

## Šta je urađeno

### Stranice

| Stranica | Šta ima |
|---|---|
| **Početna** | Bismilla (kaligrafija), opis džamije, današnja vaktija sa odbrojavanjem, najnovija predavanja, obavještenja, ajet/hadis dana (mijenja se svaki dan), mekteb i halke, donacije, društvene mreže |
| **O džamiji** | Historija (vakuf, gradnja, otvaranje 8. 3. 2024.), činjenice sa izvorima, lokacija |
| **Galerija** | Mreža sa lightbox-om. Trenutno prazna: nema slobodnih fotografija, čeka vaše slike |
| **Predavanja** | 81 video. Filteri po imamu, kategoriji, seriji i godini; pretraga bez obzira na dijakritike; sortiranje (najnovije, najstarije, najgledanije, redoslijed dijelova); "Učitaj još"; svi filteri u URL-u (link se može podijeliti) |
| **Stranica predavanja** | YouTube plejer (učitava se tek na klik, zbog brzine i privatnosti), navigacija kroz seriju, srodna predavanja, dijeljenje |
| **Hutbe** | Predavanja sa unaprijed uključenim filterom "Hutba (džuma)" (36 hutbi) |
| **Imami** | 8 predavača, profil (biografija sa izvorima) + sva njegova predavanja |
| **Vaktija** | Današnja vremena, odbrojavanje do sljedećeg namaza, mjesečna tabela (listanje mjeseci, štampa, CSV), oznaka džume |
| **Islamski kalendar** *(dodatak)* | Hidžretski i gregorijanski datumi, važni datumi (Ramazan, bajrami, Lejletul-kadr…) sa odbrojavanjem |
| **Obavještenja / Objave** | 4 stvarna obavještenja sa Instagrama džamije (halke, Škola Kur'ana, sufara) + automatska "Novo predavanje" |
| **Dove** | 21 dova: arapski, transliteracija, prevod, izvor; filter po kategoriji |
| **Kur'an i hadisi** | Ajet i hadis dana + 33 ajeta i 32 hadisa |
| **Pravila ponašanja, Učenje Kur'ana, Mekteb i halke, Mediji** | Ekvivalenti stranica sa uzora |
| **Donacije** | Struktura spremna (kopiranje računa jednim klikom). Podaci o računu NEDOSTAJU |
| **Kontakt** | OpenStreetMap mapa, navigacija (Google/Apple Maps), forma |
| **Pretraga** *(dodatak)* | Pretraga cijelog sajta (predavanja, dove, obavještenja, stranice), tastatura `/` |
| **RSS** *(dodatak)* | `/predavanja.xml` i `/obavjestenja.xml` |

### Dizajn
- Zelena/zlatna/krem paleta, geometrijski ornamenti (osmokraka zvijezda / girih, ručno rađen SVG), oblik
  mihraba/luka za vaktiju na početnoj.
- Fontovi: Fraunces (naslovi), Manrope (tekst), Amiri (arapski), Aref Ruqaa (kaligrafija). Svi se
  poslužuju sa samog sajta, bez Google Fonts.
- Svijetla i tamna tema (prekidač u zaglavlju, pamti izbor, poštuje podešavanje telefona, bez bljeska).
- Potpuno responzivno od 360px, mobilni meni, pristupačnost (skip-link, fokus, aria, kontrast).
- SEO: naslovi i opisi po stranici, canonical, Open Graph i Twitter slike, JSON-LD (`Mosque`, `VideoObject`),
  sitemap, robots.txt.
- Može se instalirati na telefon kao aplikacija (web manifest i ikone).

### Tehnika
- **Astro 7**, statički export, bez backend-a i bez frontend frameworka (vrlo malo JavaScript-a).
- Deploy: GitHub Actions → GitHub Pages (`.github/workflows/deploy.yml`).
- **Vaktija se računa lokalno** (biblioteka `adhan`) i kalibrisana je prema zvaničnoj vaktiji
  (vaktija.ba, Novi Pazar). Na svim danima 2026. godine 82% vremena je tačno u minut, a gotovo sva ostala
  odstupaju najviše 1 minut. Detalji: `docs/vaktija.md`.
- **Videi se osvježavaju automatski** svakog ponedjeljka (`.github/workflows/update-videos.yml`, yt-dlp,
  sa RSS rezervom). Ručne ispravke idu u `data/predavanja-ispravke.json` i ostaju poslije svakog
  osvježavanja.

## Odluke koje sam donio (pošto niste bili dostupni)

1. **Astro** umjesto Next.js: za statički sajt je brži i jednostavniji, sa manje JavaScript-a.
2. **Ijekavica** (obavještenja, dova, predavanje), kao na uzoru i na kanalu džamije.
3. **Ništa nije izmišljeno.** Svaki nepoznat podatak (e-mail, telefon, račun, vrijeme džume, slike)
   prikazan je na sajtu kao jasna oznaka "Podatak nedostaje".
4. **Niko nije označen kao "imam džamije"**, jer nijedan izvor to ne potvrđuje. Hfz. Admir ef. Jašarević
   drži 62 od 81 predavanja, ali službenu ulogu treba da potvrdite.
5. Lični brojevi telefona predavača sa plakata za upis **nisu** objavljeni.
6. **Kategorije** su određene iz naslova i opisa: hutba (36), tefsir (25), predavanje (8), kratki video (6),
   učenje Kur'ana (3), halka hadisa (2), ostalo (1). **Serije**: Tefsir sure Jusuf (25 dijelova), Duhovna
   opskrba vjernika (5), Sura El-Kijame (2), Djela koja uvode u Džennet (2).
7. Kontakt forma: dok nema e-mail adrese, poruka se kopira i šalje preko Instagrama/Facebooka džamije.
   Kad dobijemo e-mail (ili Formspree), forma šalje direktno.
8. Prevodi ajeta, hadisa i dova su urađeni po uzoru na ustaljene prevode (Korkutov prevod je zaštićen
   autorskim pravom), sa tačnim izvorima. **Preporuka: neka ih imam pregleda.**

## Šta treba da mi dostavite

### Najvažnije
1. **Fotografije džamije** (spolja, munara, unutrašnjost, učionica, aktivnosti) uz dozvolu za objavu, za
   naslovnu, galeriju i sliku za dijeljenje na mrežama. **Logo**, ako postoji.
2. **Kontakt**: zvanični e-mail i telefon džamije.
3. **Podaci za donacije**: primalac, banka, broj računa / IBAN / SWIFT, svrha uplate.
4. **Vrijeme džume** (zimi/ljeti) i vrijeme klanjanja sabaha u džamiji.
5. **Imam džamije**: ime, kratka biografija i fotografija; ostali (mujezin, uprava džemata) po želji.

### Sadržaj
6. **Mekteb**: dani, termini, uzrasti, način upisa. **Stalni raspored halki.**
7. **Historija**: kapacitet, arhitekta/izvođač, površina, broj munara, arapski naziv (ako postoji).
8. **Biografije i fotografije predavača**, posebno Muhamed Metjahić i Edin ef. Salihović (o njima nisam
   našao ništa), te željena titula za hfz. Abdurahmana ef. Kujevića.
9. Koja je **Facebook stranica** zvanična (pronađene su dvije; koristi se ona koja se predstavlja kao zvanična).
10. **Pregled prevoda** ajeta, hadisa i dova od strane imama.

### Ispravke predavanja (provjerite)
Upisuju se u `data/predavanja-ispravke.json` (uputstvo je u samom fajlu):
- `tb5geb6Gxcg` "Ne moraš učiniti svako dobro djelo…" je označeno kao **predavanje**, a možda je hutba.
- `zOmGidryvss` i `43grkcWOjiQ` nemaju opis i označeni su kao **predavanje**. Provjerite kategoriju.
- 6 kratkih videa (Shorts) od 12. 12. 2025. i "Poklon umra" **nemaju imama**. Ako znate ko govori, dopišite.
- Datum je datum objave na YouTube-u. Hutbe su obično održane dan ranije (petak).
- Kompletna lista po imamima i kategorijama: `docs/predavanja-podaci.md`.

## Dokumentacija u repozitoriju
- `README.md`: pokretanje, deploy, osvježavanje videa, izmjena sadržaja
- `docs/ARHITEKTURA.md`: struktura i pravila
- `docs/analiza-uzora.md`: analiza arapdzamija.rs
- `docs/istrazivanje.md`: šta je pronađeno o džamiji, sa izvorima
- `docs/predavanja-podaci.md`: kako se obrađuju videi, ispravke
- `docs/vaktija.md`: proračun i kalibracija vaktije
- `docs/funkcionalnosti.md`, `docs/dodaci.md`: opis funkcija
- `docs/QA-izvjestaj.md`: rezultati testiranja
