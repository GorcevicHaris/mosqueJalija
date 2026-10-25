/** Proračun zekata (2,5 % na neto imovinu iznad nisaba). Čista funkcija — koristi je i stranica i testovi. */

export const NISAB_ZLATO_G = 85;
export const NISAB_SREBRO_G = 595;
export const STOPA_ZEKATA = 0.025;
export const GRAMA_U_UNCI = 31.1034768;

export interface ZekatUlaz {
  gotovina: number;
  banka: number;
  zlatoGrama: number;
  /** udio čistog zlata (0–1), npr. 0.75 za 18 karata */
  zlatoCistoca: number;
  srebroGrama: number;
  roba: number;
  potrazivanja: number;
  ostalo: number;
  dugovi: number;
  cijenaZlata: number | null;
  cijenaSrebra: number | null;
  nisabPo: 'zlato' | 'srebro';
}

export interface ZekatRezultat {
  vrijednostZlata: number | null;
  vrijednostSrebra: number | null;
  bruto: number;
  neto: number;
  nisab: number | null;
  obaveza: boolean | null;
  zekat: number;
  upozorenja: string[];
}

const n = (x: number) => (Number.isFinite(x) && x > 0 ? x : 0);

export function izracunajZekat(u: ZekatUlaz): ZekatRezultat {
  const upozorenja: string[] = [];
  const cistoZlato = n(u.zlatoGrama) * Math.min(1, Math.max(0, u.zlatoCistoca || 1));
  const vrijednostZlata = cistoZlato > 0 ? (u.cijenaZlata ? cistoZlato * u.cijenaZlata : null) : 0;
  const vrijednostSrebra = n(u.srebroGrama) > 0 ? (u.cijenaSrebra ? n(u.srebroGrama) * u.cijenaSrebra : null) : 0;
  if (vrijednostZlata === null) upozorenja.push('Unesite cijenu zlata po gramu da bi zlato bilo uračunato.');
  if (vrijednostSrebra === null) upozorenja.push('Unesite cijenu srebra po gramu da bi srebro bilo uračunato.');

  const bruto =
    n(u.gotovina) + n(u.banka) + (vrijednostZlata ?? 0) + (vrijednostSrebra ?? 0) + n(u.roba) + n(u.potrazivanja) + n(u.ostalo);
  const neto = Math.max(0, bruto - n(u.dugovi));

  const cijena = u.nisabPo === 'zlato' ? u.cijenaZlata : u.cijenaSrebra;
  const nisab = cijena && cijena > 0 ? cijena * (u.nisabPo === 'zlato' ? NISAB_ZLATO_G : NISAB_SREBRO_G) : null;
  if (nisab === null) upozorenja.unshift(`Unesite cijenu ${u.nisabPo === 'zlato' ? 'zlata' : 'srebra'} po gramu da bi se izračunao nisab.`);

  const obaveza = nisab === null ? null : neto >= nisab && neto > 0;
  const zekat = obaveza ? neto * STOPA_ZEKATA : 0;
  return { vrijednostZlata, vrijednostSrebra, bruto, neto, nisab, obaveza, zekat, upozorenja };
}
