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
      { id: 'stranice', naziv: 'Tekstovi stranica' },
      { id: 'kartice', naziv: 'Kartice na stranicama' },
      { id: 'galerija', naziv: 'Galerija' },
      { id: 'dove', naziv: 'Dove' },
      { id: 'ajeti-hadisi', naziv: 'Ajeti i hadisi' },
    ],
  },
  {
    naziv: 'Predavanja',
    stavke: [
      { id: 'predavanja', naziv: 'Predavanja (sakrij / uredi)' },
      { id: 'predavanja-rucna', naziv: 'Dodani videi' },
      { id: 'ispravke', naziv: 'Ispravke predavanja' },
      { id: 'transkripti', naziv: 'Transkripti' },
      { id: 'imami', naziv: 'Imami i predavači' },
      { id: 'kategorije', naziv: 'Kategorije' },
      { id: 'serije', naziv: 'Serije' },
    ],
  },
  {
    naziv: 'Džamija',
    stavke: [
      { id: 'dzamija', naziv: 'Podaci o džamiji' },
      { id: 'traka', naziv: 'Traka na vrhu sajta' },
    ],
  },
  {
    naziv: 'Mekteb',
    stavke: [
      { id: 'raspored', naziv: 'Sedmični raspored' },
      { id: 'programi', naziv: 'Programi za upis' },
    ],
  },
  {
    naziv: 'Inbox',
    stavke: [
      { id: 'poruke', naziv: 'Poruke', brojac: 'poruke' },
      { id: 'prijave', naziv: 'Prijave', brojac: 'prijave' },
      { id: 'pitanja', naziv: 'Pitanja', brojac: 'pitanja' },
    ],
  },
  {
    naziv: 'Podešavanja',
    samoAdmin: true,
    stavke: [{ id: 'urednici', naziv: 'Urednici' }],
  },
];

export const SVI_ODJELJCI = ODJELJCI.flatMap((g) => g.stavke.map((s) => ({ ...s, samoAdmin: !!g.samoAdmin })));
