# Provjera činjenica — biografije predavača

Stanje: 25. 10. 2026. Nezavisna provjera tvrdnji iz `data/imami-bio.json` (istraživanje: `docs/istrazivanje-imami.md`).
Svaki izvor je otvoren i pročitan (web stranice, PDF-ovi Glasa islama i Islamske misli, YouTube metapodaci, arhiva
web.archive.org, plakat na Instagramu). Brojevi s kanala provjereni su prebrojavanjem u `data/predavanja.json`.
Ispravke su unesene u `data/imami-bio.json`, a SQL je ponovo generisan (`supabase/imami-bio-azuriranje.sql`).

Oznake: **potvrđeno** · **ispravljeno** (tvrdnja zadržana u izmijenjenom obliku) · **uklonjeno** · **nepotvrđivo**
(zadržano uz ogradu ili izostavljeno jer nema nezavisnog izvora / identitet nije siguran).

## Promjena prikaznog imena

| Slug | Staro `punoIme` | Novo `punoIme` | Razlog |
|---|---|---|---|
| abdurahman-kujevic | Muftija hfz. Abdurahman ef. Kujević | **Hfz. Abdurahman ef. Kujević** | Mešihat 19. 2. 2025. prenio ingerencije oblasnih muftija na glavnog muftiju; Kujević imenovan za savjetnika. Glas Sandžaka (26. 2. 2025.) ga naziva „bivši muftija sandžački”. Mešihat u 2026. piše „hfz. Abdurrahman ef. Kujević” bez titule, a kao „muftija sandžački” na mesihat.org naveden je dr. Mevlud ef. Dudić (pregledano 25. 10. 2026.). Stari oblik i „Hfz. Abdurrahman ef. Kujević” dodani su u `aliasi` da se naslovi videa i dalje prepoznaju. U SQL je dodan `update public.imami set puno_ime = …, aliasi = … where slug = 'abdurahman-kujevic';`. |

---

## 1. Hfz. Admir ef. Jašarević (`admir-jasarevic`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Hafiz Kur'ana | potvrđeno | Plakat Džamije na Jaliji „Hifz Amme džuza” – „Profesor: hafiz Admir Jašarević” (Instagram, 11. 10. 2026.); naslovi videa „Hfz.” | |
| Diplomirao na Odsjeku za kur'anske studije, King Saud University, Rijad | nepotvrđivo → ispravljeno (ograda) | Instagram @admir__j, opis profila: „Graduate of Qur'anic Studies · King Saud University · Riyadh” (pregledano 25. 10. 2026.) | Nezavisan izvor nije pronađen. Tekst sada glasi „Prema opisu njegovog javnog Instagram profila…”. Profil je koautor objave plakata džamije → isti čovjek. |
| Vodi halku hifza Amme džuza za muškarce metodom telkina, uz tefsir, „od oktobra 2026.” | ispravljeno | Plakat (11. 10. 2026.): utorkom, između akšama i jacije, početak 20. 10. 2026. | Precizirano: „od 20. 10. 2026.”, uz navod da je izvor plakat. |
| „Drži većinu džumanskih hutbi i serijale predavanja” | ispravljeno | `data/predavanja.json`: 27 od 35 hutbi na kanalu | Preformulisano kao podatak s kanala („27 džumanskih hutbi, od 35 objavljenih na kanalu”), bez tvrdnje o rasporedu hatiba u džamiji. |
| Proučio ašere na manifestaciji 12. rebiul-evvela na FIS-u, 15. 9. 2024. | potvrđeno | mesihat.org, 16. 9. 2024. („Ašere na početku proučio je hfz. Admir ef. Jašarević”) | |
| 62 snimka: 27 hutbi, 25 tefsir sure Jusuf, 7 predavanja (5 „Duhovna opskrba vjernika”), 3 učenja (En-Nahl, El-Kijame) | potvrđeno | `data/predavanja.json` (25. 10. 2026.) | Tačno prebrojano. |
| Tefsir „svakog jutra prije sabahskog farza” | uklonjeno | — | Nema izvora koji se može otvoriti (ni opis videa ni stranica); potiče iz ranijeg teksta o džamiji. |
| Teme hutbi (srce, grijesi, Džennet, emanet, bratstvo, djeca, Bedr, hidžra) | potvrđeno | naslovi u `data/predavanja.json` | |
| Hutba „Šutnja nije opravdanje – sačuvajmo Rogoznu” (april 2026.) | potvrđeno, precizirano | YouTube YFpo1trv5JM, opis „Hutba 24.04.2026” | Datum 24. 4. 2026.; video dodan u izvore. |

## 2. Hfz. Abdurahman ef. Kujević (`abdurahman-kujevic`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Rođen 21. 6. 1982. „u Rožajama (selo Balotiće)” | ispravljeno | dersovi.net (arhiva 6. 3. 2012.): „potiče iz sela Balotiće kod Rožaja, rođen je 21.06.1982” | Izvor ne kaže izričito mjesto rođenja → „rodom iz sela Balotiće kod Rožaja, rođen 21. 6. 1982.” |
| Medresa „Gazi Isa-beg” 2001., učenik generacije | potvrđeno | dersovi.net (2012.) | |
| Medina: kurs arapskog, Fakultet hadisa i islamskih nauka 2006. | potvrđeno | dersovi.net (2012.) | |
| Kur'an pred šejhom Jusufom ibn Dževdom ed-Davudijem; idžazetnama | potvrđeno | dersovi.net (2012.) | |
| Predavao na Islamskom fakultetu u NP i ženskoj medresi u Rožajama; hutbe u Rožajama | potvrđeno (prošlo vrijeme) | dersovi.net (2012.) | Ostaje „prema biografiji arhiviranoj 2012.”. |
| 7. 3. 2016. v.d. muftije sandžačkog, dotad pomoćnik muftije | potvrđeno | mesihat.org, 7. 3. 2016. | |
| „Kao muftija sandžački navodi se u izvorima od 2016. do 2024.” | ispravljeno | Sandžak Press 16. 12. 2022.; mesihat.org 8. 3. 2024.; arapdzamija.rs (25. 1. 2025., „muftija sandžački”) | Sada „do početka 2025.”. |
| 19. 2. 2025. ingerencije oblasnih muftija prenesene na glavnog muftiju; Kujević savjetnik predsjednika Mešihata za sandžačku dijasporu | potvrđeno | mesihat.org, 19. 2. 2025. | |
| „Tada je izjavio” da konačnu odluku o razrješenju donosi Sabor | ispravljeno | SANA, 26. 2. 2025. (čl. 77 Ustava IZ); Glas Sandžaka, 26. 2. 2025. („poštovati odluke svoje Islamske zajednice”) | Izjava je od 26. 2., ne od 19. 2. → „Nekoliko dana kasnije (26. 2. 2025.)…”. Odluka Sabora o tome nije pronađena. |
| Status titule u 2026. | dodano (neutralno) | mesihat.org — „Muftija sandžački dr. Mevlud ef. Dudić” (pregledano 25. 10. 2026.); SANA 21. 5. 2026. i Medžlis Tuzla 18. 6. 2026. — „direktor”, bez „muftija”; kanal Jalije 22. 8. 2026. i arapdzamija.rs 17. 4. 2026. — „muftija” | Bio objašnjava da se titula u naslovima snimaka koristi kao oznaka dužnosti koju je obavljao. |
| Direktor Vakufske direkcije IZ u Srbiji (najkasnije od 2022.; 2025–2026) | potvrđeno | Sandžak Press 16. 12. 2022.; SANA 26. 2. 2025., 13. 6. 2025., 23. 12. 2025., 21. 5. 2026.; **Medžlis IZ Tuzla 18. 6. 2026.** (novi, najnoviji izvor) | |
| Isa-begov hamam i Kolo džamija u Novom Pazaru | potvrđeno | SANA 13. 6. 2025., 23. 12. 2025. | |
| 5 snimaka na kanalu (3 hutbe, 2 halke hadisa), naslovi | potvrđeno | `data/predavanja.json` | |
| Predavanja u Arap džamiji | potvrđeno | arapdzamija.rs/predavanja: 25. 1. 2025., 5. 7. 2025., 9. 1. 2026., 17. 4. 2026. | Dodano „(2025–2026)”. |
| Hutba u Altun-alem džamiji, februar 2026.; ramazanski program Mešihata | potvrđeno | mesihat.org, 23. 2. 2026. (oba) | |
| Izvor Wikipedia | uklonjeno iz izvora | en.wikipedia.org (izmjena 30. 11. 2025.) | Zastarjela (navodi ga kao pomoćnika muftije), oznaka „failed verification”; ne donosi ništa što nije u arhiviranoj biografiji. |

## 3. Hfz. Edin Redžepović (`edin-redzepovic`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Hafiz, magistar (mr.) | potvrđeno | FIS 16. 5. 2026. („hafiz mr.”); Glas islama 369/370 („Msc.”) | |
| Asistent za hadis na FIS-u, doktorand na Odsjeku za hadis, predaje ahlak u Medresi | potvrđeno | FIS, 5. 1. 2026. | Asistent i u izvoru od 16. 5. 2026. |
| Član IUMS-a (Doha) od maja 2026. | potvrđeno | FIS, 16. 5. 2026. | |
| Februar 2024.: „v.d. glavnog i odgovornog urednika” Glasa islama | ispravljeno | mesihat.org, 16. 2. 2024.: „v.d. glavnog urednika” | Usklađeno s izvorom. |
| Glavni i odgovorni urednik (impresum br. 369, 2026.) | potvrđeno, dopunjeno | PDF br. 369 (jul 2026.) i **br. 370 (avgust 2026.)**: „Glavni i odgovorni urednik: Msc. Edin Redžepović” | Dodan noviji broj. |
| „Redovno objavljuje analize iz ahlaka, hadisa i tefsira” | ispravljeno | mesihat.org 25. 9. 2026. (GI 370, „Analize”) | Potvrđen jedan primjer (ahlak); „redovno … hadisa i tefsira” nije provjerljivo → „objavljuje analize, npr. …”. |
| „Osnove islamskog karaktera”, El-Kelimeh | potvrđeno, dopunjeno | Islamska misao 15 (2024.), literatura: „El-Kelimeh, Novi Pazar, 2023.” | Dodana godina 2023. |
| „Sunnetom do savršene ličnosti”, El-Kelimeh, 2024. | potvrđeno | kelimeh.org | |
| „Vrijednost i značaj salavata” – peta autorska knjiga; 15 prijevoda; Buharija/Nesai; recenzent 50+ naslova | potvrđeno | FIS, 5. 1. 2026. | |
| Rad u Islamskoj misli br. 16 (2025.) | potvrđeno | PDF Islamska misao 16 (sadržaj, str. 177) | |
| Hutba „Zar ste mislili…” „(januar 2026.)” | ispravljeno | YouTube rCzQq8ZhLTc: opis „Hutba 26.12.2025”, objavljeno 1. 1. 2026. | Datum hutbe 26. 12. 2025. (`data/predavanja.json` nosi datum objave 2026-01-01 — nije mijenjano). |
| Hutba „Razumijevanje ibadeta u islamu” (septembar 2026.) | potvrđeno | YouTube uOrHIm0Tmc0: „Hutba 25.09.2026” | Precizirano na 25. 9. 2026. |
| Predavanja u Arap džamiji 2025–2026 (iman, dobročinstvo, pokajanje, kur'anska kazivanja) | potvrđeno | arapdzamija.rs: 8. 2. 2025. – 20. 6. 2026. (6 predavanja) | |

## 4. Prof. Dženan ef. Kamešničanin (`dzenan-kamesnicanin`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Učenik 4. razreda Medrese, 2012. takmičenje iz arapskog (pjesništvo) | potvrđeno | mesihat.org, 20. 5. 2012. | Dodano „u Turskoj” (Bursa/Istanbul). Plasman nije naveden (3. mjesto je osvojio drugi učenik) — bio ga i ne tvrdi. |
| Student u Medini; 2017. predsjednik Udruženja studenata na tradicionalnom susretu s hadžijama | potvrđeno | mesihat.org, 12. 9. 2017. | |
| 2023.: profesor arapskog jezika i književnosti; v.d. glavnog i odgovornog urednika GI | potvrđeno | mesihat.org, 24. 4. 2023. | |
| 5. 10. 2023. v.d. glavnog imama MIZ Novi Pazar; februar 2024. predao uredništvo | potvrđeno | mesihat.org, 5. 10. 2023.; 16. 2. 2024. | |
| Vodio program otvaranja Džamije na Jaliji 8. 3. 2024. | potvrđeno | mesihat.org, 8. 3. 2024. | |
| 8. 4. 2025. predao dužnost glavnog imama dr. Enveru ef. Giciću | potvrđeno | mesihat.org, 8. 4. 2025. | |
| Od aprila 2025. šef Ureda za mekteb | potvrđeno | mesihat.org, 21. 4. 2025.; 6. 12. 2025. | |
| „Tu dužnost je 2. 4. 2026. preuzeo dr. Semir ef. Čupović” | ispravljeno | mesihat.org, 2. 4. 2026. | Članak ne imenuje prethodnika → „u aprilu 2026. dužnost šefa tog ureda preuzeo je dr. Semir ef. Čupović”. |
| Profesor Medrese „Gazi Isa-beg” (oktobar 2026.) | potvrđeno | medresa.edu.rs, 5. 10. 2026. („U pratnji učenica bili su profesori Dženan Kamešničanin, …”) | Izvor ga naziva profesorom u pratnji učenica Ženske medrese; formulacija prilagođena. |
| Predavanja u Arap džamiji (12. 9. 2025., 28. 11. 2025.) | potvrđeno | arapdzamija.rs/predavanja | |
| „Arapski jezik i Bošnjaci” (GI 318) | potvrđeno | mesihat.org, 17. 4. 2022. | Dodano: saradnik u impresumu GI 369/370 (2026.). |
| Hutba na Jaliji 29. 8. 2025. | potvrđeno | YouTube _9qWe3pe_k8 | |

## 5. Hfz. Ferid Fijuljanin (`ferid-fijuljanin`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Hafiz | potvrđeno | mesihat.org 2016., 2019.; Shoura 2026.; Hadži Mehova džamija (2016., 2022.) | |
| Predstavnik Škole Kur'ana Časnog, „ustanove Mešihata”; finale 20. takmičenja u Dubaiju (do 25 g.) | ispravljeno | mesihat.org, 19. 6. 2016. | Članak ne opisuje školu kao ustanovu Mešihata → taj dodatak uklonjen. |
| 2. mjesto, 20 džuzeva, IV međunarodno takmičenje, Sarajevo (KC Kralj Fahd), za Mešihat | potvrđeno | mesihat.org, 21. 10. 2019. | |
| `uloga` i bio: „imam Džemata Sabur u Berlinu” | ispravljeno / nepotvrđivo (identitet) | Shoura (Luksemburg), 17. 6. 2026.: „Hafiz Ferid Fijuljanin, Imam of the Sabur Mosque in Berlin”, s petnaestak članova zajednice, posjeta 14. 6. 2026. | Izvor kaže „džamija Sabur”, ne „džemat”. Nijedan izvor ne povezuje berlinskog imama s Novim Pazarom/Jalijom; fotografija iz Shoure nije dovoljna za poređenje. Uklonjeno iz `uloga` (sada „Gost hatib i predavač”); u bio ostaje kao navod izvora. |
| Snimci na kanalu Hadži-Mehove džamije (2016., 2022.) | potvrđeno | YouTube pBMlVMexxBY (12. 4. 2016.), dOnHtIXET5k (18. 11. 2022.) | Lice na sličici iz 2022. odgovara kadru s Jalije. |
| Predavanje „Ustraj ponosno, pobjeda je blizu” (10. 11. 2023.), hutba „Ne smije nam biti svejedno” (15. 8. 2026.) u Arap džamiji | potvrđeno | arapdzamija.rs/predavanja, /hutbe | Hutba navedena kao „avgust 2026.” (datum na stranici pada u subotu, vjerovatno datum objave). |
| Hutba na Jaliji 25. 7. 2025. | potvrđeno | YouTube XyZ9pCBpPB0 | |

## 6. Hfz. Zikret Mustafić (`zikret-mustafic`) — potvrdjeno: true

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Rođen 1981. u Novom Pazaru; u Luksemburgu od 1999. | potvrđeno | gazi-isa-beg.lu/o-nama (1. 10. 2026.) | |
| Damask: Šerijatski fakultet i hifz; Kairo: šerijat i arapski | potvrđeno | gazi-isa-beg.lu (1. 10. 2026.) | |
| Nakon studija imam u Novom Pazaru i Berlinu | potvrđeno | gazi-isa-beg.lu: „Nakon završenih studija djelovao je kao imam u Novom Pazaru i Berlinu” | „radio” → „djelovao”. |
| Imam, hatib i muallim IC Gazi Isa-beg, Esch-sur-Alzette; „dugi niz godina” (2024.); izvori 2026. | potvrđeno | Shoura 17. 1. 2024.; gazi-isa-beg.lu 1. 10. 2026.; medresa.edu.rs 8. 4. 2026. | |
| Predsjednik BNF Luksemburg od 2023. | potvrđeno | gazi-isa-beg.lu (1. 10. 2026.) | Samo vlastiti izvor centra. |
| Posjeta Medresi 8. 4. 2026., „dugogodišnji prijatelj ustanove” | potvrđeno | medresa.edu.rs, 8. 4. 2026. | |
| Hutbe/predavanja u Arap džamiji 2023–2026 (tri naslova) | potvrđeno | arapdzamija.rs: hutbe 22. 7. 2023., 6. 8. 2023.; predavanja 18. 4. 2024. – 3. 4. 2026. | |
| „Opasnost javnog razvrata” (jul 2025.) | potvrđeno | YouTube 43grkcWOjiQ (23. 7. 2025.) | |

## 7. Muhamed Metjahić (`muhamed-metjahic`) — potvrdjeno: false

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Hutba „Osnovni emanet” (18. 9. 2026.) na kanalu Jalije | potvrđeno | YouTube Sqw2IPRsP24, opis „Dzuma 18.09.2026” | Jedina tvrdnja; podaci o imenjaku (student FIS-a) namjerno nisu uneseni — identitet nije potvrđen. |

## 8. Edin ef. Salihović (`edin-salihovic`) — potvrdjeno: false

| Tvrdnja | Ocjena | Izvor + datum | Napomena |
|---|---|---|---|
| Hutba „Vjernik je ogledalo vjerniku” (31. 7. 2026.) na kanalu Jalije | potvrđeno | YouTube aFCBrBJYZik, opis „Hutba 31.07.2026” | |
| Hutba na kanalu „Dzemat Altun Alem” (24. 7. 2026.) | potvrđeno | YouTube D7d1jYS2CQc (objavljeno 27. 7. 2026.) | Lice na sličici odgovara kadru s Jalije → ista osoba. |
| Snimak na kanalu IC Gazilar „Istinsko slijeđenje sunneta” („2026.”) | potvrđeno, precizirano | YouTube a-YUy_EVQBM (objavljeno 15. 8. 2026.); IC Gazilar je u Novom Pazaru | Sličica prikazuje publiku, pa je identitet zasnovan na imenu, tituli, gradu i vremenu. |
| Imam u Berlinu (Ikre Berlin, Facebook) | nije uneseno | — | Identitet nije potvrđen; ostaje izostavljeno. |

---

## Šta džamija treba potvrditi
1. **Kujević:** da li džemat želi prikazno ime „Hfz. Abdurahman ef. Kujević” (promijenjeno) ili zadržava titulu „muftija” iz poštovanja; Sabor odluku o razrješenju, prema pronađenim izvorima, nije objavio.
2. **Jašarević:** studij na King Saud University (godina) — trenutno samo njegov Instagram; da li je zvanični imam džamije.
3. **Fijuljanin:** da li je hatib s Jalije isti čovjek kao imam džamije Sabur u Berlinu (ako jeste, može se vratiti u `uloga`).
4. **Kamešničanin:** trenutna funkcija pored profesure u medresi; titula hafiza (nije potvrđena).
5. **Metjahić i Salihović:** osnovni biografski podaci (titula, gdje djeluju).
6. **Tefsir sure Jusuf:** ako je učen „svakog jutra prije sabahskog farza”, dostaviti izvor (npr. objavu) da se vrati u bio.
