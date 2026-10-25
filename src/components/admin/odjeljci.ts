// Odjeljci admin panela (navigacija). Koristi ih i markup (AdminApp.astro) i skripta (main.ts).
export interface Odjeljak {
  id: string;
  naziv: string;
  brojac?: 'poruke' | 'prijave' | 'pitanja';
}
export interface GrupaOdjeljaka {
  naziv: string;
  samoAdmin?: boolean;
  stavke: Odjeljak[];
}

export const ODJELJCI: GrupaOdjeljaka[] = [
  {
    naziv: 'Sadržaj',
    stavke: [
      { id: 'obavjestenja', naziv: 'Obavještenja i objave' },
      { id: 'raspored', naziv: 'Sedmični raspored' },
      { id: 'galerija', naziv: 'Galerija' },
      { id: 'dzamija', naziv: 'Podaci o džamiji' },
      { id: 'stranice', naziv: 'Tekstovi stranica' },
      { id: 'dove', naziv: 'Dove' },
      { id: 'ajeti-hadisi', naziv: 'Ajeti i hadisi' },
    ],
  },
  {
    naziv: 'Predavanja',
    stavke: [
      { id: 'imami', naziv: 'Imami i predavači' },
      { id: 'kategorije', naziv: 'Kategorije' },
      { id: 'serije', naziv: 'Serije' },
      { id: 'ispravke', naziv: 'Ispravke predavanja' },
    ],
  },
  {
    naziv: 'Pristiglo sa sajta',
    stavke: [
      { id: 'poruke', naziv: 'Poruke', brojac: 'poruke' },
      { id: 'prijave', naziv: 'Prijave', brojac: 'prijave' },
      { id: 'pitanja', naziv: 'Pitanja', brojac: 'pitanja' },
    ],
  },
  {
    naziv: 'Administracija',
    samoAdmin: true,
    stavke: [{ id: 'urednici', naziv: 'Urednici' }],
  },
];

export const SVI_ODJELJCI = ODJELJCI.flatMap((g) => g.stavke.map((s) => ({ ...s, samoAdmin: !!g.samoAdmin })));
