# Fotografije na sajtu: izvori, potpisi i šta zamijeniti

Svi fajlovi su optimizovani WebP (ukupno oko 3,4 MB). Originali su preuzeti s javnih izvora navedenih
ispod. Fotografije **nisu slobodno licencirane**. Koriste se kao privremeni materijal za sajt same
džamije, uz potpis izvora. Prije zvaničnog objavljivanja džamija treba da potvrdi da ih smije koristiti
ili da ih zamijeni svojim fotografijama (vidi odjeljak 4).

## 1. Hero slika (za orkestratora)

| Fajl | Dimenzije | Izvor | Potpis |
|---|---|---|---|
| `public/images/dzamija-hero.webp` (≈180 KB) | 2000×1100 | naslovna fotografija `dzamija-jalija.jpg` iz izvještaja https://mesihat.org/2024/03/08/svecano-otvorena-dzamija-na-jaliji/ (snimak iz drona: fasada s doksatom, munara, nebo s oblacima) | Foto: Mešihat Islamske zajednice u Srbiji |

- Namjena: naslovna strana (hero), stranica „O džamiji” i OG slika (za OG izrezati na 1200×630 i
  centrirati na zgradu i munaru; gornja trećina je nebo, pa tu može stajati tekst).
- Original je širok 1413 px i za hero je uvećan oko 1,4 puta. Na velikim ekranima je blago mekši.
- Alternativa iz materijala same džamije: `public/images/galerija/dron-odozgo.webp` (1600×900, kadar iz
  4K dron-snimka s YouTube kanala džamije). Kompozicija je odozgo, bez neba.

## 2. Fotografije predavača (`public/images/imami/`)

Svaka fotografija je kadar iz videa s **vlastitog YouTube kanala džamije**. Ime predavača piše u naslovu
videa i na grafici u videu. Na hutbama predavač stoji na mimberu. Kadrovi su izrezani na glavu i ramena,
u dvije veličine: `<slug>.webp` (600×600) i `<slug>-200.webp` (200×200). Putanja je upisana u
`data/imami-bio.json` (`slika`), a izvor u `izvori` („Fotografija: …”).

| Predavač | Fajl | Izvor (video, trenutak) | Kvalitet |
|---|---|---|---|
| Hfz. Admir ef. Jašarević | `admir-jasarevic.webp` | „Istinsko popravljanje stanja”, https://www.youtube.com/watch?v=zViIQjXeAd8&t=200s (4K) | dobar |
| Muftija hfz. Abdurahman ef. Kujević | `abdurahman-kujevic.webp` | „Trebamo kvalitetne ljude”, https://www.youtube.com/watch?v=URC-DOi3T-c&t=102s (4K) | dobar |
| Hfz. Edin Redžepović | `edin-redzepovic.webp` | „Razumijevanje ibadeta u islamu”, https://www.youtube.com/watch?v=uOrHIm0Tmc0&t=360s (4K) | dobar |
| Edin ef. Salihović | `edin-salihovic.webp` | „Vjernik je ogledalo vjerniku”, https://www.youtube.com/watch?v=aFCBrBJYZik&t=88s (4K) | dobar |
| Muhamed Metjahić | `muhamed-metjahic.webp` | „Osnovni emanet”, https://www.youtube.com/watch?v=Sqw2IPRsP24&t=92s (4K) | dobar |
| Hfz. Zikret Mustafić | `zikret-mustafic.webp` | „Opasnost javnog razvrata”, https://www.youtube.com/watch?v=43grkcWOjiQ&t=302s (1080p) | dobar |
| Prof. Dženan ef. Kamešničanin | `dzenan-kamesnicanin.webp` | hutba 29. 8. 2025., https://www.youtube.com/watch?v=_9qWe3pe_k8&t=150s (1080p, snimano izdaleka) | srednji, mekši, pogled ustranu |
| Hfz. Ferid Fijuljanin | `ferid-fijuljanin.webp` | hutba 25. 7. 2025., https://www.youtube.com/watch?v=XyZ9pCBpPB0&t=150s (uspravni video, kontra-svjetlo) | srednji |

Potpis za sve: „Foto: kadar iz videa, YouTube kanal Džamija na Jaliji”.

Zašto nisu korištene druge fotografije: minijature videa (npr. muftija Kujević, hfz. Zikret Mustafić)
su grafike s izrezanom fotografijom, a ta fotografija vjerovatno potiče iz drugog izvora. Fotografije s
otvaranja (mesihat.org) nemaju potpise ko je ko, pa nisu korištene za portrete. Na Wikimedia Commons
nema slobodne fotografije muftije Kujevića.

## 3. Galerija (`public/images/galerija/`, `data/galerija.json`)

Za svaku sliku postoje dva fajla: `<ime>.webp` (najviše 1600 px po dužoj strani, 40–355 KB) i
`<ime>-600.webp` (sličica za mrežu galerije, 600 px po dužoj strani). U `galerija.json` je samo `src`
velike slike. Sličica se dobije zamjenom `.webp` sa `-600.webp`.

| # | Fajl | Šta prikazuje | Izvor | Potpis (`licenca`) |
|---|---|---|---|---|
| 1 | `dzamija-iz-drona` | dron: fasada, munara, džemat na otvaranju | mesihat.org (naslovna `dzamija-jalija.jpg`) | Foto: Mešihat IZ u Srbiji |
| 2 | `dron-odozgo` | dron odozgo: krov i munara u mahali | YouTube džamije, uvod videa https://www.youtube.com/watch?v=Sqw2IPRsP24 (≈29 s) | Kadar iz videa: YouTube kanal „Džamija na Jaliji” |
| 3 | `munara-nad-gradom` | vrh munare iznad Novog Pazara | isti video (≈18 s) | Kadar iz videa: YouTube kanal „Džamija na Jaliji” |
| 4 | `munara-izbliza` | drveni fenjer i krov munare izbliza | isti video (≈12 s) | Kadar iz videa: YouTube kanal „Džamija na Jaliji” |
| 5 | `dzamija-u-mahali` | iz zraka: džamija među kućama | mesihat.org, galerija izvještaja | Foto: Mešihat IZ u Srbiji |
| 6 | `dzamija-i-grad` | iz zraka: džamija i stambene zgrade | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 7 | `munara` | munara na plavom nebu (uspravno) | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 8 | `presijecanje-vrpce` | presijecanje vrpce na ulazu | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 9 | `alimi-u-dzamiji` | zajednička fotografija alima u molitvenom prostoru | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 10 | `molitveni-prostor` | mihrab, mahfil, tirkizni tepih | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 11 | `pogled-s-mahfila` | prepun molitveni prostor odozgo | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 12 | `dzemat-na-otvaranju` | džemat ispod lustera | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 13 | `unutrasnjost-lucni-prozori` | lučni prozori i kaligrafija | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 14 | `pogled-kroz-vrata` | pogled kroz drvena vrata | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 15 | `prostorija-na-spratu` | prostorija na spratu (sala/učionica) | mesihat.org | Foto: Mešihat IZ u Srbiji |
| 16 | `mimber` | obraćanje s mimbera | mesihat.org | Foto: Mešihat IZ u Srbiji |

Izvor fotografija 1 i 5–16: https://mesihat.org/2024/03/08/svecano-otvorena-dzamija-na-jaliji/
(svečano otvaranje 8. 3. 2024.). Isti izvještaj je objavio i sandzak.tv, s istom naslovnom fotografijom.

Namjerno izostavljeno:

- krupni planovi lica običnih vjernika s otvaranja;
- kadrovi djece iz mekteba (kratki video 12. 12. 2025.);
- kadrovi s tekstom ajeta preko slike (uvodi videa).

## 4. Šta džamija treba zamijeniti svojim fotografijama

1. **Sve fotografije s mesihat.org** (hero i galerija 1, 5–16). To su fotografije Mešihata. Treba
   tražiti pisanu dozvolu ili ih zamijeniti vlastitim snimcima. Prioritet: hero, eksterijer s ulice
   (fasada i doksat), enterijer bez ljudi (mihrab, mimber, mušebak), učionica u novom izdanju
   (oktobar 2026.).
2. **Hero:** poželjna je vlastita fotografija bez gužve, u većoj rezoluciji (najmanje 2400 px širine).
   Uvodni dron-snimak s kanala džamije je u 4K i može poslužiti ako postoji originalni fajl.
3. **Portreti predavača:** kadrovi iz videa su dovoljni, ali su to snimci usred govora. Bolje su
   zvanične portretne fotografije, a za **Fijuljanina i Kamešničanina** je zamjena posebno poželjna
   (mekši kadrovi). Predavače treba pitati da li se slažu s objavom fotografije.
4. Kadrovi s YouTube kanala džamije (galerija 2–4 i svi portreti) su materijal same džamije. Treba ih
   samo potvrditi.
