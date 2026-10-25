/** Katalog alata (stranica /alati i blok "Ostali alati"). Putanje BEZ base-a — prolaze kroz url(). */

export interface Alat {
  kljuc: string;
  href: string;
  naziv: string;
  opis: string;
  /** Unutrašnjost SVG-a 24×24 (stroke, currentColor). */
  ikona: string;
  /** true = postojeća stranica sajta (nije u /alati), prikazuje se kao povezan alat. */
  povezano?: boolean;
}

export const IKONE = {
  kibla: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/><circle cx="12" cy="12" r="0.6"/>',
  tesbih:
    '<circle cx="12" cy="3.8" r="1.6"/><circle cx="16.9" cy="5.6" r="1.6"/><circle cx="19.2" cy="10.2" r="1.6"/><circle cx="7.1" cy="5.6" r="1.6"/><circle cx="4.8" cy="10.2" r="1.6"/><circle cx="6.4" cy="15" r="1.6"/><circle cx="17.6" cy="15" r="1.6"/><path d="M12 17v5M10 22h4M8 16.6 12 17l4-.4"/>',
  zekat:
    '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10.5h.01M12 10.5h.01M16 10.5h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18.5h.01M12 18.5h4"/>',
  ramazan:
    '<path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.8 6.8 0 0 0 10.7 10.7Z"/><path d="m17 3 .7 1.6 1.6.7-1.6.7L17 7.6l-.7-1.6-1.6-.7 1.6-.7z"/>',
  podsjetnik:
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M12 5.5V8l1.5 1"/>',
  vaktija: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  kalendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
  dove: '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10M10 9.5V4a1.5 1.5 0 0 1 3 0v6M13 9.5V5.5a1.5 1.5 0 0 1 3 0V13"/><path d="M16 9.5a1.5 1.5 0 0 1 3 0V15a7 7 0 0 1-7 7h-1a7 7 0 0 1-5-2.1l-2.6-2.7a1.6 1.6 0 0 1 2.3-2.3L7 17"/>',
} as const;

export const ALATI: Alat[] = [
  {
    kljuc: 'kibla',
    href: '/alati/kibla',
    naziv: 'Kibla — pravac Kabe',
    opis: 'Smjer kible u stepenima za vašu lokaciju i kompas koji se na telefonu okreće uživo.',
    ikona: IKONE.kibla,
  },
  {
    kljuc: 'tesbih',
    href: '/alati/tesbih',
    naziv: 'Digitalni tesbih',
    opis: 'Brojač zikra sa tesbihatom poslije namaza, vibracijom na 33 i pamćenjem stanja.',
    ikona: IKONE.tesbih,
  },
  {
    kljuc: 'zekat',
    href: '/alati/zekat',
    naziv: 'Kalkulator zekata',
    opis: 'Izračunajte zekat (2,5 %) na novac, zlato, srebro i robu, uz nisab po zlatu ili srebru.',
    ikona: IKONE.zekat,
  },
  {
    kljuc: 'ramazan',
    href: '/alati/ramazan',
    naziv: 'Ramazan i imsakija',
    opis: 'Datum Ramazana, imsakija za cijeli mjesec, odbrojavanje do iftara i preuzimanje u kalendar.',
    ikona: IKONE.ramazan,
  },
  {
    kljuc: 'podsjetnik',
    href: '/alati/namaz-podsjetnik',
    naziv: 'Podsjetnik za namaz',
    opis: 'Obavještenja pred namaz dok je sajt otvoren i vaktija za cijeli mjesec u kalendaru telefona.',
    ikona: IKONE.podsjetnik,
  },
];

export const POVEZANO: Alat[] = [
  { kljuc: 'vaktija', href: '/vaktija', naziv: 'Vaktija', opis: 'Današnja namaska vremena i mjesečna tabela.', ikona: IKONE.vaktija, povezano: true },
  { kljuc: 'kalendar', href: '/kalendar', naziv: 'Islamski kalendar', opis: 'Hidžretski datumi i važni dani u godini.', ikona: IKONE.kalendar, povezano: true },
  { kljuc: 'dove', href: '/dove', naziv: 'Dove', opis: 'Dove sa arapskim tekstom, transliteracijom i prevodom.', ikona: IKONE.dove, povezano: true },
  { kljuc: 'donacije', href: '/donacije', naziv: 'Donacije (IPS QR)', opis: 'Uplata za džamiju skeniranjem QR koda u aplikaciji banke.', ikona: IKONE.qr, povezano: true },
];
