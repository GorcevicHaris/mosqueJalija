# Analiza uzora — https://arapdzamija.rs

Analizirano 25. 10. 2026. (curl SSR HTML + pregledač za stranice koje se učitavaju na klijentu).
Uzor = sajt **Hasan Čelebi (Arap) džamije, Novi Pazar**. Tehnički: React SSR (TanStack Start), Supabase
kao baza (obavještenja, objave, hutbe, predavanja, ajeti/hadisi, galerija se vuku iz baze → stranice
prvo pokazuju "Učitavanje…"), ikonice Lucide, fontovi Cormorant Garamond (naslovi) + Inter (tekst),
`theme-color #063f2b` (tamno zelena). Jezik `bs`, latinica, ijekavica.

## Globalni elementi

### Gornja traka (top bar)
- Adresa kao link na Google Maps (`1. maja, Novi Pazar`), e-mail (`mailto:`), arapski/latinični
  "Bismillāhi r-Rahmāni r-Rahīm" desno.

### Glavna navigacija (header, sticky)
- Logo (slika) + "Hasan Čelebi (Arap) džamija / NOVI PAZAR".
- Stavke: **Početna · Namazi (/vaktija) · Hutbe · Predavanja · Edukacija ▾ · Džemat ▾ · Mediji · Kontakt**
  - **Edukacija ▾** (Radix dropdown): Pravila ponašanja, Kur'an i hadisi, Učenje Kur'ana.
  - **Džemat ▾**: Objave, Mekteb, Historijat, Obnova, Donacije, Galerija.
- Ikonica zvona → /obavjestenja; dugme **Doniraj** (istaknuto, CTA); hamburger meni na mobilnom.

### Footer
- Logo, naziv, grad, kratka misija ("Mjesto namaza, znanja, zajedništva i dobročinstva… Neka je selam
  na svakog posjetioca"), ikonice Facebook / Instagram / YouTube.
- Kolona **Brzi linkovi** (13 linkova: Vaktija, Obavještenja, Objave, Hutbe, Predavanja, Mekteb,
  Historijat, Obnova, Donacije, Kur'an i hadisi, Učenje Kur'ana, Mediji, Kontakt).
- Kolona **Kontakt** (adresa, e-mail). Copyright "© 2026 … · Novi Pazar".

### SEO
- `<title>` "Stranica — Naziv džamije", OG/Twitter meta (summary_large_image), meta description.
  Nema JSON-LD (prilika za nas: `Mosque` schema).

## Stranice

| Ruta | Sekcije i sadržaj | Interaktivno | Podaci |
|---|---|---|---|
| `/` Početna | 1) Hero: velika tonirana fotografija džamije, eyebrow "Zvanična stranica džemata", H1 naziv, grad, 2 rečenice o džamiji, CTA dugmad (Pogledaj vaktiju / Doniraj / Kontakt). 2) **Najnovija obavještenja** (kartice, link "Sva obavještenja"). 3) **Današnja vaktija** — 6 vremena (Sabah, Izlazak sunca, Podne, Ikindija, Akšam, Jacija), datum, izvor vaktija.ba, link Mjesečna vaktija, napomena "Sabah-namaz u džamiji klanja se 20 min prije izlaska sunca". 4) **Kulturno-historijsko naslijeđe** — kratki tekst + 3 statistike (1528. najstariji spomen / Stara čaršija / 2021. obnova), linkovi Historijat i Obnova. 5) **Edukativne stranice** — 2 kartice (Pravila ponašanja, Kur'an i hadisi). 6) **Društvene mreže** — 3 dugmeta. 7) **Kontakt / Posjetite nas** — adresa, e-mail, imam džamije, dugme "Pošaljite poruku" + OSM iframe mapa sa markerom. | Vaktija se učitava (fetch `api.vaktija.ba/vaktija/v1/110/...`), OSM mapa | vaktija, obavještenja iz baze |
| `/vaktija` Namazi | PageHero "Vaktija · Novi Pazar". **Danas**: datum + 6 vremena + link "Zvanični izvor". Napomena o sabahu. **Mjesečni pregled**: tabela (Dan, Sabah, Izlazak, Podne, Ikindija, Akšam, Jacija) za cijeli mjesec. | Fetch API vaktija.ba (dnevno + mjesečno), nema odbrojavanja, nema označenog sljedećeg namaza, nema biranja mjeseca | vaktija.ba, lokacija id 110 = Novi Pazar |
| `/hutbe` | PageHero "Džuma · Hutbe · Provjereni tekstovi, prevodi i snimci". Lista kartica: datum, kategorija (badge), naslov, hatib, "Otvori hutbu". ~60 hutbi. | **Pretraga** (input "Pretraga po nazivu ili hatibu…") + **filter kategorija** (select: Iman, Porodica, Džemat, Ramazan, Ahlak, Tefsir sure El-Bekare, Kur'anska kazivanja, Pokajanje, Hadždž, …) | baza |
| `/hutbe/[slug]` detalj | Nazad "Sve hutbe", datum · kategorija, naslov, hatib, link **YouTube**, sekcija "Bosanski" sa **punim tekstom hutbe** (više paragrafa). | — (YouTube kao vanjski link) | tekst hutbe |
| `/predavanja` | Isto kao hutbe: kartice (datum, kategorija, naslov, predavač, "Otvori predavanje"), ~115 stavki. Predavači: kurra hfz Sabahudin ef. Jerebičanin, hfz. Edin ef. Redžepović, muftija hfz. Abdurrahman ef. Kujević, mr. Fuad ef. Omerbašić, hfz. Zikret ef. Mustafić… | Pretraga po nazivu/predavaču + select kategorija (Tefsir sure El-Bekare/El-Ahzab/El-Vakia/El-Kasas/El-Kijame/Er-Rahman, Kur'anski primjeri, Džuma, Iman, Ahlak, Porodica, Džemat, Ramazan, Dobročinstvo, Pokajanje, Sabur, Kur'anska kazivanja, Tefsir, Ashabi) | baza |
| `/predavanja/[slug]` | Kao detalj hutbe (tekst + YouTube link). | — | |
| `/mediji` | 3 velike kartice: Facebook (ime stranice), Instagram (@handle), YouTube (@handle). Tekst "Provjerene objave na jednom mjestu" + e-mail. | linkovi | statično |
| `/kontakt` | PageHero "Kontakt i lokacija". Kartice: Adresa (link na Google Maps), E-mail, Imam džamije. "Zvanični profili" (FB/IG/YT). OSM iframe mapa + "Otvori u Google Maps". | **Nema kontakt forme** (samo mailto) | statično |
| `/obavjestenja` | PageHero "Aktuelno · Obavještenja". Hronološka lista: datum, kategorija (HALKE, PREDAVANJE, DŽUMA, OSTALO), naslov, više paragrafa, linkovi "Otvori link" (na objavu/hutbu/Google Forms prijavu). | linkovi na Google Forms (prijave) | baza |
| `/objave` | PageHero "Iz našeg džemata · Objave — fotografije i zapisi". Kartice sa slikom (plakat/foto), datum, kategorija, tekst (npr. raspored halki po danima, najava predavanja), "Pročitaj više →". | — | baza + Supabase storage slike |
| `/objave/[id]` | Naslov, datum, "Nazad na sve objave", velika slika, tekst. | **Lightbox**: "Pogledaj cijelu sliku", "Otvori galeriju" | |
| `/donacije` | PageHero "Sadaka i vakuf · Donacije — koristite samo podatke koje direktno potvrdi uprava". 3 kartice namjene (Održavanje džamije, Mekteb, Aktivnosti džemata). "Zvanični podaci za uplatu" — **nema broja računa**, dugme "Zatražite podatke e-mailom" (mailto sa subject) + Facebook; upozorenje. | mailto | statično |
| `/historijat` | Hero slika + "Džamija koja pamti razvoj grada" (2 paragrafa). **Timeline** "Važne godine" (1528 popis / XVI v. graditelj / 1689 požar / 2021 obnova). Sekcije "Kako je nastao naziv" (predanje, jasno označeno kao nepotvrđeno) i "Džamija i Stara čaršija" (munara). CTA na Obnovu. | — | statično |
| `/obnova` | Slika + "Sačuvana za nove generacije". 3 kartice (Sigurnost, Očuvanje identiteta, Povratak džematu). Datum ponovnog otvaranja + tekst. Povezane stranice (Historijat, Galerija). | — | statično |
| `/pravila-ponasanja` | Citat-uvod, **13 kartica s ikonicom** (Ulazak sa poštovanjem, Čistoća, Tišina, Telefoni, Ne ometati, Ne prolaziti ispred klanjača, Hutba, Džuma, Poštovanje džematlija, Čuvanje prostora, Djeca, Bez smeća, Bez rasprava). Napomena "edukativno, za šerijatska pitanja obratite se imamu". | — | statično |
| `/kuran-hadisi` | **Ajet dana** (prevod Korkut, arapski tekst, referenca "Kur'an, sura, 3:159 — Prijevod: Besim Korkut · kategorija · datum"), **Hadis dana** (prevod, arapski, "Hadis bilježi …", kratko pojašnjenje), dugme "Vidi ostalo", **Tematske kategorije** sa brojem objava (Ahlak 29, Dobročinstvo 30, Iman 54, Sabur 14…). | rotacija po danu, "Vidi ostalo" | baza |
| `/mekteb` | Kartica "Kur'an · Znanje · Ahlak", 2 paragrafa o mektebu, imam, "Šta djeca uče", dugmad "Upit za mekteb" (mailto) i "Objave džamije" (Instagram). | — (nema forme ni rasporeda) | statično |
| `/ucenje-kurana` | Lista snimaka (sure 1–8) koje uči imam: thumbnail, redni broj, naziv sure, učač. | **Klik-za-učitavanje YouTube (youtube-nocookie) embed** u kartici | statično |
| `/galerija` | Mreža fotografija sa naslovom albuma i datumom. Napomena o privatnosti. | **"Učitaj još"** (paginacija), lightbox | baza |

## Zapažanja (dobro i loše kod uzora)
- **Dobro**: jasna, iskrena politika podataka ("samo provjereno", nema izmišljenih računa — donacije idu
  preko e-maila); vaktija iz zvaničnog izvora; puni tekstovi hutbi; pretraga + filter; raspored halki.
- **Slabosti**: sadržaj se učitava na klijentu ("Učitavanje…" bez JS-a, loš SEO za hutbe/obavještenja);
  vaktija bez odbrojavanja i bez isticanja sljedećeg namaza; nema džume vremena; nema kontakt forme;
  mapa bez objašnjenja kako doći; nema tamne teme; nema JSON-LD; nema dova; YouTube video se ne
  ugrađuje na detalju hutbe (samo vanjski link); kategorije bez dijakritika ("Dzuma", "Dobrocinstvo").

## Funkcije koje Jalija sajt mora imati
1. Header sa logom/kaligrafijom, glavni meni + padajući "Edukacija" i "Džemat", istaknuto **Doniraj**,
   ikonica obavještenja, mobilni meni; top bar (adresa→mapa, e-mail ili YouTube, Bismillah).
2. **Početna**: hero (foto ili ornament dok nema slike), najnovija obavještenja, današnja vaktija,
   najnovija predavanja/hutbe (sa YouTube kanala), kratka historija + statistike, edukacija kartice,
   društvene mreže, kontakt + mapa.
3. **Vaktija**: danas, mjesečna tabela, + (bolje od uzora) **odbrojavanje do sljedećeg namaza**,
   isticanje trenutnog/sljedećeg vakta, biranje mjeseca, napomena o džumi. Napomena: uzor koristi
   `https://api.vaktija.ba/vaktija/v1/110/{god}/{mj}/{dan}` (110 = Novi Pazar) — zvanična vremena IZ;
   mi računamo sa `adhan` (statički sajt) — preporuka: provjeriti razliku i dodati link "zvanična
   vaktija: vaktija.ba/novi-pazar".
4. **Hutbe** i **Predavanja**: kartice, **pretraga + filter kategorija + filter imama**, detalj sa
   **ugrađenim YouTube playerom** (klik-za-učitavanje, youtube-nocookie), opis, srodna predavanja,
   serije (npr. tefsir po ajetima).
5. **Imami/predavači**: lista i profil sa njihovim predavanjima (uzor nema — naša prednost).
6. **Obavještenja / Objave**: lista + detalj, kategorije (Halke, Predavanje, Džuma, Mekteb, Ostalo),
   placeholder dok džemat ne dostavi stvarne.
7. **Historijat / O džamiji**: timeline, činjenice sa izvorima, jasno označena predanja.
8. **Kur'an i hadisi**: ajet dana + hadis dana (rotacija po datumu), arapski + prevod + izvor,
   kategorije; + **Dove** (kopiranje teksta).
9. **Pravila ponašanja** (kartice sa ikonicama), **Mekteb** (opis + raspored/halke + upit),
   **Učenje Kur'ana** (klik-za-učitavanje embed).
10. **Mediji** (YouTube/FB/IG kartice), **Galerija** (lightbox, placeholder ako nema slika),
    **Donacije** (bez izmišljenih računa — upit kontaktom dok džemat ne potvrdi), **Kontakt** (mapa,
    "otvori u Google Maps / navigacija", forma → mailto ili servis).
11. Footer: misija, brzi linkovi, kontakt, društvene mreže.

## Ideje kako biti bolji od uzora
- Statički generisan sadržaj (sve vidljivo bez JS-a, odličan SEO) + JSON-LD `Mosque`, `VideoObject`.
- Odbrojavanje do sljedećeg namaza, isticanje aktivnog vakta, "Džuma danas/za X dana".
- Ugrađeni player i automatsko ažuriranje predavanja sa YouTube-a (GitHub Action).
- Filter po imamu i seriji, "nastavi gledati"/srodna predavanja, trajanje i datum na kartici.
- Tamna tema, pristupačnost (skip-link, fokus, kontrast AA).
- Dugme "Kopiraj" za dove i ajete, "Podijeli" (Web Share API).
- Kategorije sa dijakritikom i lijepim nazivima ("Džuma", "Dobročinstvo").
- Mapa: OSM embed + linkovi Google Maps / Apple Maps / "Navigacija do džamije".
- Jasne placeholder oznake gdje džemat treba dostaviti podatke (fotografije, račun, raspored).
