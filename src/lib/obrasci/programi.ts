// Programi za online upis (/upis). Izvor: data/obavjestenja.json (objave sa zvaničnog Instagram
// profila džamije, 11. i 20. 10. 2026). Kasnije se ova lista može prebaciti u bazu (tabela "programi")
// — oblik je namjerno ravan da se lako mapira na kolone.
//
// U kolonu prijave.program se upisuje `naziv` (čitljivo uredniku u admin panelu, ≤ 120 znakova).

export type GrupaPrograma = 'Mekteb' | "Škola Kur'ana" | 'Halke' | 'Sufara' | 'Ostalo';

export interface Program {
  /** stabilan identifikator (za ?program= u adresi i prop `program`) */
  id: string;
  /** upisuje se u prijave.program */
  naziv: string;
  grupa: GrupaPrograma;
  /** kome je namijenjeno (kratko) */
  zaKoga: string;
  /** termin onako kako je objavljen; null = nije objavljen */
  termin: string | null;
  /** predavač onako kako je objavljen */
  predavac: string | null;
  /** napomena za posjetioca (npr. rok prijave je prošao) */
  napomena?: string;
  /** da li se očekuje dijete (uzrast < 15) — samo za podrazumijevani prikaz polja "roditelj" */
  zaDjecu?: boolean;
  /** slug obavještenja iz kojeg su podaci */
  izvor: string | null;
}

export const PROGRAMI: Program[] = [
  {
    id: 'mekteb',
    naziv: 'Mekteb (vjerska pouka za djecu)',
    grupa: 'Mekteb',
    zaKoga: 'Djeca',
    termin: null,
    predavac: null,
    zaDjecu: true,
    izvor: null,
  },
  {
    id: 'skola-kurana-hifz',
    naziv: "Škola Kur'ana — hifz (žene)",
    grupa: "Škola Kur'ana",
    zaKoga: 'Žene',
    termin: 'Ponedjeljak i četvrtak, sa jacije',
    predavac: 'Alma Uluč',
    izvor: 'upis-u-skolu-kurana-za-zene-i-djecu',
  },
  {
    id: 'skola-kurana-amme-hatma',
    naziv: "Škola Kur'ana — hifz Amme džuza / hatma (žene)",
    grupa: "Škola Kur'ana",
    zaKoga: 'Žene',
    termin: 'Srijeda i subota u 17:00',
    predavac: 'Alma Uluč',
    izvor: 'upis-u-skolu-kurana-za-zene-i-djecu',
  },
  {
    id: 'skola-kurana-tedzvid',
    naziv: "Škola Kur'ana — tedžvid (žene)",
    grupa: "Škola Kur'ana",
    zaKoga: 'Žene',
    termin: 'Srijeda i subota u 18:30',
    predavac: 'Alma Uluč',
    izvor: 'upis-u-skolu-kurana-za-zene-i-djecu',
  },
  {
    id: 'skola-kurana-djeca',
    naziv: "Škola Kur'ana — hifz Amme džuza i tilavet za djecu",
    grupa: "Škola Kur'ana",
    zaKoga: 'Djeca',
    termin: 'Subota u 12:00',
    predavac: 'Alma Uluč',
    zaDjecu: true,
    izvor: 'upis-u-skolu-kurana-za-zene-i-djecu',
  },
  {
    id: 'hifz-amme-muskarci',
    naziv: 'Halka hifza Amme džuza (telkin, uz tefsir) — muškarci',
    grupa: 'Halke',
    zaKoga: 'Muškarci',
    termin: 'Utorkom, između akšama i jacije',
    predavac: 'hafiz Admir Jašarević',
    izvor: 'hifz-amme-dzuza-za-muskarce',
  },
  {
    id: 'sufara-zene-djeca',
    naziv: 'Sufara (arapsko pismo) — žene i djeca',
    grupa: 'Sufara',
    zaKoga: 'Žene i djeca',
    termin: null,
    predavac: 'Dženana Hasanović',
    napomena: 'Prijave za grupu koja je počela u oktobru trajale su do 16. 10. 2026. — prijava se evidentira za sljedeću grupu.',
    izvor: 'ucenje-sufare-za-zene-djecu-i-muskarce',
  },
  {
    id: 'sufara-muskarci',
    naziv: 'Sufara (arapsko pismo) — muškarci',
    grupa: 'Sufara',
    zaKoga: 'Muškarci',
    termin: 'Četvrtkom, sa akšama',
    predavac: 'Seid Stupljanin',
    izvor: 'ucenje-sufare-za-zene-djecu-i-muskarce',
  },
  {
    id: 'ostalo',
    naziv: 'Ostalo / nisam siguran — javite mi se',
    grupa: 'Ostalo',
    zaKoga: 'Svi',
    termin: null,
    predavac: null,
    izvor: null,
  },
];

export const GRUPE: GrupaPrograma[] = ['Mekteb', "Škola Kur'ana", 'Halke', 'Sufara', 'Ostalo'];

export const getProgram = (id: string | null | undefined) => PROGRAMI.find((p) => p.id === id) ?? null;

/** Granica uzrasta ispod koje se traži ime roditelja/staratelja. */
export const UZRAST_DIJETE = 15;
