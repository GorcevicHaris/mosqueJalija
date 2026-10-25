// Ugrađene kartice statičnih stranica (rezerva kad baza nema aktivnih kartica za stranicu).
// Iz baze: tabela kartice_stranica (admin → Sadržaj → Kartice na stranicama), vidi karticeStranica() u data.ts.
// Ovaj fajl čita i scripts/supabase-seed-0005.mjs (početni sadržaj tabele) — bez importa vrijednosti,
// samo tipovi, da ga Node može učitati direktno.
import type { IconName } from '../components/ui/Icon.astro';

export type StranicaKartica = 'pravila-ponasanja' | 'mekteb' | 'ucenje-kurana' | 'ucenje-kurana-izvori';

export interface Kartica {
  naslov: string;
  tekst: string;
  ikona: IconName | null;
  link: string | null;
}

/** Stranice sa karticama: ključ, naziv za admin i šta kartica znači na toj stranici. */
export const STRANICE_KARTICA: { kljuc: StranicaKartica; naziv: string; opis: string; ikone: boolean; link: boolean }[] = [
  { kljuc: 'pravila-ponasanja', naziv: 'Pravila ponašanja — pravila', opis: 'Numerisane kartice sa ikonom na stranici Pravila ponašanja.', ikone: true, link: false },
  { kljuc: 'mekteb', naziv: 'Mekteb — „Šta djeca uče“', opis: 'Stavke sa ikonom u odjeljku „Šta djeca uče“.', ikone: true, link: false },
  { kljuc: 'ucenje-kurana', naziv: "Učenje Kur'ana — „Kako početi“", opis: 'Numerisani koraci (bez ikone).', ikone: false, link: false },
  { kljuc: 'ucenje-kurana-izvori', naziv: "Učenje Kur'ana — „Provjereni izvori“", opis: 'Linkovi na vanjske izvore (naslov = naziv, tekst = kratak opis, link obavezan).', ikone: false, link: true },
];

const k = (naslov: string, tekst: string, ikona: IconName | null = null, link: string | null = null): Kartica => ({ naslov, tekst, ikona, link });

export const UGRADJENE_KARTICE: Record<StranicaKartica, Kartica[]> = {
  'pravila-ponasanja': [
    k('Ulazak sa poštovanjem', 'U džamiju ulazite smireno, desnom nogom, uz dovu za ulazak u džamiju. Izlazite lijevom nogom, uz dovu za izlazak.', 'door'),
    k('Čistoća i abdest', 'Dođite sa abdestom, u čistoj i pristojnoj odjeći. Obuću ostavite na predviđenom mjestu, a prostor za abdest ostavite urednim.', 'droplet'),
    k('Tišina', "Izbjegavajte glasan razgovor i sve što ometa namaz, učenje Kur'ana i zikr drugih.", 'volume-off'),
    k('Isključen telefon', 'Prije ulaska u saf utišajte ili isključite mobilni telefon.', 'phone-off'),
    k('Tehijjetul-mesdžid', 'Kada uđete u džamiju, prije nego što sjednete, klanjajte dva rekata pozdrava džamiji — kao što je preporučio Poslanik ﷺ.', 'sparkles'),
    k('Ne prolazite ispred klanjača', 'Sačekajte ili obiđite iza onoga ko klanja. Ne prelazite preko safova i ne gurajte se.', 'footprints'),
    k('Popunjavanje safova', 'Popunjavajte prve safove i stanite uredno, rame uz rame, bez praznina.', 'users'),
    k('Hutba', 'Za vrijeme hutbe pažljivo slušajte, bez razgovora i korištenja telefona — čak ni drugoga ne opominjite riječima.', 'mic'),
    k('Džuma', "Na džumu dođite ranije, okupani, mirisni i lijepo obučeni. Iskoristite vrijeme do hutbe za učenje Kur'ana i dovu.", 'calendar'),
    k('Poštovanje džematlija', 'Selamite se, poštujte starije, budite strpljivi i blagi prema gostima i djeci.', 'heart'),
    k('Djeca u džamiji', 'Djeca su dobrodošla. Učite ih tišini i redu ličnim primjerom, i budite uz njih tokom namaza.', 'baby'),
    k('Čuvanje vakufa', 'Mushafe, serdžade i inventar koristite pažljivo i vratite na svoje mjesto. Džamija je vakuf — amanet svih nas.', 'book-quran'),
    k('Bez otpadaka', 'Ne ostavljajte smeće u džamiji i njenom dvorištu. Otpatke odložite u kantu.', 'trash'),
    k('Bez rasprava', 'Izbjegavajte prepirke i rasprave. Savjet dajte lijepom riječju i u pravo vrijeme.', 'message'),
  ],
  mekteb: [
    k("Kur'an i sufara", 'Arapsko pismo, harekati i pravilno učenje — od sufare do mushafa.', 'book-quran'),
    k('Ibadet', 'Abdest, namaz i osnovni propisi.', 'droplet'),
    k('Akaid', 'Imanski i islamski šarti.', 'star8'),
    k('Ahlak', 'Lijepo ponašanje prema roditeljima, prijateljima i komšijama.', 'heart'),
    k('Sure i dove', 'Kratke sure i dove za svaki dan.', 'hands'),
    k('Siret', 'Život Allahovog Poslanika ﷺ.', 'book'),
  ],
  'ucenje-kurana': [
    k('Sufara', 'Arapsko pismo, harfovi i harekati.'),
    k('Učenje iz mushafa', 'Polagano učenje uz učitelja koji ispravlja izgovor.'),
    k('Tedžvid', 'Mahredži, medd, gunne i stajanja.'),
    k('Hifz i ponavljanje', 'Kratke sure napamet i redovno ponavljanje.'),
  ],
  'ucenje-kurana-izvori': [
    k('Quran.com', 'Tekst, audio i prevodi (i bosanski, Besim Korkut).', null, 'https://quran.com'),
    k('Tanzil', 'Provjeren digitalni tekst sa harekatima.', null, 'https://tanzil.net'),
    k('QuranicAudio', "Snimci cijelog Kur'ana poznatih hafiza.", null, 'https://quranicaudio.com'),
    k('EveryAyah', 'Ajet po ajet — za ponavljanje i hifz.', null, 'https://everyayah.com'),
  ],
};
