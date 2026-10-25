// Programi za online upis (/upis). Ugrađena lista (PROGRAMI) je rezerva; urednik ih mijenja u adminu
// (Mekteb → Programi za upis, tabela "programi" iz migracije 0005). Sajt koristi bazu kad tabela ima
// bar jedan red — pri buildu (data.ts → `programi`) i u pregledaču (programi-klijent.ts), da se novi
// program vidi bez čekanja na build. Izvor ugrađene liste: data/obavjestenja.json (objave sa
// zvaničnog Instagram profila džamije, 11. i 20. 10. 2026). scripts/supabase-seed-0005.mjs je čita.
//
// U kolonu prijave.program se upisuje `naziv` (čitljivo uredniku u admin panelu, ≤ 120 znakova).
// Bez importa vrijednosti — fajl se koristi i u pregledaču i u Node skripti.

/** Ugrađene grupe (redoslijed prikaza); urednik može dodati i novu grupu. */
export type GrupaPrograma = 'Mekteb' | "Škola Kur'ana" | 'Halke' | 'Sufara' | 'Ostalo';
export type ZaKogaProgram = 'muškarci' | 'žene' | 'djeca' | 'svi';

export interface Program {
  /** stabilan identifikator (za ?program= u adresi i prop `program`) */
  id: string;
  /** upisuje se u prijave.program */
  naziv: string;
  /** kratak opis (nije obavezan) */
  opis?: string | null;
  grupa: GrupaPrograma | (string & {});
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

/** Grupe koje se pojavljuju u listi: prvo ugrađene (njihovim redom), pa nove iz baze, "Ostalo" na kraju. */
export function grupeZa(lista: Program[]): string[] {
  const sve: string[] = GRUPE.filter((g) => g !== 'Ostalo');
  for (const p of lista) if (!sve.includes(p.grupa) && p.grupa !== 'Ostalo') sve.push(p.grupa);
  sve.push('Ostalo');
  return sve.filter((g) => lista.some((p) => p.grupa === g));
}

export const getProgram = (id: string | null | undefined, lista: Program[] = PROGRAMI) => lista.find((p) => p.id === id) ?? null;

const ZA_KOGA_NAZIV: Record<ZaKogaProgram, string> = { muškarci: 'Muškarci', žene: 'Žene', djeca: 'Djeca', svi: 'Svi' };
const jeZaKoga = (v: unknown): v is ZaKogaProgram => typeof v === 'string' && v in ZA_KOGA_NAZIV;
const tekst = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Kolone tabele programi (za ?select=). */
export const PROGRAMI_SELECT = 'slug,naziv,opis,grupa,za_koga,za_koga_tekst,termin,predavac,napomena,obavjestenje,aktivno,redoslijed';

/**
 * Red tabele programi → Program (+ aktivno). null = neispravan red (preskače se).
 * zaDjecu se izvodi iz za_koga = 'djeca'; prikaz "za koga" je za_koga_tekst ili naziv grupe ljudi.
 */
export function programIzReda(r: Record<string, unknown>): (Program & { aktivno: boolean }) | null {
  const id = tekst(r.slug);
  const naziv = tekst(r.naziv);
  if (!id || !naziv) return null;
  const zk: ZaKogaProgram = jeZaKoga(r.za_koga) ? r.za_koga : 'svi';
  const p: Program & { aktivno: boolean } = {
    id,
    naziv,
    grupa: tekst(r.grupa) ?? 'Ostalo',
    zaKoga: tekst(r.za_koga_tekst) ?? ZA_KOGA_NAZIV[zk],
    termin: tekst(r.termin),
    predavac: tekst(r.predavac),
    izvor: tekst(r.obavjestenje),
    aktivno: r.aktivno !== false,
  };
  const opis = tekst(r.opis);
  if (opis) p.opis = opis;
  const napomena = tekst(r.napomena);
  if (napomena) p.napomena = napomena;
  if (zk === 'djeca') p.zaDjecu = true;
  return p;
}

/** Granica uzrasta ispod koje se traži ime roditelja/staratelja. */
export const UZRAST_DIJETE = 15;

/** Kratak "potpis" liste (za poređenje liste iz builda i iz baze u pregledaču). */
export const potpisPrograma = (lista: Program[]): string =>
  JSON.stringify(lista.map((p) => [p.id, p.naziv, p.opis ?? null, p.grupa, p.zaKoga, p.termin, p.predavac, p.napomena ?? null, !!p.zaDjecu, p.izvor]));
