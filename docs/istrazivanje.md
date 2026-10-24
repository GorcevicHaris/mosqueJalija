# Istraživanje — Džamija na Jaliji

Stanje: 25. 10. 2026. Sve tvrdnje u `data/*.json` imaju izvor; nepotvrđeno je `null` ili `potvrdjeno: false`.

## 1. Koja je ovo džamija? — POTVRĐENO: Novi Pazar, Srbija

| Dokaz | Izvor |
|---|---|
| Mešihat IZ u Srbiji: „Svečano otvorena džamija na Jaliji”, 8. 3. 2024., naselje Jalija u **Novom Pazaru** | https://mesihat.org/2024/03/08/svecano-otvorena-dzamija-na-jaliji/ |
| Isti izvještaj (SANA) na Sandžak TV | https://sandzak.tv/svecano-otvorena-dzamija-na-jaliji/ |
| OSM: objekat `building=mosque`, **Jalija 69**, Novi Pazar (kućni broj iz zvaničnog adresnog registra RS `ref:RS:kucni_broj=6530434`) | https://www.openstreetmap.org/way/1443189625 |
| sr.wikipedia „Spisak džamija u Srbiji”: „Džamija na Jaliji — Jalija 69 — Novi Pazar” | https://sr.wikipedia.org/sr-el/Списак_џамија_у_Србији |
| Instagram `@dzamija_na_jaliji` („Džamija na Jaliji ١٤٤٥/2024”, link na YouTube kanal, hashtag #novipazar) | https://www.instagram.com/dzamija_na_jaliji/ |
| Facebook „Džamija na Jaliji — Zvanična stranica Džamije na Jaliji” | https://www.facebook.com/p/D%C5%BEamija-na-Jaliji-61557235081713/ |
| Kanal: hutba „sačuvajmo Rogoznu” (Rogozna = planina kod Novog Pazara); gosti hatibi koji drže i u Arap džamiji u Novom Pazaru (hfz. Edin Redžepović, hfz. Ferid Fijuljanin, hfz. Zikret Mustafić) | YouTube + https://www.arapdzamija.rs/predavanja |

Druge „Jalije” (Zenica, Pljevlja — Hadži-Hasanova džamija na Jaliji, srušena 1963.) isključene: nema veze s kanalom.

### Koordinate (pokreću vaktiju)
- **43.148048, 20.524462** — centroid OSM poligona objekta (way 1443189625, 4 tačke, ~12×13 m), adresa Jalija 69.
  `potvrdjeno: true`. Stari placeholder (43.1367, 20.5122) je bio ~1,6 km pogrešno (blizu Fehadije).
- Napomena za vaktiju: uzor koristi zvaničnu vaktiju IZ preko `https://api.vaktija.ba/vaktija/v1/110/{god}/{mj}/{dan}`
  (110 = Novi Pazar). Ako `adhan` daje drugačija vremena od vaktija.ba (IZ koristi vlastite korekcije), preporuka je
  prikazati link „zvanična vaktija: vaktija.ba/novi-pazar” ili koristiti API (CORS je radio u pregledaču uzora).

## 2. Šta je utvrđeno o džamiji (sve u `data/dzamija.json`)
- Otvorena 8. 3. 2024. (petak, uoči ramazana 1445.), otvorio predsjednik Mešihata IZ u Srbiji muftija dr. Mevlud ef. Dudić,
  koji je održao i prvu hutbu. Govorili: muftija novosadski hfz. Nedžad ef. Hasanović, muftija sandžački hfz. Abdurrahman
  ef. Kujević; moderator: glavni imam Medžlisa IZ Novi Pazar Dženan ef. Kamešničanin.
- Zemljište uvakufio Ferid Šehović; glavni vakif — brat muftije Hasanovića — uložio >200.000 €; objekat na 4 etaže;
  gradnja pokrenuta 2022.; „čekalo se punih 7 godina”. Zahvalnice: Sead Hasanović, Mersad Dragolovčanin, Aldin Kalić.
- Pozadina (NIJE stavljeno na sajt, osjetljivo): 2015. su mediji (Danas, 4. 11. 2015.) pisali o peticiji dijela stanovnika
  protiv gradnje džamije na Jaliji i obustavi radova od strane građevinske inspekcije; sekretar Mešihata Ferid Bulić tada je
  izjavio da je procedura dozvola u toku. To objašnjava izjavu o „7 godina čekanja”. https://www.danas.rs/vesti/drustvo/srbi-nece-dzamiju-u-svojoj-ulici/
- Aktivnosti (YouTube od 23. 7. 2025., 81 video; Instagram 191 objava): džumanske hutbe, ramazanski serijal tefsira sure
  Jusuf (25 dijelova, „svakog jutra prije sabahskog farza”), „Duhovna opskrba vjernika” (5 dijelova), halka hadisa
  (Kujević), učenje sure El-Kijame, „Poklon umra” (12/2025). Oktobar 2026: novoopremljena učionica, škola Kur'ana za žene i
  djecu, hifz Amme džuza za muškarce, sufara (4 stvarna obavještenja u `data/obavjestenja.json`, `placeholder:false`).

## 3. Imami / predavači (`data/imami-bio.json`, slugovi = `data/imami.json`)
| Slug | Status | Napomena |
|---|---|---|
| admir-jasarevic | potvrđeno (uloga) | Najviše hutbi/serijala; plakat 11. 10. 2026. ga navodi kao profesora hifza u džamiji. **Da li je on zvanični imam džamije — NIJE potvrđeno** (vjerovatno, ali nema izvora). Biografija (škola, rođenje) nepoznata. |
| abdurahman-kujevic | potvrđeno | Wikipedia (CC BY-SA) + mesihat.org 2016. Pažnja: mediji 2025. pišu o promjeni ovlaštenja oblasnih muftija u Mešihatu (SANA 22. 2. 2025.; snews.rs) — trenutnu titulu provjeriti s džematom; na kanalu se i dalje navodi „muftija”. U bio je navedeno samo imenovanje 2016. i nastup 2024. |
| edin-redzepovic | potvrđeno (samo uloga) | Drži hutbe na Jaliji i predavanja u Arap džamiji. **Različita osoba od Edina Salihovića** (različita prezimena, posebni videi). |
| dzenan-kamesnicanin | potvrđeno | Glavni imam Medžlisa IZ Novi Pazar (mart 2024.); „prof.” iz naslova videa. |
| ferid-fijuljanin, zikret-mustafic | potvrđeno (uloga) | Gosti; hutbe/predavanja i u Arap džamiji. |
| muhamed-metjahic, edin-salihovic | NEPOTVRĐENO | Ništa pronađeno osim po jedne hutbe na kanalu → `bio: null`. |
Slike: nijedna slobodno licencirana → `slika: null`.

## 4. Sadržaj
- `data/dove.json` — 21 dova/zikr (džamija, poslije namaza, Ajetul-kursija, jutro/večer, sejjidul-istigfar, Rabbena atina,
  za roditelje, putovanje, jelo, spavanje…), arapski s harekatima, transliteracija po bosanskoj konvenciji, izvori
  (sura, ajet / zbirka i broj hadisa).
- `data/ajeti-hadisi.json` — 33 ajeta + 32 kratka hadisa s referencama.
- **Prevodi su vlastita obrada značenja u duhu prevoda Besima Korkuta** (Korkutov prevod je još pod autorskim pravom, pa
  nije prepisivan doslovno). Preporuka: imam neka pregleda; ako džemat ima pravo korištenja zvaničnog prevoda, zamijeniti.
- `data/galerija.json` — `[]`: na Wikimedia Commons nema slika ove džamije (pretraga po imenu i geopretraga 500 m);
  fotografije s mesihat.org / Instagrama nisu slobodno licencirane i nisu preuzimane.

## 5. Šta džemat / korisnik treba dostaviti
1. **Fotografije** džamije (vanjski izgled, munara, unutrašnjost, učionica, aktivnosti) uz dozvolu za objavu — za hero,
   galeriju i OG sliku. Logo, ako postoji (na plakatima je stilizovana kupola).
2. **Kontakt**: zvanični e-mail i telefon džamije (na plakatima su lični brojevi predavača za prijave — namjerno NISU
   prepisani na sajt; džemat neka odluči koji broj je javni).
3. **Ime imama džamije** i kratka biografija (+ potvrda da li je to hfz. Admir ef. Jašarević), imam/mujezin, uprava džemata.
4. **Biografije i fotografije** predavača (posebno Muhamed Metjahić, Edin ef. Salihović), te željene titule (npr. Kujević).
5. **Donacije**: primalac, banka, broj računa/IBAN/SWIFT, svrha uplate — ništa nije javno, sva polja `null`.
6. **Vrijeme džume** (i da li ima posebnih termina zimi/ljeti), vrijeme sabaha u džematu (uzor: „20 min prije izlaska sunca”).
7. **Mekteb**: dani, termini, uzrasti, prijave. Stalni **raspored halki** (sadašnji podaci samo iz objava 10/2026).
8. **Historija**: kapacitet, arhitekta/izvođač, broj munara, površina, arapski naziv (ako postoji) — sada `null`.
9. Potvrda **Facebook** adrese (pronađene dvije: `/p/Džamija-na-Jaliji-61557235081713/` („Zvanična stranica”) i
   `/dzamija.na.jaliji/`; u podacima je prva).
10. Pregled prevoda ajeta/hadisa/dova od strane imama.

## 6. Izvori (glavni)
- https://mesihat.org/2024/03/08/svecano-otvorena-dzamija-na-jaliji/
- https://sandzak.tv/svecano-otvorena-dzamija-na-jaliji/
- https://www.openstreetmap.org/way/1443189625 (+ Nominatim/Overpass upiti, ulica Jalija way 304496931)
- https://sr.wikipedia.org/sr-el/Списак_џамија_у_Србији
- https://www.youtube.com/@D%C5%BEamijanaJaliji (channel id UCyw1ppQVijYlaQ6BicgZTVg, pridružen 23. 7. 2025.)
- https://www.instagram.com/dzamija_na_jaliji/ (objave 11. 10. i 20. 10. 2026.)
- https://www.facebook.com/p/D%C5%BEamija-na-Jaliji-61557235081713/
- https://en.wikipedia.org/wiki/Abdurahman_Kujevi%C4%87 ; https://mesihat.org/2016/03/07/vrsilac-duznosti-muftija-sandzacki-je-hfz-abdurahman-ef-kujevic/
- https://www.arapdzamija.rs/predavanja , /hutbe (gosti predavači)
- https://www.danas.rs/vesti/drustvo/srbi-nece-dzamiju-u-svojoj-ulici/ (pozadina 2015., samo interno)
