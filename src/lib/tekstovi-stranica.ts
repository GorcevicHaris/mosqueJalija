// Tekstovi stranica koje urednik može zamijeniti u adminu (tabela stranice_tekstovi, ključ = kljuc).
// Ovdje su UGRAĐENE vrijednosti (prikazuju se kad je polje u bazi prazno ili build radi bez baze).
// Isti spisak koriste admin (padajući meni + nazivi) i scripts/supabase-seed-0005.mjs (početni sadržaj).
// Bez importa vrijednosti — Node ga učitava direktno.

export type VrstaTeksta =
  | 'uvod' // paragrafi ispod zaglavlja stranice (UvodStranice.astro); naslov = H1 i <title>
  | 'podnaslov' // jedna rečenica u zaglavlju stranice (PageHero subtitle); naslov = H1
  | 'tekst'; // samostalan tekst (početna, podnožje) — bez naslova

export interface UgradjenTekst {
  kljuc: string;
  /** naziv za admin */
  naziv: string;
  /** adresa stranice (bez base-a) */
  putanja: string;
  vrsta: VrstaTeksta;
  /** ugrađeni naslov (H1); null = stranica nema naslov koji se mijenja */
  naslov: string | null;
  /** ugrađeni tekst; null = stranica ima vlastitu logiku (npr. kratak opis džamije, adresa) */
  sadrzaj: string | null;
  /** dodatno objašnjenje za urednika */
  pomoc?: string;
}

export const TEKSTOVI_STRANICA: UgradjenTekst[] = [
  // ---- iz 0001 (uvodni paragrafi + naslov stranice) ----
  { kljuc: 'mekteb', naziv: 'Mekteb i halke — tekst o mektebu', putanja: '/mekteb', vrsta: 'uvod', naslov: 'Mekteb i halke', sadrzaj: null, pomoc: 'Tekst zamjenjuje ugrađeni opis mekteba (odjeljak „Mekteb za djecu“).' },
  { kljuc: 'donacije', naziv: 'Donacije — uvodni tekst', putanja: '/donacije', vrsta: 'uvod', naslov: 'Donacije', sadrzaj: null },
  { kljuc: 'pravila-ponasanja', naziv: 'Pravila ponašanja — uvodni tekst', putanja: '/pravila-ponasanja', vrsta: 'uvod', naslov: 'Pravila ponašanja u džamiji', sadrzaj: null },
  { kljuc: 'ucenje-kurana', naziv: "Učenje Kur'ana — uvodni tekst", putanja: '/ucenje-kurana', vrsta: 'uvod', naslov: "Učenje Kur'ana", sadrzaj: null },
  // ---- 0005: samostalni tekstovi ----
  { kljuc: 'pocetna-uvod', naziv: 'Početna — tekst ispod naslova', putanja: '/', vrsta: 'tekst', naslov: null, sadrzaj: null, pomoc: 'Prazno = „Kratak opis“ iz odjeljka Podaci o džamiji.' },
  { kljuc: 'footer-o-nama', naziv: 'Podnožje sajta — tekst o džamiji', putanja: '/', vrsta: 'tekst', naslov: null, sadrzaj: null, pomoc: 'Prazno = „Kratak opis“ iz odjeljka Podaci o džamiji.' },
  // ---- 0005: zaglavlja stranica (naslov + podnaslov) ----
  { kljuc: 'kontakt', naziv: 'Kontakt — zaglavlje', putanja: '/kontakt', vrsta: 'podnaslov', naslov: 'Posjetite nas', sadrzaj: null, pomoc: 'Prazan podnaslov = adresa džamije.' },
  { kljuc: 'lokacija', naziv: 'Lokacija — zaglavlje', putanja: '/lokacija', vrsta: 'podnaslov', naslov: 'Lokacija džamije', sadrzaj: null, pomoc: 'Prazan podnaslov = adresa džamije.' },
  { kljuc: 'lokacija-kako-doci', naziv: 'Lokacija — kako doći', putanja: '/lokacija', vrsta: 'tekst', naslov: null, sadrzaj: null, pomoc: 'Kratko uputstvo kako doći do džamije (orijentiri, parking, ulaz). Prazno = odjeljak „Kako doći“ se ne prikazuje.' },
  { kljuc: 'galerija', naziv: 'Galerija — zaglavlje', putanja: '/galerija', vrsta: 'podnaslov', naslov: 'Galerija', sadrzaj: 'Fotografije džamije, mekteba i aktivnosti džemata.' },
  { kljuc: 'mediji', naziv: 'Mediji — zaglavlje', putanja: '/mediji', vrsta: 'podnaslov', naslov: 'Mediji', sadrzaj: 'Predavanja, hutbe i snimci sa YouTube kanala džamije i zvanični profili na društvenim mrežama.' },
  { kljuc: 'dove', naziv: 'Dove — zaglavlje', putanja: '/dove', vrsta: 'podnaslov', naslov: 'Dove', sadrzaj: "Dove iz Kur'ana i sunneta sa arapskim tekstom, transliteracijom, prevodom i izvorom." },
  { kljuc: 'kuran-hadisi', naziv: "Kur'an i hadisi — zaglavlje", putanja: '/kuran-hadisi', vrsta: 'podnaslov', naslov: "Kur'an i hadisi", sadrzaj: 'Ajet i hadis dana — svaki dan novi, sa arapskim tekstom, prevodom i jasno navedenim izvorom.' },
  { kljuc: 'alati', naziv: 'Alati — zaglavlje', putanja: '/alati', vrsta: 'podnaslov', naslov: 'Islamski alati', sadrzaj: 'Kibla, tesbih, zekat, imsakija i podsjetnik za namaz — sve radi u vašem pregledaču, bez prijave i bez slanja podataka.' },
  { kljuc: 'alati-kibla', naziv: 'Alati: Kibla — zaglavlje', putanja: '/alati/kibla', vrsta: 'podnaslov', naslov: 'Kibla — pravac Kabe', sadrzaj: 'Iz Novog Pazara kibla je na {azimut} od sjevera, prema jugoistoku. Na telefonu možete uključiti živi kompas.', pomoc: '{azimut} se zamjenjuje izračunatim uglom (npr. 136°).' },
  { kljuc: 'alati-tesbih', naziv: 'Alati: Tesbih — zaglavlje', putanja: '/alati/tesbih', vrsta: 'podnaslov', naslov: 'Digitalni tesbih', sadrzaj: 'Brojač zikra sa tesbihatom poslije namaza, vlastitim ciljem i vibracijom. Radi i bez interneta kada je stranica učitana.' },
  { kljuc: 'alati-zekat', naziv: 'Alati: Zekat — zaglavlje', putanja: '/alati/zekat', vrsta: 'podnaslov', naslov: 'Kalkulator zekata', sadrzaj: 'Unesite imovinu i aktuelnu cijenu zlata ili srebra — kalkulator računa nisab i zekat od 2,5 %. Podaci ostaju samo u vašem pregledaču.' },
  { kljuc: 'alati-ramazan', naziv: 'Alati: Ramazan — zaglavlje', putanja: '/alati/ramazan', vrsta: 'podnaslov', naslov: 'Ramazan i imsakija', sadrzaj: 'Vrijeme imsaka i iftara za svaki dan Ramazana, odbrojavanje i imsakija za štampu ili kalendar telefona.' },
  { kljuc: 'alati-namaz-podsjetnik', naziv: 'Alati: Podsjetnik za namaz — zaglavlje', putanja: '/alati/namaz-podsjetnik', vrsta: 'podnaslov', naslov: 'Podsjetnik za namaz', sadrzaj: 'Obavještenje pred namaz dok je sajt otvoren, ili vaktija za cijeli mjesec u kalendaru telefona — tada vas podsjeća i kad je sajt zatvoren.' },
];

export const ugradjenTekst = (kljuc: string): UgradjenTekst | null => TEKSTOVI_STRANICA.find((t) => t.kljuc === kljuc) ?? null;
