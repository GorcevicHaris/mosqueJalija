/** Zikrovi i preseti za digitalni tesbih. Arapski tekst sa harekatima (provjereni, uobičajeni oblici). */

export interface Zikr {
  arapski: string;
  /** transliteracija kako se uobičajeno piše kod nas */
  naziv: string;
  znacenje: string;
}

export const ZIKROVI = {
  subhanallah: { arapski: 'سُبْحَانَ ٱللَّٰهِ', naziv: 'Subhanallah', znacenje: 'Slavljen neka je Allah (čist je od svake mahane).' },
  elhamdulillah: { arapski: 'ٱلْحَمْدُ لِلَّٰهِ', naziv: 'Elhamdulillah', znacenje: 'Hvala neka je Allahu.' },
  allahuekber: { arapski: 'ٱللَّٰهُ أَكْبَرُ', naziv: 'Allahu ekber', znacenje: 'Allah je najveći.' },
  lailahe: { arapski: 'لَا إِلَٰهَ إِلَّا ٱللَّٰهُ', naziv: 'La ilahe illallah', znacenje: 'Nema boga osim Allaha.' },
  estagfirullah: { arapski: 'أَسْتَغْفِرُ ٱللَّٰهَ', naziv: 'Estagfirullah', znacenje: 'Tražim oprost od Allaha.' },
  salavat: { arapski: 'ٱللَّٰهُمَّ صَلِّ عَلَىٰ مُحَمَّدٍ', naziv: 'Allahumme salli ala Muhammed', znacenje: 'Allahu moj, blagoslovi Muhammeda (salavat na Poslanika, s.a.v.s.).' },
} satisfies Record<string, Zikr>;

export type ZikrKljuc = keyof typeof ZIKROVI;

export interface Korak {
  zikr: ZikrKljuc | null;
  cilj: number;
}

export interface Preset {
  kljuc: string;
  naziv: string;
  opis: string;
  koraci: Korak[];
}

export const PRESETI: Preset[] = [
  {
    kljuc: 'poslije-namaza',
    naziv: 'Tesbihat poslije namaza',
    opis: '33 × Subhanallah, 33 × Elhamdulillah i 34 × Allahu ekber — brojač sam prelazi na sljedeći zikr.',
    koraci: [
      { zikr: 'subhanallah', cilj: 33 },
      { zikr: 'elhamdulillah', cilj: 33 },
      { zikr: 'allahuekber', cilj: 34 },
    ],
  },
  { kljuc: 'subhanallah', naziv: 'Subhanallah', opis: '33 puta', koraci: [{ zikr: 'subhanallah', cilj: 33 }] },
  { kljuc: 'elhamdulillah', naziv: 'Elhamdulillah', opis: '33 puta', koraci: [{ zikr: 'elhamdulillah', cilj: 33 }] },
  { kljuc: 'allahuekber', naziv: 'Allahu ekber', opis: '34 puta (ili 33 — promijenite cilj)', koraci: [{ zikr: 'allahuekber', cilj: 34 }] },
  { kljuc: 'lailahe', naziv: 'La ilahe illallah', opis: '100 puta', koraci: [{ zikr: 'lailahe', cilj: 100 }] },
  { kljuc: 'estagfirullah', naziv: 'Istigfar', opis: '100 puta', koraci: [{ zikr: 'estagfirullah', cilj: 100 }] },
  { kljuc: 'salavat', naziv: 'Salavat', opis: '100 puta', koraci: [{ zikr: 'salavat', cilj: 100 }] },
  { kljuc: 'slobodno', naziv: 'Slobodno brojanje', opis: 'Bez zadatog zikra; cilj po želji', koraci: [{ zikr: null, cilj: 33 }] },
];
