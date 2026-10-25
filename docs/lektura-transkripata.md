# Lektura automatskih transkripata

Automatski transkripti (`data/transkripti/<id>.json`, whisper.cpp, model large-v3-turbo, jezik bs) imaju mnogo grešaka u prepoznavanju. Lektorisana verzija je u `data/transkripti-lektura/<id>.json`.

## Format

Isti kao izvorni transkript, uz tri dodatna polja:

```json
{ "id": "…", "jezik": "bs", "model": "large-v3-turbo", "generisano": "…",
  "automatski": true, "lektorisano": true, "lektura": "2026-10-25",
  "segmenti": [ { "od": 97, "do": 123.2, "tekst": "…" } ] }
```

Granice segmenata i vremena (`od`/`do`) su **identični** izvornom transkriptu (isti broj segmenata), pa se lektorisani tekst može direktno koristiti umjesto automatskog. Svaki fajl je provjeren skriptom (ispravan JSON, isti broj segmenata, ista vremena). `automatski: true` ostaje jer je osnova i dalje mašinska – lektura je rađena bez preslušavanja snimka, samo na osnovu teksta i konteksta.

## Pravila koja su primijenjena (konzervativna lektura)

Ispravljano:
- pogrešno prepoznate riječi (ludi → ljudi, negov → njegov, porobicu → porodicu, jahlica → jahalica, hudba → hutba, srednju → sedždu…);
- dijakritici (č, ć, š, ž, đ) i ijekavski oblici tamo gdje govornik jasno govori ijekavicom (dijela → djela, ovde → ovdje, posle → poslije);
- velika slova: Allah, Poslanik (kad se misli na Muhammeda, a.s.), Kur'an, Džennet, Sudnji dan, Gospodar; zamjenice koje se odnose na Allaha (On, Njegov, Svoje, Ga);
- interpunkcija, rečenice, navodnici za citirane ajete i hadise;
- islamske formule u standardnom bosanskom pisanju: subhanehu ve te'ala, dželle šanuhu, sallallahu alejhi ve sellem (umjesto s.a.w., s.a.v., a.s. iza „sallallahu“), radijallahu anhu/anha, alejhis-selam, alejhis-salatu ves-selam, inšaAllah, elhamdulillah, ako Bog da, amin ja Rabbel-alemin;
- imena ashaba, učenjaka i mjesta kada je ime nedvosmisleno iz konteksta (Enes ibn Malik, Abdullah ibn Mubarek, Ka'b ibn Udžra, Muaz ibn Džebel, Aiša, Medjen…), nazivi sura (Ez-Zarijat, El-Bekare…);
- tekst ajeta/hadisa i ustaljenih arapskih formula hutbe (hamd, šehadet, „Barekallahu li ve lekum…“, „Ekulu kavli haza…“) samo tamo gdje je prepoznati tekst očito taj poznati tekst; arapsko pismo je zadržano gdje ga je whisper dao, uz ispravku očitih slovnih grešaka; latinična transliteracija ujednačena po bosanskom načinu pisanja;
- uvodne obraćanje džematu koje whisper stalno kvari („Prga vrećo sine“, „pošto vam obraću“) → „Draga braćo, cijenjene džematlije“, „poštovana braćo“.

Nije rađeno:
- ništa nije dodavano niti sažimano, redoslijed nije mijenjan, stil govornika (ponavljanja, dijalektizmi poput „lahko“, „kahva“, „hanuma“, „babo“, „džaba“) je zadržan;
- nejasna mjesta koja se ne mogu pouzdano rekonstruisati ostavljena su kako jesu ili označena sa „[nejasno]“;
- dijelovi na arapskom koje whisper nije prepoznao (npr. „Al-Fatiha.“ preko 60 s uvoda hutbe) zamijenjeni su oznakom „[učenje na arapskom]“;
- uklanjane su samo očite whisper halucinacije (ponovljeni identični redovi, „Hvala na gledanju“, „Titlovi…“, muzičke note) – svako takvo uklanjanje je navedeno ispod.

## Arapski segmenti (2026-10-25)

Arapski dijelovi (uvod i završetak hutbe, učenje ajeta, hadisi, dove) su dodati kao zasebni segmenti
`{ "od", "do", "tekst": "<arapski>", "jezik": "ar", "prevod": "<prevod>" }` u **oba** fajla
(`data/transkripti-lektura/` i `data/transkripti-en/`, isti broj segmenata i ista vremena; `prevod` je
bosanski odnosno engleski), a na vrhu fajla stoji `"arapski": "2026-10-25"`. Postupak (79 snimaka sa
govorom; `WA79h85BTKU` i `eTjV_BlQIqk` nemaju govor):

- arapski prolaz whispera (`-l ar`, `scripts/transkripcija/arapski.mjs`) na dijelovima koje bosanski prolaz
  nije prepoznao (oznake, rupe, arapsko pismo, transliteracija, početak/kraj snimka), zatim ručni pregled
  svakog snimka;
- poznati tekstovi (hutbetul-hadže i njene varijante, „Barekallahu li ve lekum…“, „Ekulu kavli haza…“,
  salavat, Ali Imran 102, En-Nisa 1, El-Ahzab 56, Jusuf 3 na početku svakog tefsira…) zamijenjeni su tačnim
  tekstom sa harakatima; ajeti su prepoznati po suri i ajetu i napisani prema mushafu, uz prevod i izvor,
  npr. „(Jusuf, 33)“ / „(Yusuf 12:33)“; prevodi su vlastiti (značenjski), ne preuzeti iz objavljenih prevoda;
- oznake `[učenje na arapskom]`, „progutani“ segmenti (npr. „Sallallahu alejhi ve sellem.“ preko 30 s) i
  potpuno transliterisani segmenti („Ve neuzu billahi…“) su zamijenjeni arapskim segmentima; miješani
  segment (arapski početak/kraj + bosanski tekst) je podijeljen na granici iz finih segmenata whispera, a
  bosanski/engleski dio teksta je ostao kakav je bio (uklonjen je samo arapski/transliterisani dio);
- arapski citat usred bosanske rečenice (citat pa prevod) ostao je u tekstu kakav jeste;
- ono što je whisper „čuo“ na bosanskom govoru (besmislice arapskim pismom, „اشتركوا في القناة“) odbačeno je;
- bosanski tekst koji je bio izgubljen ispod oznake (npr. prevod ajeta odmah poslije učenja) nije
  rekonstruisan — to vrijeme je ostalo bez teksta.

**Za preslušavanje** (`"provjeriti": true` — tekst nije sigurno prepoznat; na stranici piše napomena):

- `FBOlD4Vc82E` 9:37–10:02 i `voLOTKD84Vg` 16:41 — početak druge hutbe („الحمد لله حمد الكاملين…“, „تعظيما
  لنبيه وتكريما لفخامة شأن شرف الصفي…“): formula nije sigurno prepoznata.
- `-QKGCdrGiRQ` 10:17 — sura El-Felek; whisper je čuo prvi i četvrti ajet, ostatak je dopunjen po redoslijedu sure.
- `Dnqhzz-b4gw` 1:13 — En-Neml 19: moguće da je proučen i dio „وَعَلَىٰ وَالِدَيَّ وَأَنْ أَعْمَلَ صَالِحًا تَرْضَاهُ“ koji nije prepoznat.
- `fZ_cV_h1pcc` 0:01 — dova/ilahija „نَوِّرْ قَلْبِي بِالْقُرْآنِ…“; riječ pred „يَا مَنَّانُ“ nije jasna.

Preostala oznaka: `0NxaZJg1zQA` 0:00–1:09 `[učenje na arapskom]` — ni drugi pokušaj (large-v3) nije dao
upotrebljiv tekst.

Indeksi segmenata su se promijenili (admin ispravke u tabeli `transkript_ispravke` su vezane za indeks
segmenta; tabela je u tom trenutku bila prazna).

## Za provjeru (imam)

Lektura je rađena bez preslušavanja snimka. Ispod su, po videu, mjesta gdje je tumačenje nesigurno – vrijeme (min:sek) se odnosi na početak segmenta u snimku. Preporuka: preslušati ta mjesta i po potrebi ispraviti tekst direktno u `data/transkripti-lektura/<id>.json`.


## Urađeno (81 od 81)

| Datum | ID | Naslov |
|---|---|---|
| 2026-10-23 | `tb5geb6Gxcg` | Ne moraš učiniti svako dobro djelo da bi imao nagradu za njega |
| 2026-10-10 | `zViIQjXeAd8` | Istinsko popravljanje stanja |
| 2026-10-02 | `JdcHgtoqIZA` | Budi miris koji svi osjećaju, ali ga ne vide |
| 2026-09-26 | `uOrHIm0Tmc0` | Razumijevanje ibadeta u islamu |
| 2026-09-19 | `Sqw2IPRsP24` | Osnovni emanet |
| 2026-09-05 | `iWW6haV1w7s` | Ko mi garantuje dvije stvari, ja njemu garantujem Džennet |
| 2026-08-29 | `eGtVLmLLxYU` | Kada se ljudi boje nečijeg zla |
| 2026-08-22 | `URC-DOi3T-c` | Trebamo kvalitetne ljude |
| 2026-08-15 | `kuc8NpVvqAc` | Ne uzdiži sebe ponižavajući grješnika |
| 2026-08-07 | `GBqnrw_N9k8` | Nepokornost Allahu |
| 2026-08-01 | `aFCBrBJYZik` | Vjernik je ogledalo vjerniku |
| 2026-07-25 | `FBOlD4Vc82E` | Tri temelja lijepog odnosa prema vjerniku |
| 2026-06-21 | `2LYay4qb2aQ` | Pouke i poruke hidžre |
| 2026-06-07 | `mWNwupesSts` | Umrlog (mejta) prati troje |
| 2026-05-16 | `obw7ke2ufCI` | Uzroci pokvarenosti srca |
| 2026-05-12 | `u481wbnz8mE` | Da li doprinosimo Allahovoj vjeri |
| 2026-05-02 | `y7-Zaiv3UDE` | Deset oporuka u suri El-En'am |
| 2026-04-25 | `YFpo1trv5JM` | Šutnja nije opravdanje - sačuvajmo Rogoznu |
| 2026-04-17 | `byQky3asLV4` | Kako sačuvati djecu u ovim teškim vremenima |
| 2026-04-05 | `7M3QgPEG7Xk` | Tri stvari koje vode muškarca u propast |
| 2026-04-05 | `zOmGidryvss` | Musliman je muslimanu brat |
| 2026-03-21 | `HNqEdoHMRIs` | Završetak sure Jusuf |
| 2026-03-19 | `ZunOGAA0wSk` | Dolazak porodice i ostvarenje sna |
| 2026-03-19 | `_ZcWrGo3SVA` | Otkrivanje identiteta |
| 2026-03-15 | `lhF1N0P5hlo` | Jakubova (alejhisselam) bol |
| 2026-03-15 | `uZEkVKf2U68` | Optužba |
| 2026-03-13 | `pMcy2m2eQQE` | Drugi dolazak u Egipat |
| 2026-03-12 | `zA1UmsljDu0` | Povratak ocu |
| 2026-03-10 | `w6pUYGGH9OE` | Dolazak Jusufove braće |
| 2026-03-09 | `deiEHbCsf50` | Položaj Jusufa u Egiptu |
| 2026-03-08 | `7GERYBiHmIU` | Poruke i pouke bitke na Bedru |
| 2026-03-08 | `emwe4sORGW8` | Kraljev san |
| 2026-03-08 | `mn7ZqCXMUXs` | Istina izlazi na vidjelo |
| 2026-03-07 | `wKGhHti8z_8` | Jusufovo (alejhisselam) tumačenje snova |
| 2026-03-05 | `NtpMnFzhuLk` | Jusuf u zatvoru |
| 2026-03-03 | `qXLkbRDfC4E` | Jusufova dova i zatvor |
| 2026-03-02 | `SA41VjT-FHk` | Širenje glasina po gradu |
| 2026-03-01 | `MI8D-L8UAJg` | Potvora na Jusufa |
| 2026-02-28 | `zQJBEWDjx4o` | Pokušaj zavođenja i poziv na grijeh |
| 2026-02-27 | `D5dW3N4gbkA` | Od bunara do dvora: Jusufovo putovanje ka izbavljenju |
| 2026-02-25 | `STU4F1CXHuU` | Jakubovo (alejhisselam) strpljenje |
| 2026-02-24 | `lsey2WAm6LQ` | Bacanje Jusufa u bunar |
| 2026-02-23 | `Twjne-X8VhI` | Zavjera protiv Jusufa |
| 2026-02-23 | `hRR7ywKCs-Q` | Sura El-Kijame (Smak svijeta), ajeti 20–40 |
| 2026-02-22 | `-QKGCdrGiRQ` | Ljubomora Jusufove braće |
| 2026-02-21 | `MYCk52q8EAU` | Očev mudri savjet |
| 2026-02-20 | `rEHmZdMmp5o` | San mladog Jusufa |
| 2026-02-19 | `vMrS7K-eaxA` | Uvod u suru Jusuf - Najljepša kazivanja |
| 2026-02-10 | `2nfqF0O9n2Y` | Sura El-Kijame (Smak svijeta), ajeti 1–19 |
| 2026-02-10 | `OI4e5BG2fBY` | Duhovna opskrba vjernika |
| 2026-02-04 | `HFQL1lCg3Uc` | Allahov Poslanik ﷺ žuri da uvede ljude u Džennet |
| 2026-02-01 | `ThpbeIh4YsM` | Duhovna opskrba vjernika |
| 2026-01-31 | `voLOTKD84Vg` | Vrijednost pomaganja brata muslimana |
| 2026-01-24 | `iXV2v1vswrI` | Emanet |
| 2026-01-19 | `6VaN1rUdWhQ` | Četiri pitanja na Sudnjem danu |
| 2026-01-19 | `OIwrb0aL-W0` | Duhovna opskrba vjernika |
| 2026-01-09 | `lRBp8Lr_CAc` | Duhovna opskrba vjernika |
| 2026-01-09 | `wL4N83HAKGk` | Dobra djela koja ne prestaju ni nakon smrti |
| 2026-01-06 | `0NxaZJg1zQA` | Putovanje radi znanja |
| 2026-01-03 | `j3Bif94U1c0` | Duhovna opskrba vjernika |
| 2026-01-01 | `rCzQq8ZhLTc` | "Zar ste mislili da smo vas uzalud stvorili i da Nam se nećete vratiti?" |
| 2025-12-19 | `HcPnSj8Ph34` | Poklon umra |
| 2025-12-13 | `tWXxPbIrl5o` | Posljedice grijeha |
| 2025-12-12 | `Dnqhzz-b4gw` | Kratki video sa predavanja (1/6) — 12. decembar 2025. |
| 2025-12-12 | `GhdekPqiJd4` | Kratki video sa predavanja (2/6) — 12. decembar 2025. |
| 2025-12-12 | `WA79h85BTKU` | Kratki video sa predavanja (4/6) — 12. decembar 2025. |
| 2025-12-12 | `eTjV_BlQIqk` | Kratki video sa predavanja (5/6) — 12. decembar 2025. |
| 2025-12-12 | `fZ_cV_h1pcc` | Kratki video sa predavanja (6/6) — 12. decembar 2025. |
| 2025-12-12 | `m_aOyTS120Q` | Kratki video sa predavanja (3/6) — 12. decembar 2025. |
| 2025-12-06 | `AEnVHby0LNs` | Najvažniji ibadet - namaz |
| 2025-11-28 | `Labn-lIyEos` | Djela koja uvode u Džennet |
| 2025-11-14 | `barFCsIZ9uc` | Djela koja uvode u Džennet |
| 2025-11-07 | `gG15f8_ArTg` | Veličina Allahove milosti prema Njegovim stvorenjima |
| 2025-10-31 | `sTj84EHOB1E` | Ko ostavi nešto radi Allaha, Allah će mu to nadoknaditi boljim od toga |
| 2025-10-25 | `wt8rQ42I17k` | 5 stvari koje uništavaju srce |
| 2025-10-12 | `MDBHc1KYF8M` | Poruke i pouke iz sure El-Beled |
| 2025-10-08 | `dqvoBwjRmpc` | Sura En-Nahl (36-40) |
| 2025-10-05 | `EK91nQz1F8c` | Skupina koja će ući u Džennet |
| 2025-08-30 | `_9qWe3pe_k8` | Kulturološka pripadnost islamu |
| 2025-07-27 | `XyZ9pCBpPB0` | Hutba 25.07.2025. |
| 2025-07-23 | `43grkcWOjiQ` | Opasnost javnog razvrata |

## Nesigurna mjesta po videu

### 2026-10-23 – Ne moraš učiniti svako dobro djelo da bi imao nagradu za njega (`tb5geb6Gxcg`)

- 0:00 – 1:37: uvodni dio na arapskom (whisper je dao samo „Al-Fatiha.“ / „Sallallahu alayhi wa sallam.“); zamijenjeno oznakom [učenje na arapskom], provjeriti.
- 2:03: obraćanje „Prga vrećo sine džematlije“ protumačeno kao „Draga braćo, cijenjene džematlije“ (isto obraćanje se ponavlja u drugim hutbama).
- 4:05: „zamislite da navraću Allahove blagodati“ – nejasno, ostavljeno [nejasno].
- 9:53: „da nam oprosti grijehe, naših roditelja“ – vjerovatno „grijehe i grijehe naših roditelja“; ostavljeno kako je prepoznato.
- 7:27–8:03: „hajli“ protumačeno kao „hajirli“ (dobre, hajrli stvari).

### 2026-10-10 – Istinsko popravljanje stanja (`zViIQjXeAd8`)

- 0:01–1:24: arapski uvod hutbe (hamd i šehadet) – ispravljene samo očite greške u arapskom pismu (شرور، بالحق، وسراجا، ويحق، الهداة).
- 2:57: ajet (Hud, 88) transliterisan kao „In uridu illel-islahe mesteta'tu“.
- 6:04: „vrst civilizacije“ protumačeno kao „vrh civilizacije“ – provjeriti.
- 8:07: „prvo sebe da raspitamo“ – ostavljeno kako je prepoznato (moguće „ispitamo“).
- 8:32: „tako se da ga vraćamo“ – nejasno.
- 9:45: ajet (El-Bekare, 11–12) – whisper je prijevod između arapskih dijelova pretvorio u besmislene arapske znakove; ostavljen arapski tekst ajeta i oznaka [nejasno].
- 11:08: „najveći fesad … i najveći energeti“ – kraj rečenice nejasan.
- 12:57: „Hanu Mahdiđa“ protumačeno kao „hanuma Hatidža“.
- 12:40: „dobro je febija“ protumačeno kao „Dobro je, efendija“.

### 2026-10-02 – Budi miris koji svi osjećaju, ali ga ne vide (`JdcHgtoqIZA`)

- 0:00–1:28: arapski uvod hutbe; latinična transliteracija ujednačena (Ve neuzu billahi…), ispravljene očite greške u arapskom pismu.
- 1:59: „Pošto ona braćo“ protumačeno kao „Poštovana braćo“; „blizvenog izvora“ kao „blizu jednog izvora“.
- 6:18: „vlajima Varaka“ = Abdullah ibn Mubarek (ime jasno iz nastavka).
- 7:38: početak segmenta („na onome dunjaluku… već na onome svijetu“) – govornik se vjerovatno ispravio; ostavljeno.
- 8:18: „nagradu na onome svijetu, a to je lijep život“ promijenjeno u „na ovome svijetu“ (iz konteksta: lijep život = dunjaluk, a na onome = Džennet) – provjeriti.
- 8:18: ajet (Ez-Zelzele, 7) ispravljen u standardni arapski tekst.

### 2026-09-26 – Razumijevanje ibadeta u islamu (`uOrHIm0Tmc0`)

- 0:48: arapski uvod – kraj („وتركنا على المحجة البيضاء…“) vraćen u poznatu formulu; whisper je prepoznao „وتركنا بعضه للطريق والسبيل“ – provjeriti.
- 1:13: „Gospodaru arshaklamenitok“ protumačeno kao „Gospodaru Arša plemenitog“; „znanok i neznanok“ kao „znanog i neznanog“ – provjeriti.
- 6:13: prenosilac hadisa protumačen kao Ka'b ibn Udžra („Kjap ibn Uđara“).
- 8:14: „svaka sekunda usnuje ibadet“ protumačeno kao „svaka sekunda sna je ibadet“.
- 8:31: „ovaj plemeniti Asad“ protumačeno kao „ovaj plemeniti ashab“ (Muaz ibn Džebel).
- 11:10: „neke ostanica koje Allah daje vjernicima“ – nejasno.

### 2026-09-19 – Osnovni emanet (`Sqw2IPRsP24`)

- 0:00–1:28: arapski uvod hutbe; whisper je za 70 s dao samo „Alhamdulillah“ – dodata oznaka [učenje na arapskom]; „Zdravljeni kullih“ protumačeno kao „…aled-dini kullihi“.
- 5:28–5:49: ajet (El-Insan, 3) – govornik prevodi „ili će biti od zahvalnih, ili od nevjernika“; ostavljeno kako je rečeno.
- 11:08: „Allah neće promijeniti stanje jednog naroda dok oni sami svoje stanje ne promijene“ najavljeno je kao hadis Poslanika, a.s. – to je ajet (Er-Ra'd, 11). Ostavljeno kako je izgovoreno (ili kako je whisper prepoznao „Poslanik Ali se nam … Hadisu“) – imam neka provjeri.
- 11:54: „ih malo pošivajte“ protumačeno kao „pošibajte“.
- 13:25: „i se obraćam“ protumačeno kao „mi se obraća“.
- 19:01: „Zašto nisu upitali Bekra“ – upisano „Ebu Bekra“.
- Obraćanje „pošto vam obraću / nabraću / nadavraću“ dosljedno protumačeno kao „poštovana braćo“.

### 2026-09-05 – Ko mi garantuje dvije stvari, ja njemu garantujem Džennet (`iWW6haV1w7s`)

- 2:52: prenosilac hadisa („sehru“) upisan kao Sehl (hadis o garanciji za jezik i stidno mjesto, Buhari, od Sehla ibn Sa'da).
- 6:54: „Ato mesu do okazih kur'anski ayet“ protumačeno kao „A to nam je dokaz i kur'anski ajet“ – provjeriti.
- 8:26: kraj segmenta jako izobličen („teješko zaidnok viemi ka…“) – protumačeno kao „teško za jednog, za jednog vjernika“.
- 9:10–10:20: početak namaza (Fatiha, Ali Imran 18) – arapski tekst vraćen u standardni oblik; whisper je izostavio dijelove (npr. „الرحمن“, sredina ajeta 3:18), pa je ajet dopunjen – provjeriti da li je učen cijeli ajet.

### 2026-08-29 – Kada se ljudi boje nečijeg zla (`eGtVLmLLxYU`)

- 4:05: „ova deponija koja nam je u Avlijama“ – naziv mjesta nesiguran, ostavljen kako je prepoznat.
- 4:49: hadis „Inne šerran-nasi indallahi menzileten…“ – transliterisan prema poznatom tekstu (Buhari); prijevod („najgori ljudi, najomraženiji ljudi na Sudnjem danu…“) rekonstruisan iz jako izobličenog teksta.
- 5:50: „upali u neku rubu“ – nejasno.
- 6:37: „Hoće li da te oljaga“ – ostavljeno; „Ne moraš sa njim da staneš“ promijenjeno u „Ne možeš“ (smisao rečenice).
- 7:30: hadis „Mustarihun ve mustarahun minhu“ – whisper: „onaj ko se odmorio JE onaj od koga…“, upisano „i onaj“ (hadis govori o dvije vrste ljudi).
- 8:03: „od njegovog zjećenja“ – nejasno.
- 9:25: „predznak prije jelebi 400 godina“ protumačeno kao „prije hiljadu i četiristo godina“ – provjeriti.

### 2026-08-22 – Trebamo kvalitetne ljude (`URC-DOi3T-c`)

- 1:18: obraćanje „poštu anabrachio cienjeni bierni cien Allah“ protumačeno kao „Poštovana braćo, cijenjeni vjernici, cijenjeni… Allah“ – provjeriti.
- 2:05: „dostojanstveno ga uslovljava“ – ostavljeno kako je prepoznato (smisao nejasan).
- 6:53: „čovjek koji nuroglisa“ – nejasno.
- 7:39: „E nije pojedinic jednog čarvika“ – nejasno; „Ebu Ebu Musa je rešavija“ upisano kao Ebu Musa el-Eš'ari.
- 8:39: „Haqa ibn Amra“ upisano kao Ka'ka' ibn Amr (poznata predaja o Ebu Bekrovom pojačanju Halidu).
- 10:24: „I Allah je govara“ – nejasno.
- 12:14: **imena provjeriti**: „Nehmeda Šamsikadića tljevarskog muvciju“ upisano kao „Mehmeda Šemsikadića, pljevaljskog muftiju“; „Ačifa Efendiju rahmetli muftiju“ kao „Atif-efendiju, rahmetli muftiju“; „mama Efendiju“ ostavljeno kao [nejasno].

### 2026-08-15 – Ne uzdiži sebe ponižavajući grješnika (`kuc8NpVvqAc`)

- 0:02–1:41: arapski uvod i početak bosanske zahvale nisu transkribovani; segment u 1:41 počinje usred rečenice („…Gospodaru svih svjetova“).
- 2:19: hadis „svaki sin Ademov je griješan…“ – „da ne boli onaj koji se kaje“ upisano kao „da je bolji onaj koji se kaje“.
- 3:56: „Ibn Tayim“ upisano kao Ibn Kajjim (poznata izreka o prigovaranju bratu zbog grijeha).
- 8:16: „džemal“ protumačeno kao „džemat“.

### 2026-08-07 – Nepokornost Allahu (`GBqnrw_N9k8`)

- 4:50: „Bilo vuduljivo al asal“ protumačeno kao „bil-guduvvi vel-asal“ (i ujutro i navečer); „Ali zato je nabio sahad“ kao „navio sahat“.
- 6:14: „sve ovo draga braća Islam“ (dva puta) – rečenica nedovršena ili nedostaje riječ (vjerovatno „islam naređuje/traži“); ostavljeno „Sve ovo, draga braćo, islam…“.
- 6:14: „i lijepo mjernicu“ – nesigurno („mjericu“).
- 9:15–9:43: jako izobličen dio („Allah Bustanik nauwe zemni Zadužen dalam dostali objav“, „I onam narijuje osimuna“) – rekonstruisano kao „Allahov Poslanik na ovoj Zemlji, zadužen da nam dostavi objavu … i on nam ne naređuje osim ono što nam Allah naređuje preko njega“ – provjeriti.
- 10:11: završna dova jako izobličena – rekonstruisano „da nas učini pokornim Njegovim robovima“.

### 2026-08-01 – Vjernik je ogledalo vjerniku (`aFCBrBJYZik`)

- 1:53: „napravi put taj od upućenih“ protumačeno kao „uputi na pravi put, taj je od upućenih“.
- 5:14–5:49: hadis „Vjernik je vjerniku ogledalo“ – arapske riječi hadisa (koje govornik najavljuje) nisu u transkriptu; whisper je dao „ogledalom“, upisano „ogledalo“.
- 13:37 (lijepa riječ kao lijepo drvo, Ibrahim 24–26) – parafraza govornika, ostavljena.
- 9:19: „bašće/bašte“ ujednačeno kao „bašče“.

### 2026-07-25 – Tri temelja lijepog odnosa prema vjerniku (`FBOlD4Vc82E`)

- 3:11: „Jahja ibn Mu'ad / Jahay ibn Maaz / Jahid ma'ad“ ujednačeno kao Jahja ibn Muaz (poznata izreka o tri stvari: ne šteti, ne rastuži, ne kudi).
- 4:15: „zvati inspekciju ili grad i kuću“ – nejasno.
- 4:31: „zbog nekog našeg jira“ – nejasno.
- 6:11: „da mu putiš salje“ – nejasno (možda „selam“).
- 7:34: „nekog džematljuga na panel“ – nejasno (vjerovatno „napadne“).
- 8:09: „Samo razmi“ protumačeno kao „Samo razmisli“ – provjeriti.
- 9:20: druga hutba na arapskom – sredina rečenice „تعظيما لنبيه وتكريما لفخامته شأن شرف صفي“ ostavljena kako je prepoznata (vjerovatno izobličena).

### 2026-06-21 – Pouke i poruke hidžre (`2LYay4qb2aQ`)

- 4:08: „na hađetu poubijani“ upisano kao „na Hadžetu“ (stratište kod Novog Pazara nakon Drugog svjetskog rata) – provjeriti.
- 4:34: „rahmetni muftiju“ upisano kao „rahmetli muftiju“.
- 5:48: „da je neka najšljetije mjesto“ protumačeno kao „da je Mekka najsvetije mjesto“.
- 7:08: „šta je nevići cilj“ protumačeno kao „najviši cilj“.
- 8:09: „I jednim drugima preporučujte istinu Islama. Strpljenje.“ – vjerovatno parafraza sure El-Asr („istinu i strpljenje“); upisano „istinu, i… strpljenje“.
- 11:11: „Što pustiš sa oni“ – nejasno.
- 12:02: „da bi čovjek uzeo i pred pouku“ – upisano „uzeo pouku“.

### 2026-06-07 – Umrlog (mejta) prati troje (`mWNwupesSts`)

- 0:00–1:05: arapski uvod nije transkribovan; Bosanska zahvala (1:05–1:46) nepotpuna (nedostaje „Gospodaru džinna i ljudi“ – nije dodavano).
- 2:26: hadis „Jetba'ul-mejjite selasun“ (Enes ibn Malik) – transliterisan po poznatom tekstu.
- 7:39–9:21: izraz „nikome ga ne zna / znati ga“ protumačen kao „niko mi ga ne zna / zna ti ga (Onaj koji je stvorio nebesa i Zemlju)“ – provjeriti.
- 8:37: „Mi ti namazom, stvorite nebesa i zemlje“ protumačeno kao „ni namazom. Stvoritelj nebesa i Zemlje…“.
- 9:21: najavljeni ajet nije prepoznat (vjerovatno „ve men esa'e fe alejha“), ostavljen samo prijevod.
- 11:13: dio završne dove nerazumljiv (whisper je dao malteške znakove) – [nejasno].

### 2026-05-16 – Uzroci pokvarenosti srca (`obw7ke2ufCI`)

- 3:45: ajet o očvrsnulim srcima (El-Bekare, 74) – „ili još tvrđa od toga“ rekonstruisano iz „I ještje o toga“; „In spaša od faraona“ protumačeno kao „kako ih je Musa spasio od faraona“.
- 4:27: „obožavali trme“ protumačeno kao „obožavali tele“.
- 5:40: treći razlog Hasana el-Basrija („kada rade tuša su u kuće“) – nejasno.
- 6:03: „On švi zna mu cijela čaši“ – nejasno.
- 7:24: „Ja sposao i moji deset prstiju“ – nejasno.
- 7:47: „Ja ću vam naplati“ – nejasno; ajet (Ibrahim, 7) transliterisan po poznatom tekstu; „in Allaha seriju la itab“ upisano kao „innallahe seri'ul-ikab“ – provjeriti.
- 9:28–9:44: „E, kaže Hamas, reći se da nisam, kaže, ništa rekao. Nema posljedaka.“ – nejasno; „mahanne nema“ = izreka „Učinjenom poslu mahane nema“.
- 10:18: „Ja ko je fedijer, ne gledam se svega i svačega“ – nejasno.
- 10:51: „sjedite pa sanite“ i „od njega nije će biti“ – nejasno.

### 2026-05-12 – Da li doprinosimo Allahovoj vjeri (`u481wbnz8mE`)

- Kvalitet automatskog transkripta ovog snimka je posebno loš (uvod i završetak gotovo nerazumljivi); više mjesta označeno [nejasno].
- 2:19: hadis o ženi koja je čistila Poslanikovu džamiju (Ebu Hurejre) – „praćala bistvari na svoje vjezko“ nejasno.
- 2:48: „žena koja nije bila rakina … a neki kaže da je bila rakina“ protumačeno kao „Arapkinja“ – provjeriti.
- 4:14: drugo „naluti“ prije „klanja dženazu“ – nejasno.
- 5:03: „ali dijaka“ – nejasno.
- 6:13: „Boga od nas zna odgovor“ – nejasno (vjerovatno „malo ko od nas“).
- 6:32: „obestanje“ protumačeno kao „abdesthana“.
- 8:32: „moramo se vidjeti“ protumačeno kao „moramo se mijenjati“.
- 9:03: „da se vratimo, a na toga i svim molim vrijednostima“ – prva riječ nejasna; „molim“ protumačeno kao „moralnim“.
- 9:53: završna dova („Iqbali inga uzushan avta asulidha u jundhu…“) rekonstruisana prema ustaljenom završetku ovog hatiba („Molim Njega Uzvišenog da nas sastavi u Džennetu. Amin…“) – provjeriti.

### 2026-05-02 – Deset oporuka u suri El-En'am (`y7-Zaiv3UDE`)

- 1:25–1:55: bosanska zahvala na početku nije transkribovana; segment u 1:55 počinje usred rečenice.
- Ajeti sure El-En'am (151–153) i ostali citirani ajeti (El-Isra 23, El-Mutaffifin 1–3, En-Nisa 10) vraćeni u standardni arapski tekst / transliteraciju.
- 4:21: pitanje upućeno Poslaniku (vjerovatno „koji je grijeh najveći“) nije prepoznato.
- 7:31: izreka Ibn Abbasa („Men lem jekum bi hakkil-validejni…“) transliterisana iz izobličenog teksta – provjeriti.
- 11:19: „i te da ga vraću od kako ode“ – nejasno.
- 12:42: rečenica počinje „u slučaju zadovoljavanja pravde“ – vjerovatno „osim u slučaju“ (ajet: „illa bil-hakk“); nije dodavano.
- 12:57: „svaka duše u osnovi nebina“ protumačeno kao „svaka duša je u osnovi nevina“.
- 13:35: „da bi se, kaže moskali“ – nejasno (kraj ajeta „le'allekum ta'kilun“).
- 14:17: „Amidža uzme svoju movinu“ upisano kao „svu imovinu“ – provjeriti.
- 16:39: whisper je tri puta ponovio „wa bi'ahdillahi awfu“, a prijevod koji slijedi odgovara dijelu „ve iza kultum fa'dilu“ (kada govorite, budite pravedni); arapski dio zamijenjen sa [nejasno] – provjeriti.
- 20:00–20:18: dio o novotarijama („jer to Allah sada krene“) – nejasno.
- 20:41: završna dova rekonstruisana („koi swaya oba ziz punyawa barama Allah“ = „koji svoje obaveze ispunjavaju prema Allahu“) – provjeriti.

### 2026-04-25 – Šutnja nije opravdanje - sačuvajmo Rogoznu (`YFpo1trv5JM`)

- 2:47: ajet (El-Maide, 42) transliterisan kao „Semma'une lil-kezibi ekkalune lis-suht“.
- 5:38–6:00: whisper je dao „10.000. godine“ i „20. godine“ – upisano „2000. godine“ (izlivanje cijanida kod Baja Mare u Rumuniji, januar 2000.) – provjeriti šta je tačno izgovoreno.
- 6:19: „lijepe namere, Oni kompanija ogromni“ – rekonstruisano kao „U ‘lijepe namjere’ onih kompanija ogromnih … smo se svi uvjerili“ (ironija).
- 7:32: „svi misliti sa ovih prostora“ protumačeno kao „svi iseliti“.

### 2026-04-17 – Kako sačuvati djecu u ovim teškim vremenima (`byQky3asLV4`)

- 0:00–1:37: arapski uvod i početak zahvale nisu transkribovani; segment u 1:37 počinje usred rečenice.
- 4:48: „doba roditela se vrga vraća za svoje dijete“ – dio nejasan.
- 10:36: „šta se desilo u Tuskoj ovih dana“ upisano kao „u Turskoj“ – provjeriti (događaj sa igricom PUBG).
- 11:07: „ubiti nekoliko svojih vršnjaka, ne desetine“ – ostavljeno kako je prepoznato.
- 11:59: hadis o društvu (vjerovatno „Čovjek je na vjeri svoga prijatelja…“) – prvi dio nije prepoznat.
- 17:09: „Pasalijku para jedu kaje“ (o Ismailu, a.s.) – nejasno.
- 19:55: kraj dove na arapskom („إذا نسوا لده أجنة فقولوا“) – nejasno, zamijenjeno [nejasno]; ispravljena formula „أقول قولي هذا وأستغفر الله…“.
- Govornik nabraja stvari redom (prva, druga, treća, četvrta, šesta, sedma…) – „peta“ nije izričito izgovorena (ili nije prepoznata); na kraju kaže „ovih devet stvari“.

### 2026-04-05 – Tri stvari koje vode muškarca u propast (`7M3QgPEG7Xk`)

- 3:20–5:32: hadis Sevbana o djelima „poput planina Tihame“ koja postaju „hebaen mensura“ – arapski dijelovi transliterisani po poznatom tekstu (Ibn Madže); „uvaj thoban“ upisano kao Sevban.
- 9:13: hadis (Buhari i Muslim) – whisper je dao „da se NEĆETE natjecati u dunjaluku“; upisano „da ćete se natjecati“ (smisao hadisa) – provjeriti.
- 11:25: „Dunjaluk je sladak i zalim“ upisano kao „sladak i zelen“ (poznati hadis, Muslim).
- 13:47: „Allah … je jednom bludniku da bude na pravom putu“ protumačeno kao „ne da jednom bludniku“.
- 14:04: završna dova djelimično izobličena („Koyči bitti me istiqamatu“) – rekonstruisano „koji će imati istikamet na pravom putu“.

### 2026-04-05 – Musliman je muslimanu brat (`zOmGidryvss`)

- Kratak snimak (5 min); transkript se završava usred izlaganja (vjerovatno je i snimak skraćen).
- 0:00: arapski uvod u latinici ujednačen („Elhamdulillahi Rabbil-alemin…“).
- Hadis Ibn Omera („Musliman je muslimanu brat…“, Buhari i Muslim) – arapski dijelovi transliterisani po poznatom tekstu.
- 3:25: „mašala vrućan“ protumačeno kao „mašaAllah, ugrijan“.

### 2026-03-21 – Završetak sure Jusuf (`HNqEdoHMRIs`)

- Tefsir ajeta 102–111 sure Jusuf; citirani ajeti (Jusuf 102–111, Ali Imran 190, El-Isra 88, Eš-Šu'ara 84) transliterisani po standardnom tekstu jer je whisper arapski jako izobličio.
- 0:00: „والصلاة والسلام على عالمين محمد“ upisano kao „على نبينا محمد“ – provjeriti.
- 3:41: „većina ljudi nemozga“ (la ja'kilun) ostavljeno kao „nema mozga“ – moguće „ne razumije“.
- 5:53: „muhtivir anas shaykh wa slanika“ – nejasno (vjerovatno „obavještava/hrabri Svoga Poslanika“).
- 8:24 i 9:58: „i pred povuka“ / „povuka i pret“ – nejasna riječ uz „pouka“.
- 11:15: „Nemoj, draga braćo, također da budemo otmo nije … za koje kaže Poslanik: el-mustarih“ – smisao je vjerovatno „Nastojmo da budemo od onih…“ (mustarih = onaj koji se odmorio, pohvalno); ostavljeno „Nemoj“ kako je prepoznato – provjeriti.
- 11:32: „koji to neopet nevi namaza“ protumačeno kao „koji je klanjao pet namaza“.
- 11:51: „ne namreše ovaj čovjek“ – nejasno.
- 12:12: „vi će na nas u džamiju“ – nejasno.

### 2026-03-19 – Dolazak porodice i ostvarenje sna (`ZunOGAA0wSk`)

- Tefsir ajeta 93–101 sure Jusuf; citirani ajeti (Jusuf 84, 96–101, 4) i hadis o Allahovom spuštanju u zadnjoj trećini noći transliterisani po standardnom tekstu, jer je whisper arapski jako izobličio.
- 4:44: „Takako Jakub, odmai oprosti“ protumačeno kao „Pa Jakub ne oprosti odmah“ (smisao: obeća da će tražiti oprost u zadnjoj trećini noći) – provjeriti.
- 7:32: „sigurni od progonaha“ – „od progona“.
- 8:03: „Atahije“ upisano kao „tehijje“ (sedžda pozdrava).
- 11:51–12:32: kraj priče izobličen („pa je ta mudrost Allah subhanehu ve te'ala izah što ona vidjela“) – rekonstruisano.
- 15:53: „Inša Allahom dao svako dobro“ upisano kao „InšaAllah. Allah vam dao svako dobro“.

### 2026-03-19 – Otkrivanje identiteta (`_ZcWrGo3SVA`)

- Tefsir ajeta 88–95 sure Jusuf; citirani ajeti (Jusuf 88–95, El-Ankebut 2, Ali Imran 178, Et-Talak 2) i hadis o vrijednosti dunjaluka („krilo komarca“) vraćeni u standardni tekst / transliteraciju.
- 1:39–2:10: učenje ajeta 88 nije transkribovano.
- 6:35: „bili ste u okviru, u okviru“ – nejasno.
- 9:09: „pa vi ste uradili wakopa, wakopa…“ – nejasno.
- 9:47: jako izobličen segment („Naya mavića vammada nas uqara. Naya ci vas korit. Gaut tova.“) – rekonstruisano „neću vam danas [nejasno], neću vas koriti. Gotovo, Jusuf im je oprostio.“
- 11:09: „Pošta Yusuf on isu babovi istili da Yaqub uslipio“ – djelimično nejasno.
- 14:20: „umotamo u neko ćedru, neku mašenu“ protumačeno kao „u neku čevrmu, neku mahramu“ – provjeriti.
- 15:01: „ispostimo u ovo što stavlje mjeseca“ protumačeno kao „ispostimo i ovo što je ostalo od mjeseca“.

### 2026-03-15 – Jakubova (alejhisselam) bol (`lhF1N0P5hlo`)

- Tefsir ajeta 80–87 sure Jusuf i Ez-Zumer 53; citirani ajeti transliterisani po standardnom tekstu.
- 0:31: početak („Sirom, sure i usupnije“) – nejasno.
- 2:48: „kada je onaj spektor izvukao“ protumačeno kao „inspektor“.
- 4:06: „Pa je, kaže, osaburao lijepim saburom“ – upisano „sabur lijep“ (fe sabrun džemil) – provjeriti.
- 8:21: „Iako Bog da udovolite svome roku, nije će ga vratiti praznih ruku“ – djelimično nejasno.
- 8:57: „džabo mi mora da razumijemo“ – nejasno; „znao da je usluživ“ protumačeno kao „da je Jusuf živ“.
- 9:52: jako izobličen segment (Jusuf 87) – rekonstruisan po tekstu ajeta i njegovom prijevodu – provjeriti.

### 2026-03-15 – Optužba (`uZEkVKf2U68`)

- Tefsir ajeta 69–80 sure Jusuf; citirani ajeti transliterisani / ispravljeni po standardnom tekstu.
- 4:48: „Pa kaže, nashauje, nashauje“ – nejasno.
- 7:16: „bio je kod Hale“ – „hala“ (tetka po ocu) napisano malim slovom, nije ime.
- 8:38: „Pa je Allah nebole zna negdjeđe misljenje“ – riječ ispred „mišljenje“ nejasna.
- 13:05: „kaže daj bu drugo rečenje“ – nejasno.
- 14:59: „ono što kaže naši siktile“ protumačeno kao „ono što kažu naši stari“ – provjeriti.
- 14:12–15:40: dio o teravih-namazu (osam rekata, izlazak poslije četiri) ostavljen kako je izgovoren.

### 2026-03-13 – Drugi dolazak u Egipat (`pMcy2m2eQQE`)

- Tefsir ajeta 67–75 sure Jusuf; citirani ajeti transliterisani po standardnom tekstu (whisper ih je jako izobličio).
- 1:22: „da ne bi otisli noći, što bi rekli naši“ – nejasno.
- 1:41: „I da nas toritsa, bratje“ protumačeno kao „i to jedanaestorica braće“ – provjeriti.
- 4:22: izreka „što bi rekli naši, salama trnu zdravu nogu“ – nejasno.
- 4:05–5:48: predaja o Omeru i kugi u Šamu ostavljena kako je ispričana („jedan ashab“ – u poznatoj predaji Ebu Ubejde).
- 6:29: „Ja sam viče Jusuf“ – riječ nejasna.
- 7:51: dogovor Jusufa i Benjamina – dio teksta izobličen.
- 10:14: „da im kaže isljednjeg ove posude“ – nejasno.
- 10:45: prijevod ajeta 73 rekonstruisan; „da sve navratili kaže on espari“ protumačeno kao „da smo vam vratili one pare“.
- 12:11: „tok i tok“ – nejasno.
- 12:54: „Da ne presladimo jutro“ – nejasno.

### 2026-03-12 – Povratak ocu (`zA1UmsljDu0`)

- Tefsir ajeta 58–67 sure Jusuf; citirani ajeti i dova za zaštitu od uroka (Hasan i Husejn) transliterisani / ispravljeni po standardnom tekstu.
- 4:08: „Zar da ga povjerim vam“ – „na unihom molu“ protumačeno kao početak ajeta 64 („Hel amenukum alejhi“) – provjeriti.
- 5:34: bitka na Hunejnu – „Havazim i Thaqiv“ upisano kao Hevazin i Sekif.
- 9:17: „Kaže Jakub, da le nima“ – nejasno.
- 10:25: „ovaj Jezus se kaže oni popravili“ protumačeno kao „jer su se, kaže, oni popravili“.

### 2026-03-10 – Dolazak Jusufove braće (`w6pUYGGH9OE`)

- Tefsir ajeta 54–62 sure Jusuf; citirani ajeti (58–61) transliterisani po standardnom tekstu.
- 7:28: „pa je posle nakruva uplašimama“ – djelimično nejasno (upisano „poslije [nejasno] zaprijetio“).
- 8:30: whisper je dao „nećemo to odradit“, a iz konteksta (bili su sigurni) upisano „Mi ćemo to odraditi“ – provjeriti.
- 13:02: „za one robove koji su muštehni“ – nejasno.

### 2026-03-09 – Položaj Jusufa u Egiptu (`deiEHbCsf50`)

- Tefsir ajeta 50–57 sure Jusuf; citirani ajeti (Jusuf 54–57, Junus 26, Ed-Duha 4) i hadis Abdurrahmana ibn Semure o traženju vlasti vraćeni u standardni tekst / transliteraciju.
- 1:07: „tumačenje nego osnova, sna“ protumačeno kao „tumačenje njegovog sna“.
- 7:54: „kao što je rekao na jedan teška vremena“ – citirana izreka („teška vremena rađaju jake muškarce…“); autor nije prepoznat.
- 8:53: „to je situacija nije malo izrba“ – nejasno; „Pa je u prvoporu kapa sanika“ protumačeno kao „u prvom redu (poruka) Poslaniku“.
- 11:19: „a nik bi će blagodati u džanetu, da će ovdje gledao u Allaho lice“ – rekonstruisano „najveća blagodat u Džennetu jeste da će (vjernik) gledati u Allahovo lice“.

### 2026-03-08 – Poruke i pouke bitke na Bedru (`7GERYBiHmIU`)

- Kvalitet automatskog transkripta je slab u drugoj polovini (9:48–12:52, dio o Bliskom istoku, Iranu, Gazi i stanju u gradu) – više mjesta je [nejasno]; **taj dio obavezno preslušati** prije objavljivanja, jer se radi o osjetljivim tvrdnjama.
- 3:35: „sa preko Hiragu boraca“ upisano kao „sa preko hiljadu boraca“; „poslao je do opis u Meku“ – nejasno ko/šta je poslano.
- 4:03–4:48: ajeti iz sure El-Enfal (7, 9, 11) transliterisani po standardnom tekstu.
- 7:06: „Osim Ana samo 14“ – nejasno (vjerovatno broj šehida).
- 7:46: „bitan imaan usepsu i urluchunost“ i „imta utobe u imaan“ – nejasno; ajet El-Bekare 249 transliterisan.
- 8:27: „Allah ne neće da pobiti tako će“ – nejasno; Ali Imran 103 dat u prijevodu kako ga je govornik naveo.
- 10:35: „Gdje god su šije, trošile na gomu“ protumačeno kao „Gdje god su šiije stupile nogom“ – provjeriti.
- 10:35: „ono što je Allah … istio od te potvore“ – vjerovatno aluzija na potvoru protiv Aiše, r.a.; prethodni dio nejasan.
- 12:01: „Vidjeli smo večer šta se dešava“ upisano kao „sinoć“; 12:26: „Valah je spravo za ispitivanje“ – nejasno.

### 2026-03-08 – Kraljev san (`emwe4sORGW8`)

- Tefsir ajeta 42–49 sure Jusuf; ajet 43 ispravljen u standardni arapski tekst; prijevod koji je slijedio whisper je pretvorio u besmislene arapske znakove – zamijenjeno [nejasno].
- Hadis „Alejkum bis-sidk…“ (istina vodi ka dobročinstvu…) transliterisan po poznatom tekstu.
- 4:37: „Iksosi / hiksonci“ ujednačeno kao Hiksosi.
- 6:38: govornik spominje pitanja o Zulkarnejnu, Ruhu i Hidru – ostavljeno kako je rečeno.
- 6:57: predaja o imamu Maliku („Recite: imam Malik ne zna“) – „Već ste“ protumačeno kao „Recite“.
- 7:27: početak („Moj, drži se svoje struke“) – nejasno.
- 14:25: „to bi imalo sa tima da se priča“ protumačeno kao „danima bi imalo da se priča“.

### 2026-03-08 – Istina izlazi na vidjelo (`mn7ZqCXMUXs`)

- Tefsir ajeta 43–53 sure Jusuf; citirani ajeti (Jusuf 50–53, El-Isra 23, El-Kijame 2, El-Fedžr 27–30) transliterisani / ispravljeni po standardnom tekstu.
- 4:17: „Ona, ekri mi me thva“ protumačeno kao „Ekrimi mesvahu“ (Jusuf 21).
- 8:24: od priznanja premijerove žene prepoznato je samo „nafsi“ – dopunjeno „Ene ravedtuhu an nefsihi“ (Jusuf 51) – provjeriti.
- 10:05: „da li ova žena granačnika“ – upisano „dalje ova žena“.
- 11:07: „što si moroviće pet eura“ – nejasno.
- 11:47: segment o „nefsul-mutmeinne“ i Ebu Bekru jako izobličen – samo ajet El-Fedžr 27–30 pouzdano rekonstruisan; ostalo [nejasno] – provjeriti.

### 2026-03-07 – Jusufovo (alejhisselam) tumačenje snova (`wKGhHti8z_8`)

- Tefsir ajeta 36–42 sure Jusuf; citirani ajeti (Jusuf 38–42, 45, Ta-Ha 131) i hadis o morskoj vodi transliterisani po standardnom tekstu.
- 4:50–6:11: whisper je bosanski prijevod ajeta pretvorio u besmislene arapske/perzijske znakove; zadržani su samo arapski dijelovi ajeta koji su prepoznati („ولكن أكثر الناس لا يشكرون“ i sl.), ostalo [nejasno].
- 7:55: „krenuo da poziva u dvojcu“ protumačeno kao „da poziva ovu dvojicu“.
- 14:32: „A ne može da se setio koji je zabaravio“ – smisao argumenta (zaboravio je mladić, ne Jusuf) jasan, ali rečenica nejasna.
- 15:25: „presilio Hamidža“ upisano kao Hatidža.

### 2026-03-05 – Jusuf u zatvoru (`NtpMnFzhuLk`)

- Tefsir ajeta 35–37 sure Jusuf; citirani ajeti (Jusuf 36–37, El-Kasas 78) transliterisani po standardnom tekstu.
- 8:04: „da niya Allah tiya da muda nebi muda“ protumačeno kao „da Allah nije htio da mu da, ne bi mu dao“.
- 9:27: ajet (El-Enbija 25) dat u prijevodu kako ga je govornik izgovorio.
- 10:07: „da ne presladimo večeras“ – izraz nejasan (ponavlja se i u drugim dijelovima serijala).

### 2026-03-03 – Jusufova dova i zatvor (`qXLkbRDfC4E`)

- Tefsir ajeta 31–35 sure Jusuf; citirani ajeti (Jusuf 33–34, El-Bekare 155–156, 186, El-Ankebut 2) transliterisani po standardnom tekstu.
- 2:00–2:17: učenje ajeta nije transkribovano.
- 3:51: whisper „strah me da neću uraditi … da neću podleć“ upisano kao „da ne uradim … da ne podlegnem“ (smisao: boji se da će podleći).
- 4:34: stih arapskog pjesnika „La hajre fi lezzetin min ba'diha sekar“ transliterisan.
- 6:15: „pa da Allah u neseđu“ – nejasno.
- 9:05: „njegov ga narodi seru“ – nejasno.

### 2026-03-02 – Širenje glasina po gradu (`SA41VjT-FHk`)

- Tefsir ajeta 26–32 sure Jusuf; citirani ajeti (Jusuf 30–32) transliterisani po standardnom tekstu.
- 0:00–1:01: početak izlaganja (nakon uvoda) nije transkribovan; segment u 1:01 počinje usred rečenice.
- 5:06: „mi indar dalije po se naslane“ protumačeno kao „mindere, da se naslone“.
- 5:29: „na jedan malo poduži posebek“ – nejasno.
- 7:28: „isekles sonimno jerima otelike lepote“ protumačeno kao „isjekle su se onim nožem, od tolike ljepote“.

### 2026-03-01 – Potvora na Jusufa (`MI8D-L8UAJg`)

- Tefsir ajeta 23–29 sure Jusuf; citirani ajeti (Jusuf 25–29) ispravljeni / transliterisani po standardnom tekstu.
- 8:45: „kada neko okuša Adamu“ – nejasno.
- 10:21: el-Kurtubi i njegovo djelo („Jamil Ahkian“ = „El-Džami' li ahkamil-Kur'an“); tvrdnja da je otišao u Egipat „nakon što je Španija pala“ ostavljena kako je izgovorena.

### 2026-02-28 – Pokušaj zavođenja i poziv na grijeh (`zQJBEWDjx4o`)

- Tefsir ajeta 21–25 sure Jusuf; citirani ajeti (Jusuf 23–24, El-Isra 32) i hadis o sedmorici pod hladom Arša ispravljeni / transliterisani po standardnom tekstu.
- 0:00: „نستعلم وذلل السلام tefsirom“ – whisper je bosanski početak napisao arapskim slovima; upisano „Nastavljamo dalje sa tefsirom“.
- 9:44–10:01: „on ti u tom trenutku njud udari“ protumačeno kao „on htio u tom trenutku nju udariti“ (drugo mišljenje mufessira) – provjeriti.
- Govornik nabraja razloge Jusufovog odbijanja („druga stvar“, „četvrta stvar“) – treći razlog nije izričito označen.

### 2026-02-27 – Od bunara do dvora: Jusufovo putovanje ka izbavljenju (`D5dW3N4gbkA`)

- Tefsir ajeta 15–21 sure Jusuf; citirani ajeti (Jusuf 19–21, El-Kasas 26) i izreka Ibn Mes'uda o trojici najpronicljivijih transliterisani po standardnom tekstu.
- 0:00: kraj uvodne formule na bosanskom („Nego porod su druga ashaba…“) – početak nije prepoznat.
- 5:52: „prodaše ga … za Sijiću, za nekoliko djeljnjeva“ protumačeno kao „za sitniš, za nekoliko dirhema“.
- 13:41: „ako Bog da sultran salamu sa ovom pridimom“ protumačeno kao „sutra nastavljamo sa ovom predivnom (pričom)“.

### 2026-02-25 – Jakubovo (alejhisselam) strpljenje (`STU4F1CXHuU`)

- Tefsir ajeta 15–18 sure Jusuf; citirani ajeti (Jusuf 18, El-Bekare 156) i hadisi („Es-sabru indes-sadmetil-ula“, predaja o potvori protiv Aiše) transliterisani po poznatom tekstu.
- 5:17: „kaže sve ome, kaže ovo šeitan“ protumačeno kao „Sevvelet…“ (početak „bel sevvelet lekum enfusukum“).
- 9:44: kraj hadisa („jabbasat, saburaj … jahseda sabura“) – nejasno.
- 11:57: „za blut ili za neki drugi gdje“ – kraj rečenice nejasan.

### 2026-02-24 – Bacanje Jusufa u bunar (`lsey2WAm6LQ`)

- Tefsir ajeta 11–15 sure Jusuf; citirani ajeti (Jusuf 11, 13–15, El-Bekare 216) i hadis-kudsi „Ene inde zanni abdi bi“ transliterisani / ispravljeni po standardnom tekstu.
- 3:47: kraj rečenice braće („nema moshkosni“) – nejasno.
- 5:22: „kaže šej Hibnu Sejmin“ upisano kao „šejh Ibn Kajjim“ (izreka o tri korijena grijeha: zavist, pohlepa, oholost, iz djela El-Fevaid) – provjeriti ime.
- 10:10: bosanski prijevod ajeta El-Bekare 216 whisper je pretvorio u besmislene arapske/perzijske znakove – zamijenjeno [nejasno].

### 2026-02-23 – Zavjera protiv Jusufa (`Twjne-X8VhI`)

- Tefsir ajeta 8–12 sure Jusuf; citirani ajeti (Jusuf 8–9, El-En'am 43, El-Bekare 168) ispravljeni / transliterisani po standardnom tekstu.
- 5:01: „Nakon što se Jusuf ova vraća dogoriše iz dvije“ – kraj fraze nejasan.
- 8:48: „dok nisu došli do toga da ubiju Jusufa“ – ostavljeno kako je izgovoreno (u priči ga nisu ubili, nego bacili u bunar).

### 2026-02-23 – Sura El-Kijame (Smak svijeta), ajeti 20–40 (`hRR7ywKCs-Q`)

- Učenje sure El-Kijame, ajeti 20–40 (bez govora na bosanskom). Arapski tekst je zamijenjen standardnim tekstom Kur'ana (s harekatima), jer je prepoznati tekst nedvosmisleno ovaj odlomak; whisper je izostavio dijelove ajeta 37 („مِنْ مَنِيٍّ يُمْنَى“) i 40 („أَنْ يُحْيِيَ الْمَوْتَى“), koji su dopunjeni.

### 2026-02-22 – Ljubomora Jusufove braće (`-QKGCdrGiRQ`)

- Tefsir ajeta 7–8 sure Jusuf; citirani ajeti i hadis „El-hasedu je'kulul-hasenati…“ transliterisani po poznatom tekstu.
- 4:06: majka Jusufa i Benjamina („Rahim“) upisana kao Rahila.
- 8:25: „ibnuka im navodi tri vrste zavisti“ upisano kao Ibn Kajjim; govornik zatim opisuje dvije vrste.
- 9:15: „To je snijeće da mu iako ima zavis, snijeće svome bratu dok čini na pravdu“ protumačeno kao „ne smije svome bratu da čini nepravdu“.
- 10:17–10:50: učenje sura El-Felek / En-Nas nije transkribovano.

### 2026-02-21 – Očev mudri savjet (`MYCk52q8EAU`)

- Tefsir ajeta 4–6 sure Jusuf; citirani ajeti (Jusuf 5–6, 86, En-Nisa 119–120) i hadis o lijepom i ružnom snu transliterisani po poznatom tekstu.
- 4:15: „ide kod svoje nebojne dugerice“ protumačeno kao „najbolje drugarice“.
- 6:14: Iblisove riječi „ve le udillennehum edžmein“ – ostavljeno kako je izgovoreno (kombinacija više ajeta); „ovim honim, strahom“ – nejasno.
- 9:23: „ali nije to radio, poslovno hođe“ – nejasno.

### 2026-02-20 – San mladog Jusufa (`rEHmZdMmp5o`)

- Tefsir ajeta 4 sure Jusuf (san mladog Jusufa).
- 0:29: početak (hamd i salavat) nije transkribovan; segment počinje usred rečenice.
- 2:03: majka Jusufova („Rahim“) upisana kao Rahila.
- 4:45: „nikako ne smijemo da ne izminjujemo svoje očeve“ – glagol nejasan.
- 8:39: predaja o Muazu ibn Džebelu i sedždi pozdrava – „došao iz Jemena“ ostavljeno kako je izgovoreno.
- 9:52: „nadam se da će biti, ako Bog da, zemlju“ – nejasno (vjerovatno „korisno“).

### 2026-02-19 – Uvod u suru Jusuf - Najljepša kazivanja (`vMrS7K-eaxA`)

- Uvod u tefsir sure Jusuf (ajeti 1–3); citirani ajeti (El-Isra 88, Jusuf 1–3, Muhammed 24) i hadis „El-kerimu ibnul-kerim…“ transliterisani po poznatom tekstu.
- 0:32: početak hamda nije transkribovan; segment počinje usred rečenice.
- 3:46: „Nabdor ibn Harith“ upisano kao Nadr ibn Haris.
- 10:40: tvrdnja da priča o Jusufu „nije spomenuta u prijašnjim knjigama“ i da je „nisu znali niti Jevreji, niti kršćani“ ostavljena kako je izgovorena – imam neka provjeri formulaciju (priča o Josipu postoji u Tevratu/Knjizi Postanka; vjerovatno se misli na detalje kur'anske verzije).
- 8:03: „arapski jezik ima preko 12 miliona riječi“ – ostavljeno kako je izgovoreno.

### 2026-02-10 – Sura El-Kijame (Smak svijeta), ajeti 1–19 (`2nfqF0O9n2Y`)

- Učenje sure El-Kijame, ajeti 1–19 (bez govora na bosanskom). Arapski tekst je zamijenjen standardnim tekstom Kur'ana (s harekatima); whisper je imao više slovnih grešaka i izostavio „أن“ (aj. 4), „لِ“ (aj. 5) i „بِمَا“ (aj. 13).

### 2026-02-10 – Duhovna opskrba vjernika (`OI4e5BG2fBY`)

- Predavanje iz serijala „Duhovna opskrba vjernika“ (5. dio) o vrstama ibadeta: traženje zaštite (isti'aze), traženje pomoći, kurban, zavjet. Citirani ajeti (El-Enbija 25, El-Mu'minun 97–98, El-Felek, En-Nas, Ali Imran 191, El-Fatiha 5, El-En'am 162–163, El-Kevser, El-Insan 7) i hadisi (dova na kraju namaza, hadis Ibn Abbasa „Ihfezillahe jahfezke…“, hadis Alije o kurbanu, hadis Aiše o zavjetu) transliterisani po poznatom tekstu.
- 0:00–0:40: arapski uvod nije transkribovan.
- 6:52: ime onoga koji je opsihrio Poslanika („Labib“) upisano kao Lebid.
- 14:41: bosanski prijevod ajeta Ali Imran 191 whisper je pretvorio u besmislene arapske/perzijske znakove – zamijenjeno [nejasno].
- 17:31: „kao što mi govorimo te svih doba“ protumačeno kao „Te'svih-dova“ – provjeriti.
- 25:57: spominje se „naša sestra koja je preselila prije nekoliko…“ (prikupljanje novca za operaciju) – ostavljeno kako je izgovoreno; imam neka procijeni da li je za javnu objavu.
- 34:59: „ja ću da te s tim svakve“ – nejasno.
- 32:11 i dalje: dio o šiijama/rafidijama ostavljen kako je izgovoren.

### 2026-02-04 – Allahov Poslanik ﷺ žuri da uvede ljude u Džennet (`HFQL1lCg3Uc`)

- Halka hadisa (muftija hfz. Abdurrahman ef. Kujević) o Poslanikovom trudu da uputi ljude i smrti Ebu Taliba. Citirani ajeti (El-Ahzab 6, Eš-Šu'ara 3 i 214, Et-Tevbe 113 i 119, El-Kasas 56) i hadisi (Omer i ljubav prema Poslaniku, dova za Aišu, smrt Ebu Taliba, jevrejski dječak, „La jedhulul-džennete illa nefsun mu'mineh“, imena Eslem/Gifar/Suhejl) transliterisani / prevedeni po poznatom tekstu.
- 5:19 i dalje: drugi prisutni kod Ebu Taliba – whisper „Umeje ibn Ebi Hadar / Yumei ibn Khalab / Umejjebini Halef“; upisano „Umejje ibn Halef“ kako govornik kasnije izgovara (u Buharijinoj predaji to je Abdullah ibn Ebi Umejje) – provjeriti.
- 8:58: stihovi Ebu Taliba („Ve lekad alimtu bi enne dine Muhammedin…“) vraćeni u poznati arapski tekst; izobličeni dio između zamijenjen [nejasno].
- 11:36: „Mađar, rbna, reke, kevjeva“ – nejasno.
- 17:15, 21:16, 21:32: dio o frakcijama koje uvode Ebu Taliba u Džennet i o „velikom predvodniku“ koji je skoro preselio – više mjesta [nejasno]; ostavljeno kako je izgovoreno.
- 26:27: „tri i po miliona dokumenata, onog tamo nepomenika“ – ime nejasno (vjerovatno aluzija na nedavno objavljene dokumente); 26:49 „o galima“ – nejasno.
- 28:20–28:57: hadis o imenima plemena – „plene Salem“ upisano kao pleme Eslem; „Sahel“ kao Suhejl (ibn Amr, Hudejbija).
- 30:06: početak segmenta („Hkuni šeit“) – nejasno.
- 31:32: „Stakverova, Čakirsko“ – nejasno.

### 2026-02-01 – Duhovna opskrba vjernika (`ThpbeIh4YsM`)

- Predavanje iz serijala „Duhovna opskrba vjernika“ (4. dio) o obožavanju samo Allaha (tevhid el-uluhijje). Citirani ajeti (El-Enbija 25, El-A'raf 59, 65, 73, En-Nahl 36, El-Kijame 22–23, Ez-Zarijat 56, Ez-Zumer 3 i 30, El-Bekare 186, Et-Tevbe 31) i hadisi (Ibn Omer „Umirtu en ukatile…“, Muaz o pravu Allaha i robova, Itban, Ebu Bekrove riječi, prokletstvo onih koji grobove uzimaju za mesdžide, Adijj ibn Hatim) transliterisani po poznatom tekstu.
- 0:00 i 2:48: arapski dijelovi (uvod i citat) nisu transkribovani.
- 7:54: definiciju taguta govornik pripisuje „šejhul-islamu Ibn Tejmijji“ – ostavljeno kako je izgovoreno (poznata definicija je od Ibn Kajjima) – provjeriti.
- 14:47: „da se ne izleće prije njegovog učenika“ upisano kao „prije svoga učitelja“ (iz konteksta: „prije efendije, prije onoga koji ga podučava“).
- 21:23: „kako se ljudi krpe za mezar Poslanika“ – glagol nejasan.
- 23:56: „Hatim bin Hadi“ upisano kao Adijj ibn Hatim.
- 25:32: „Dok toga nagrabat će“ – nejasno.

### 2026-01-31 – Vrijednost pomaganja brata muslimana (`voLOTKD84Vg`)

- Hutba o hadisu Ebu Hurejre („Men nefese an mu'minin kurbeten…“, Muslim); dijelovi hadisa i ajeti ('Abese 34–36, Eš-Šu'ara 88–89) transliterisani po poznatom tekstu.
- 0:00–1:06: arapski uvod nije transkribovan.
- 8:11: „ko se podsmije bratu zbog grijeha, neće preseliti a da ga Allah ne iskuša istim grijehom“ – ostavljeno kako je izgovoreno.
- 16:32: kraj prve hutbe i početak druge („amicima amicima da sudima asvisma…“, „i atanas prada Allaha“) – nejasno.

### 2026-01-24 – Emanet (`iXV2v1vswrI`)

- Hutba o emanetu; hadis o čovjeku iz Benu Israila koji je pozajmio hiljadu zlatnika (Buhari) i hadis „Iza dujji'atil-emanetu…“ – prepričano kako je izgovoreno, arapski dio transliterisan.
- 1:59: bosanska zahvala na početku nije transkribovana; segment počinje usred rečenice.
- 4:21: „onaj unutarnji dio drveta otklonio“ upisano kao „izdubio“.

### 2026-01-19 – Četiri pitanja na Sudnjem danu (`6VaN1rUdWhQ`)

- Hutba o hadisu „La tezulu kadema abdin jevmel-kijameti…“ (Tirmizi); hadis nije izgovoren na arapskom u transkriptu (4:32 – samo prijevod). Citirani ajeti (Merjem 95, En-Nahl 116–117, En-Nisa 29) ispravljeni / transliterisani po standardnom tekstu.
- 13:58: bosanski prijevod ajeta En-Nisa 29 whisper je pretvorio u besmislene arapske znakove – zamijenjeno [nejasno].
- Govornik najavljuje „četiri pitanja“ (naslov), a na kraju nabraja „pet stvari“ (pitanje o novcu dijeli na dva) – ostavljeno kako je rečeno.
- 12:36: „Zato treba čovjek da pazi gdje je u djelju“ – kraj rečenice nejasan.
- 15:19: dio završne dove („danas učni atoni kujdayo hak suh medielu“) – nejasno.

### 2026-01-19 – Duhovna opskrba vjernika (`OIwrb0aL-W0`)

- Predavanje iz serijala „Duhovna opskrba vjernika“ (3. dio) o Allahovom gospodarstvu (rububijjet). Citirani ajeti (El-En'am 101 i 95–102, Et-Tevbe 30, Merjem 88–92, En-Nahl 57–59, En-Nedžm 21–22, Junus 31 i 56, El-Bekare 258, El-A'raf 29, El-En'am 2, Lukman 25 i 34, Hud 6, Er-Rum 40, El-Maide 101) i hadisi (hadis-kudsi „Kezzebeni ibnu Ademe…“, hadis o slikanju, čovjek koji je tražio da ga spale, melek zadužen za matericu, beduin koji pita Poslanika) transliterisani / ispravljeni po poznatom tekstu.
- 0:00: početak predavanja nedostaje; prvi segment počinje usred hadisa o slasti imana.
- 3:17: „Pa, su neki suviđi l-yevrij, da onza pa abdiju qur'an“ – nejasno.
- 5:54–6:58: dio o čestitanju praznika komšijama pravoslavcima ostavljen kako je izgovoren; „ovo se direktno veže za kin“ – riječ nejasna.
- 23:36: „Ja sam danas na hubi govorio, na izdini mi veno kadak…“ – nejasno.
- 27:55: „citiraš nam hadise nepeče“ – nejasno.
- 30:15: „Bače, još uutrbi biti za pihisa nočurek“ – nejasno.
- 35:51: „da vidi da nije od neki što je za lutoj“ – nejasno.
- 31:45: dio o grupacijama koje Aliji pripisuju upravljanje svemirom ostavljen kako je izgovoren.

### 2026-01-09 – Duhovna opskrba vjernika (`lRBp8Lr_CAc`)

- Predavanje iz serijala „Duhovna opskrba vjernika“ (2. dio) o imanu i bratskoj ljubavi. Citirani ajeti (Ali Imran 85, 103 i 110, El-Hudžurat 10–12, El-Enfal 63, El-Maide 2, 24 i 51, El-Hašr 9, Et-Tevbe 71) i hadisi (delegacija Abdul-Kajs, „Innallahe jerfe'u bi hazel-kitabi…“, „La tedhulunel-dženneta hatta tu'minu…“, „El-muslimu men selimel-muslimune…“, „Men ra'a minkum munkeren…“, „Zaka ta'mel-imani…“, „Selasun men kunne fihi…“, Omer i ljubav prema Poslaniku) transliterisani po poznatom tekstu.
- 1:11: šesti stub imana nije izgovoren do kraja („da vjeruje u Allahovu, subhanehu ve te'ala…“) – vjerovatno „odredbu (kader)“; nije dodavano.
- 2:29: u nabrajanju iz hadisa o delegaciji Abdul-Kajs govornik spominje i hadž – ostavljeno kako je izgovoreno.
- 12:15: „Saatib Umar“ upisano kao Sa'd ibn Muaz (vođa ensarija prije Bedra).
- 30:00: „ove stvari koje smo već raz naučili“ – riječ nejasna.

### 2026-01-09 – Dobra djela koja ne prestaju ni nakon smrti (`wL4N83HAKGk`)

- Hutba o hadisu „Iza matel-insanu inkata'a amelu illa min selasin…“ (sadekatun džarije, korisno znanje, dobro dijete) i hadisu o sadaki za umrlu majku – arapski dijelovi transliterisani po poznatom tekstu (hadis o tri stvari na početku nije prepoznat na arapskom, 3:28).
- 0:00–1:08: arapski uvod nije transkribovan.
- 9:58: „Pa kad ne preseliš“ upisano kao „kad preseliš“ (smisao rečenice).

### 2026-01-06 – Putovanje radi znanja (`0NxaZJg1zQA`)

- Halka hadisa (muftija hfz. Abdurrahman ef. Kujević) o delegaciji Abdul-Kajsa (Ibn Abbas; Buhari i Muslim). Arapski dijelovi hadisa i predaja („Merhaben bil-vefdi gajre hazaja ve la nedama“, „Inne fike la hasletejni…“, „E tedrune mel-iman?“, „Kullu muskirin haram“, hadis o prvoj džumi van Medine u Džuvasi) transliterisani po poznatom tekstu; ajeti (Ali Imran 133, El-Hadid 21, Ez-Zarijat 50) dati kako ih je govornik parafrazirao.
- 10:04: vođa delegacije („Al-Munfir ibn Aif Al-Shadj“) upisan kao el-Munzir ibn A'iz, el-Ešedž Abdul-Kajs.
- 11:28: „on je ostao na poveže 9“ – nejasno (u predaji je ostao kod jahalica/prtljaga).
- 24:42: „el-ilmu el-hašje“ – izreka „znanje je skrušenost“ transliterisana kako je izgovorena.
- 50:10: „biđu vađi minal Bahrein“ upisano kao „bi Džuvasa minel-Bahrejn“.
- 53:29: završna formula nejasna („sara vadi, sara vada…“).
- Više manjih mjesta označeno [nejasno] (npr. 1:09, 8:41, 11:08, 25:36, 27:17, 30:16, 43:29, 52:43).

### 2026-01-03 – Duhovna opskrba vjernika (`j3Bif94U1c0`)

- Prvo predavanje serijala „Duhovna opskrba vjernika“ („Zadul-ibad“) o imanu. Citirani ajeti (Lukman 25, El-Bekare 285, El-Hidžr 9, En-Nahl 36, El-Kijame 1–3 i 12, El-En'am 103, Et-Tevbe 124–125, El-Enfal 2) i hadisi (Džibrilov hadis, „El-imanu bid'un ve seb'une šu'beh“, delegacija Abdul-Kajs) transliterisani po poznatom tekstu.
- 8:24: whisper je dao „da vjerujemo da je Kur'an IZMIJENJEN od vremena Poslanika“ – upisano „neizmijenjen“ (iz nastavka rečenice i ajeta o čuvanju Kur'ana) – provjeriti.
- 8:04: „Da vjerujemo u Allahove knjige, mi moramo poslanicima“ – dio nejasan.
- 15:50: riječi munafika („Ismi ya valibise“) – nejasno.
- 19:38: „Rebi'a je otac ovoga Abdul-Kajsa“ – ostavljeno kako je izgovoreno.

### 2026-01-01 – "Zar ste mislili da smo vas uzalud stvorili i da Nam se nećete vratiti?" (`rCzQq8ZhLTc`)

- Hutba hfz. Edina Redžepovića; uvodna arapska formula (ista kao u hutbi uOrHIm0Tmc0) transliterisana; kraj „ve terekena ala-l-mehadždžetil-bejda'…“ vraćen u poznatu formulu (whisper: „Wa terekana bavduh, wa la tariq wa sabil“) – provjeriti.
- Citirani ajeti (El-Mu'minun 99–103 i 112–116, 'Abese 34–37, El-Fatiha 6, Ali Imran 8) i hadis o razgovoru Allaha sa džennetlijama i džehennemlijama prepričani kako ih je govornik naveo.
- 1:16: „Gospodaru ashraplemenitok“ upisano kao „Gospodaru Arša plemenitog“ (kao u drugoj hutbi istog hatiba).
- 13:08: „da nam olakša procese i dobra djela“ – riječ nejasna.

### 2025-12-19 – Poklon umra (`HcPnSj8Ph34`)

- Kratko obraćanje imama (poklon umra predsjedniku džematskog odbora) i ilahija na kraju.
- Ajet Et-Tevbe 18 transliterisan po standardnom tekstu.
- 2:22: **ime provjeriti**: „Seat Gigo“ upisano kao „Sead Gigo“; „sa šeihom, imamom Sadom, islamovićem“ – ime nejasno, ostavljeno „[nejasno] Islamovićem“.
- 1:05: „kaže Femije dole na Jeliji“ – nejasno.
- 4:41–kraj: tekst ilahije je whisper loše prepoznao; ispravljene su samo očite riječi, ostalo [nejasno] – tekst ilahije nije rekonstruisan napamet.

### 2025-12-13 – Posljedice grijeha (`tWXxPbIrl5o`)

- Hutba o posljedicama grijeha; citirani ajeti (Eš-Šura 30, El-Džasije 34, El-Bekare 74, El-Maide 78–79, Ali Imran 110, Et-Talak 2–3) i hadisi („Kullu beni Ademe hattaun…“, „Innel-abde le jetekellemu bil-kelimeti…“, hadis o srcu, hadis o melekima koji kažnjavaju narod) transliterisani / prepričani po poznatom tekstu.
- 11:37–14:19: dio o imamima, politici, korupciji i partijskom zapošljavanju ostavljen kako je izgovoren; dva kraća mjesta nejasna („u ajgrati ta kodale“, „Ali ako je FND, kaže FND“, „presednik je nedržavnik“) – **preslušati prije objave**.
- 17:02: „nema bereketa u slomenu ovcu“ – nejasno.
- 17:23: „ko salo konada greš lizno malizno“ – nejasno.
- 18:33: završna dova djelimično nejasna.

### 2025-12-12 – Kratki video sa predavanja (1/6) — 12. decembar 2025. (`Dnqhzz-b4gw`)

- Kratki video: učenje sure En-Neml, ajeti 16–19; ajeti vraćeni u arapsko pismo po mushafu (whisper ih je dao djelimično latinicom).
- 0:46–1:13: ajet 18 nije transkribovan – ostavljeno „[učenje na arapskom]“.

### 2025-12-12 – Kratki video sa predavanja (2/6) — 12. decembar 2025. (`GhdekPqiJd4`)

- Kratki video: jedan ajet (El-Ahzab 3 / 48), ispravljeno „وتفى“ → „وكفى“.

### 2025-12-12 – Kratki video sa predavanja (4/6) — 12. decembar 2025. (`WA79h85BTKU`)

- Kratki video bez govora (transkript prazan, 0 segmenata).

### 2025-12-12 – Kratki video sa predavanja (5/6) — 12. decembar 2025. (`eTjV_BlQIqk`)

- Kratki video bez govora (transkript prazan, 0 segmenata).

### 2025-12-12 – Kratki video sa predavanja (6/6) — 12. decembar 2025. (`fZ_cV_h1pcc`)

- Kratka dova/ilahija; 0:01–0:19 kraj „wa istuha ibi ya mannan“ nejasan (moguće „vestur ajbi“) – preslušati.

### 2025-12-12 – Kratki video sa predavanja (3/6) — 12. decembar 2025. (`m_aOyTS120Q`)

- Kratki video, samo učenje na arapskom – nije transkribovano.

### 2025-12-06 – Najvažniji ibadet - namaz (`AEnVHby0LNs`)

- Uvodna arapska hutba (0:37) transliterisana po standardnom tekstu; ajeti (Ibrahim 37, Sad 33, El-Munafikun 9, Merjem 30–31) i hadisi („Iza hazebehu emrun…“, „Erihna biha ja Bilal“) dati po poznatom tekstu.
- 7:30: „kako ćemo da stanevaksom“ – nejasno.
- 8:14: „potrčao je dobao i namaz“ – nejasno.
- 11:01: „svei je kuubi“ (šta je Sulejman uradio s konjima) – nejasno; preslušati.
- 12:01–12:40: ime/opis imama u Medini („Jeduard i Maglani“, „na Hubeifi“) i „farstanja 20 minuta“ – nejasno, napisano „ikindijski farz trajao 20 minuta“; **provjeriti**.
- 6:35: za Ibrahima je izgovoreno (prema transkriptu) „sallallahu alejhi ve sellem“ – ostavljeno.
- 17:08, 17:23, 17:58, 18:14, 18:36: više kraćih nejasnih mjesta (označeno [nejasno]).
- 17:58: „Džumu klanja 300 godina“ – ostavljeno kako je prepoznato, smisao nejasan.

### 2025-11-28 – Djela koja uvode u Džennet (`Labn-lIyEos`)

- Hadisi i ajeti (Džahima i „Džennet je kod majčinih nogu“, „tvoja majka“ tri puta, Jusuf 4–5, El-Isra 23–24, „propao je“, čovjek koji je uklonio drvo s puta, Rebi'a ibn Ka'b i sedžde, briga o jetimu, En-Nisa 2) dati po poznatom tekstu.
- 2:59: ime ashaba prepoznato kao „Jahmiya“ – napisano „Džahima“; odgovor ashaba djelimično nejasan.
- 5:59: kraj „prevaru odnetnoj“ – nejasno.
- 6:16: „čovjek se osjeća da je ti jasno“ – nejasno.
- 8:16: „toalet deski roditeli“ – nejasno.
- 8:59: početak „Adara kaže“ – nejasno.
- 12:22: „da se parkira, uzurbira“ – nejasno.
- 13:17: šta bi ljudi rekli („grada u budaka“) – nejasno.
- 14:14: „Svi ostanu dva, tri čoveka“ – početak nejasan.
- 14:35: „govorimo o onima koji klanjaju sunnete“ – po smislu možda „farzove“; ostavljeno kako je prepoznato.
- 16:06: „ne mogu da skolim sina“ – nejasno.

### 2025-11-14 – Djela koja uvode u Džennet (`barFCsIZ9uc`)

- Ajeti (El-Bekare 35–36, El-Ahzab 37, El-Bekare 238) i hadisi („Kullu ummeti jedhulunel-džennete illa men eba“, 99 imena, Ajetul-kursija poslije namaza, dvije ćerke, sabah i ikindija, put traženja znanja) dati po poznatom tekstu.
- 1:53: uvod prije ajeta (whisper dao bosanski govor arapskim slovima) – rekonstruisano samo „Kaže Allah, subhanehu ve te'ala, u Kur'anu… Ademu“; preslušati.
- 8:34: „Zbog toga da bi me ljudi vidjeli ili ne vidjeli“ – vjerovatno „ne zbog toga…“; ostavljeno kako je prepoznato.
- 11:44: početak „Hrvila ga vrća“ – nejasno.
- 13:59: „Lejle ti se u dan“ i „Osvi je peo Matufija“ – nejasno.
- 15:10: „pod Allahom“ – vjerovatno „pod Allahovom zaštitom“, nije dopisivano.
- 16:25: „Većine ljudi zasteje“ – nejasno.
- 10:51: „da dođem u džamiju pomriješem u roditelji“ – nejasno.

### 2025-11-07 – Veličina Allahove milosti prema Njegovim stvorenjima (`gG15f8_ArTg`)

- Hadis o majci nakon bitke na Hunejnu, hadis o stotinu milosti, „Er-rahimune jerhamuhumur-Rahman…“, ajeti (Merjem 53, El-A'raf 156, El-Hidžr 49–50) dati po poznatom tekstu.
- 1:49: nakon „na njegovu porodicu“ prepoznato „suhne“ – nejasno.
- 5:17: „Allahu akar tada da će“ – nakon „Allahu ekber“ nejasno.
- 6:00–6:21: rečenica „šta kaže majka?“ ostavljena kako je prepoznata.
- 0:00 i 12:32: arapski uvod i završetak hutbe nisu transkribovani.

### 2025-10-31 – Ko ostavi nešto radi Allaha, Allah će mu to nadoknaditi boljim od toga (`sTj84EHOB1E`)

- Priča o Suhejbu er-Rumiju, hadis „Rebihal-bej'u, ja Eba Jahja“, ajeti (El-Bekare 207, Et-Talak 2–3, Jusuf 33) i hadis „Men kezame gajzan…“ dati po poznatom tekstu.
- 5:21: „o Ebu Suhejbe“ ostavljeno kako je prepoznato (u predaji: „ja Eba Jahja“); „Allah ušta ayete“ – nejasno.
- 7:07: „glasnik Gaza“ – nejasno ispred „gazda“.
- 10:25: ajet koji se uči (Jusuf) nije transkribovan.
- 14:19: „sačuvati nedaća, šerra“ – djelimično nejasno.

### 2025-10-25 – 5 stvari koje uništavaju srce (`wt8rQ42I17k`)

- Pet stvari koje kvare srce po Ibnul-Kajjimu (kesretul-muhalata, plovidba morem želja, vezivanje srca za drugog mimo Allaha, kesretut-ta'am, mnogo spavanja); ajeti (El-Furkan 27–28, En-Nisa 120, Merjem 81–82, El-A'raf 31) i hadisi (o srcu, „čovjek je na vjeri svoga prijatelja“, trećine želuca) dati po poznatom tekstu.
- 8:12: „da bude opasan“ – nejasno.
- 10:01: „vi opustaneš radiš“ – nejasno; „nahizaš Kur'an“ napisano kao „naučiš hifz Kur'ana“ – provjeriti.
- 7:07: „Zašto da ga vreću?“ protumačeno kao „Za šta, draga braćo?“.
- 14:20: „dovoljno je čovjeku da zaspe 7 sati 8 sati“ – napisano „da spava“.

### 2025-10-12 – Poruke i pouke iz sure El-Beled (`MDBHc1KYF8M`)

- Tefsir sure El-Beled; ajeti transliterisani po mushafu tamo gdje ih je whisper prepoznao, prijevod ostavljen kako ga je izgovorio muftija.
- 2:50–3:55: dio prijevoda ajeta 3–5 nije prepoznat (prelazi s ajeta na prijevod).
- 16:11: „uz dvojnu opremu“ – nejasno.
- 16:35: „a kome ja spriječim napak“ – nejasno.
- 17:24: početak „Jedna vas posjeća“ – nejasno.
- 16:35–16:54: spominjanje blokada hrane i pića (aluzija na Gazu) ostavljeno kako je izgovoreno.

### 2025-10-08 – Sura En-Nahl (36-40) (`dqvoBwjRmpc`)

- Učenje sure En-Nahl 36–40; tekst ajeta ispravljen po mushafu (whisper je dao više pogrešnih slova i izostavio „أَرَدْنَاهُ أَنْ نَقُولَ“ u 40. ajetu).

### 2025-10-05 – Skupina koja će ući u Džennet (`EK91nQz1F8c`)

- Hadis Ijada ibn Himara o trojici stanovnika Dženneta, ajeti (Ali Imran 159, Et-Talak 2) i priča o beduinu koji je povukao Poslanika dati po poznatom tekstu.
- 0:00: na početku snimka stih „جدد حياة القلب بالقرآن…“ (vjerovatno uvodna špica) – ostavljen.
- 4:12–4:30: rečenice o Gazi i vladarima ostavljene kako su izgovorene („da skoro niko ne izađe…“ – nedovršeno).
- 5:21: „5. prve nukalama“ napisano kao „petog pravednog halife“ – provjeriti.
- 8:25: „pocrne na ovu ratu“ – nejasno.
- 8:44: „Ako mu se čovjek ne pita, anulica“ napisano „ako mu se čovjek ne javi na ulici“ – provjeriti.
- 12:43: dova protiv „oni ubi a yusak…“ – nejasno.

### 2025-08-30 – Kulturološka pripadnost islamu (`_9qWe3pe_k8`)

- Hutba o kulturološkoj pripadnosti islamu; hadisi („Men tešebbehe bi kavmin…“, „Ejjuhen-nas, efšus-selam“, hadis o ihsanu) i El-Bekare 208 dati po poznatom tekstu. Transkript je bio dobar, ispravke uglavnom pravopisne.
- 16:05–16:42: ekavski oblici („lepo“, „belo“, „mleko“, „dve“) **namjerno ostavljeni** jer ih hatib citira kao primjer tuđeg govora.
- 18:04–18:46: priča o hrišćanima Arapima i halifi Omeru ibn Abdulazizu (puštanje kose, makaze) – provjeriti da li je riječ o kosi ili bradi.
- 5:21: u nabrajanju imanskih šarta transkript nema Sudnjeg dana (vjerovatno izgovoreno, a nije prepoznato).

### 2025-07-27 – Hutba 25.07.2025. (`XyZ9pCBpPB0`)

- Hutba o „gornjoj ruci“ i halal zaradi; hadisi (dova „Allahumme inni es'elukel-huda…“, „gornja ruka je bolja od donje“, uže i drva, četiri dinara, „Allah je čist…“, „doći će vrijeme…“) i En-Nahl 97 dati po poznatom tekstu.
- 10:18: „u srnom hadisu“ – nejasno (moguće „u drugom“ ili „u sahih“).
- 13:40: „od vječje poniženja da obuče novom svijetu“ – nejasno.
- 15:29: kraj „pa oni to rade u jaču“ – nejasno.
- 16:48: „makar on rekao nekome, o Juno“ – nejasno (ajet El-Kijame 14–15).
- 18:05: „neke svoje vese“ napisano „veze“.

### 2025-07-23 – Opasnost javnog razvrata (`43grkcWOjiQ`)

- Predavanje o prvom dijelu hadisa Ibn Omera „Ja ma'šerel-muhadžirin, hamsun…“ (javni razvrat i bolesti); hadisi („Ko od vas vidi zlo…“, Zejneb bint Džahš „E nehliku ve fina-salihun“, „Innen-nase iza re'evul-munker…“) i El-Munafikun 8 dati po poznatom tekstu.
- 3:35: zahvala „Mešihatu Islamske zajednice u Srbiji, Medžlisu Novi Pazar“ – rekonstruisano iz „meširat islamske zajednice u Srbiji, među li su novi pazar“; provjeriti tačan naziv.
- 4:47: „Poslanikova te barake o tala brige“ – nejasno.
- 8:49: „Nego je posadnije i sada nešto naredno“ – djelimično nejasno.
- 16:26: „Odimana je“ – nejasno.
- 18:27: „kaže potamo se“ – nejasno.
- 26:18–26:59: „još ti se ljudima nameto kako ti liko ili ti to oboreš“ – djelimično nejasno.
- 27:46: „Totalizovan.“ – nejasno; 30:29: „Total ima drugačiju više“ i „nemađeš“ – nejasno.
- 29:50: „ili će vas uličiti“ – nejasno.
- 29:26: kritika mentaliteta „našeg naroda“ ostavljena kako je izgovorena.
- 34:04: **„da zna da mora da bude protiv istine“** – po smislu „protiv neistine“ (lapsus ili greška prepoznavanja); ostavljeno kako je prepoznato – preslušati.
- 40:59: dova za „braću u Siriji“ ostavljena; ponavljanje „Allaha molim da im olakša“ (3×) možda je ponavljanje modela – preslušati; završne riječi nejasne.
