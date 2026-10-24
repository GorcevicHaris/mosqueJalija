// Pretraga neosjetljiva na velika/mala slova i dijakritike: č/ć→c, š→s, ž→z, đ→dj (ili d).
// Bez zavisnosti — koristi se i u pregledaču.

function osnova(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’`ʼ]/g, '')
    .replace(/[^a-z0-9đ]+/g, ' ')
    .trim();
}

/** Normalizovan tekst; `dj` određuje kako se piše đ ("dj" ili "d"). */
export function normalizuj(s: string, dj: 'dj' | 'd' = 'dj'): string {
  return osnova(s).replace(/đ/g, dj);
}

/** Tekst za pretragu: sadrži obje varijante za đ, pa "dorde" i "djordje" nalaze "Đorđe". */
export function indeksTekst(...dijelovi: (string | null | undefined)[]): string {
  const t = dijelovi.filter(Boolean).join(' ');
  const a = normalizuj(t, 'dj');
  const b = normalizuj(t, 'd');
  return a === b ? a : `${a} | ${b}`;
}

/** Riječi upita; svaka mora postojati u indeksu (I). */
export function rijeciUpita(q: string): string[][] {
  return osnova(q)
    .split(' ')
    .filter(Boolean)
    .map((w) => [w.replace(/đ/g, 'dj'), w.replace(/đ/g, 'd')]);
}

export function odgovara(indeks: string, rijeci: string[][]): boolean {
  return rijeci.every((varijante) => varijante.some((v) => indeks.includes(v)));
}
