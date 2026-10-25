-- =====================================================================
-- seed-0005.sql — početni sadržaj za migraciju 0005 (programi, kartice, tekstovi, traka)
-- GENERISANO skriptom scripts/supabase-seed-0005.mjs — ne mijenjati ručno.
-- Generisano: 2026-10-25T16:11:18.965Z
-- Pokrenuti POSLIJE migracije 0005 (i seed.sql). Idempotentno.
-- =====================================================================
begin;

-- programi (9)
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$mekteb$s$, $s$Mekteb (vjerska pouka za djecu)$s$, null, $s$Mekteb$s$, $s$djeca$s$, null, null, null, null, null, true, 0) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$skola-kurana-hifz$s$, $s$Škola Kur'ana — hifz (žene)$s$, null, $s$Škola Kur'ana$s$, $s$žene$s$, null, $s$Ponedjeljak i četvrtak, sa jacije$s$, $s$Alma Uluč$s$, null, $s$upis-u-skolu-kurana-za-zene-i-djecu$s$, true, 10) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$skola-kurana-amme-hatma$s$, $s$Škola Kur'ana — hifz Amme džuza / hatma (žene)$s$, null, $s$Škola Kur'ana$s$, $s$žene$s$, null, $s$Srijeda i subota u 17:00$s$, $s$Alma Uluč$s$, null, $s$upis-u-skolu-kurana-za-zene-i-djecu$s$, true, 20) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$skola-kurana-tedzvid$s$, $s$Škola Kur'ana — tedžvid (žene)$s$, null, $s$Škola Kur'ana$s$, $s$žene$s$, null, $s$Srijeda i subota u 18:30$s$, $s$Alma Uluč$s$, null, $s$upis-u-skolu-kurana-za-zene-i-djecu$s$, true, 30) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$skola-kurana-djeca$s$, $s$Škola Kur'ana — hifz Amme džuza i tilavet za djecu$s$, null, $s$Škola Kur'ana$s$, $s$djeca$s$, null, $s$Subota u 12:00$s$, $s$Alma Uluč$s$, null, $s$upis-u-skolu-kurana-za-zene-i-djecu$s$, true, 40) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$hifz-amme-muskarci$s$, $s$Halka hifza Amme džuza (telkin, uz tefsir) — muškarci$s$, null, $s$Halke$s$, $s$muškarci$s$, null, $s$Utorkom, između akšama i jacije$s$, $s$hafiz Admir Jašarević$s$, null, $s$hifz-amme-dzuza-za-muskarce$s$, true, 50) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$sufara-zene-djeca$s$, $s$Sufara (arapsko pismo) — žene i djeca$s$, null, $s$Sufara$s$, $s$žene$s$, $s$Žene i djeca$s$, null, $s$Dženana Hasanović$s$, $s$Prijave za grupu koja je počela u oktobru trajale su do 16. 10. 2026. — prijava se evidentira za sljedeću grupu.$s$, $s$ucenje-sufare-za-zene-djecu-i-muskarce$s$, true, 60) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$sufara-muskarci$s$, $s$Sufara (arapsko pismo) — muškarci$s$, null, $s$Sufara$s$, $s$muškarci$s$, null, $s$Četvrtkom, sa akšama$s$, $s$Seid Stupljanin$s$, null, $s$ucenje-sufare-za-zene-djecu-i-muskarce$s$, true, 70) on conflict (slug) do nothing;
insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values ($s$ostalo$s$, $s$Ostalo / nisam siguran — javite mi se$s$, null, $s$Ostalo$s$, $s$svi$s$, null, null, null, null, null, true, 80) on conflict (slug) do nothing;

-- kartice_stranica: pravila-ponasanja (14)
insert into public.kartice_stranica (stranica, naslov, tekst, ikona, link, aktivno, redoslijed)
select $s$pravila-ponasanja$s$, v.naslov, v.tekst, v.ikona, v.link, true, v.redoslijed from (values
  ($s$Ulazak sa poštovanjem$s$, $s$U džamiju ulazite smireno, desnom nogom, uz dovu za ulazak u džamiju. Izlazite lijevom nogom, uz dovu za izlazak.$s$, $s$door$s$, null, 0),
  ($s$Čistoća i abdest$s$, $s$Dođite sa abdestom, u čistoj i pristojnoj odjeći. Obuću ostavite na predviđenom mjestu, a prostor za abdest ostavite urednim.$s$, $s$droplet$s$, null, 10),
  ($s$Tišina$s$, $s$Izbjegavajte glasan razgovor i sve što ometa namaz, učenje Kur'ana i zikr drugih.$s$, $s$volume-off$s$, null, 20),
  ($s$Isključen telefon$s$, $s$Prije ulaska u saf utišajte ili isključite mobilni telefon.$s$, $s$phone-off$s$, null, 30),
  ($s$Tehijjetul-mesdžid$s$, $s$Kada uđete u džamiju, prije nego što sjednete, klanjajte dva rekata pozdrava džamiji — kao što je preporučio Poslanik ﷺ.$s$, $s$sparkles$s$, null, 40),
  ($s$Ne prolazite ispred klanjača$s$, $s$Sačekajte ili obiđite iza onoga ko klanja. Ne prelazite preko safova i ne gurajte se.$s$, $s$footprints$s$, null, 50),
  ($s$Popunjavanje safova$s$, $s$Popunjavajte prve safove i stanite uredno, rame uz rame, bez praznina.$s$, $s$users$s$, null, 60),
  ($s$Hutba$s$, $s$Za vrijeme hutbe pažljivo slušajte, bez razgovora i korištenja telefona — čak ni drugoga ne opominjite riječima.$s$, $s$mic$s$, null, 70),
  ($s$Džuma$s$, $s$Na džumu dođite ranije, okupani, mirisni i lijepo obučeni. Iskoristite vrijeme do hutbe za učenje Kur'ana i dovu.$s$, $s$calendar$s$, null, 80),
  ($s$Poštovanje džematlija$s$, $s$Selamite se, poštujte starije, budite strpljivi i blagi prema gostima i djeci.$s$, $s$heart$s$, null, 90),
  ($s$Djeca u džamiji$s$, $s$Djeca su dobrodošla. Učite ih tišini i redu ličnim primjerom, i budite uz njih tokom namaza.$s$, $s$baby$s$, null, 100),
  ($s$Čuvanje vakufa$s$, $s$Mushafe, serdžade i inventar koristite pažljivo i vratite na svoje mjesto. Džamija je vakuf — amanet svih nas.$s$, $s$book-quran$s$, null, 110),
  ($s$Bez otpadaka$s$, $s$Ne ostavljajte smeće u džamiji i njenom dvorištu. Otpatke odložite u kantu.$s$, $s$trash$s$, null, 120),
  ($s$Bez rasprava$s$, $s$Izbjegavajte prepirke i rasprave. Savjet dajte lijepom riječju i u pravo vrijeme.$s$, $s$message$s$, null, 130)
) as v (naslov, tekst, ikona, link, redoslijed)
where not exists (select 1 from public.kartice_stranica where stranica = $s$pravila-ponasanja$s$);

-- kartice_stranica: mekteb (6)
insert into public.kartice_stranica (stranica, naslov, tekst, ikona, link, aktivno, redoslijed)
select $s$mekteb$s$, v.naslov, v.tekst, v.ikona, v.link, true, v.redoslijed from (values
  ($s$Kur'an i sufara$s$, $s$Arapsko pismo, harekati i pravilno učenje — od sufare do mushafa.$s$, $s$book-quran$s$, null, 0),
  ($s$Ibadet$s$, $s$Abdest, namaz i osnovni propisi.$s$, $s$droplet$s$, null, 10),
  ($s$Akaid$s$, $s$Imanski i islamski šarti.$s$, $s$star8$s$, null, 20),
  ($s$Ahlak$s$, $s$Lijepo ponašanje prema roditeljima, prijateljima i komšijama.$s$, $s$heart$s$, null, 30),
  ($s$Sure i dove$s$, $s$Kratke sure i dove za svaki dan.$s$, $s$hands$s$, null, 40),
  ($s$Siret$s$, $s$Život Allahovog Poslanika ﷺ.$s$, $s$book$s$, null, 50)
) as v (naslov, tekst, ikona, link, redoslijed)
where not exists (select 1 from public.kartice_stranica where stranica = $s$mekteb$s$);

-- kartice_stranica: ucenje-kurana (4)
insert into public.kartice_stranica (stranica, naslov, tekst, ikona, link, aktivno, redoslijed)
select $s$ucenje-kurana$s$, v.naslov, v.tekst, v.ikona, v.link, true, v.redoslijed from (values
  ($s$Sufara$s$, $s$Arapsko pismo, harfovi i harekati.$s$, null, null, 0),
  ($s$Učenje iz mushafa$s$, $s$Polagano učenje uz učitelja koji ispravlja izgovor.$s$, null, null, 10),
  ($s$Tedžvid$s$, $s$Mahredži, medd, gunne i stajanja.$s$, null, null, 20),
  ($s$Hifz i ponavljanje$s$, $s$Kratke sure napamet i redovno ponavljanje.$s$, null, null, 30)
) as v (naslov, tekst, ikona, link, redoslijed)
where not exists (select 1 from public.kartice_stranica where stranica = $s$ucenje-kurana$s$);

-- kartice_stranica: ucenje-kurana-izvori (4)
insert into public.kartice_stranica (stranica, naslov, tekst, ikona, link, aktivno, redoslijed)
select $s$ucenje-kurana-izvori$s$, v.naslov, v.tekst, v.ikona, v.link, true, v.redoslijed from (values
  ($s$Quran.com$s$, $s$Tekst, audio i prevodi (i bosanski, Besim Korkut).$s$, null, $s$https://quran.com$s$, 0),
  ($s$Tanzil$s$, $s$Provjeren digitalni tekst sa harekatima.$s$, null, $s$https://tanzil.net$s$, 10),
  ($s$QuranicAudio$s$, $s$Snimci cijelog Kur'ana poznatih hafiza.$s$, null, $s$https://quranicaudio.com$s$, 20),
  ($s$EveryAyah$s$, $s$Ajet po ajet — za ponavljanje i hifz.$s$, null, $s$https://everyayah.com$s$, 30)
) as v (naslov, tekst, ikona, link, redoslijed)
where not exists (select 1 from public.kartice_stranica where stranica = $s$ucenje-kurana-izvori$s$);

-- stranice_tekstovi (13 novih ključeva)
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$pocetna-uvod$s$, null, null) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$footer-o-nama$s$, null, null) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$kontakt$s$, $s$Posjetite nas$s$, null) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$galerija$s$, $s$Galerija$s$, $s$Fotografije džamije, mekteba i aktivnosti džemata.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$mediji$s$, $s$Mediji$s$, $s$Predavanja, hutbe i snimci sa YouTube kanala džamije i zvanični profili na društvenim mrežama.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$dove$s$, $s$Dove$s$, $s$Dove iz Kur'ana i sunneta sa arapskim tekstom, transliteracijom, prevodom i izvorom.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$kuran-hadisi$s$, $s$Kur'an i hadisi$s$, $s$Ajet i hadis dana — svaki dan novi, sa arapskim tekstom, prevodom i jasno navedenim izvorom.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati$s$, $s$Islamski alati$s$, $s$Kibla, tesbih, zekat, imsakija i podsjetnik za namaz — sve radi u vašem pregledaču, bez prijave i bez slanja podataka.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati-kibla$s$, $s$Kibla — pravac Kabe$s$, $s$Iz Novog Pazara kibla je na {azimut} od sjevera, prema jugoistoku. Na telefonu možete uključiti živi kompas.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati-tesbih$s$, $s$Digitalni tesbih$s$, $s$Brojač zikra sa tesbihatom poslije namaza, vlastitim ciljem i vibracijom. Radi i bez interneta kada je stranica učitana.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati-zekat$s$, $s$Kalkulator zekata$s$, $s$Unesite imovinu i aktuelnu cijenu zlata ili srebra — kalkulator računa nisab i zekat od 2,5 %. Podaci ostaju samo u vašem pregledaču.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati-ramazan$s$, $s$Ramazan i imsakija$s$, $s$Vrijeme imsaka i iftara za svaki dan Ramazana, odbrojavanje i imsakija za štampu ili kalendar telefona.$s$) on conflict (kljuc) do nothing;
insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values ($s$alati-namaz-podsjetnik$s$, $s$Podsjetnik za namaz$s$, $s$Obavještenje pred namaz dok je sajt otvoren, ili vaktija za cijeli mjesec u kalendaru telefona — tada vas podsjeća i kad je sajt zatvoren.$s$) on conflict (kljuc) do nothing;

-- postavke: traka na vrhu sajta (isključena)
insert into public.postavke (kljuc, vrijednost) values ('traka', $s${"aktivno":false,"tekst":"","link":null,"vrsta":"info","do":null}$s$::jsonb) on conflict (kljuc) do nothing;

commit;
