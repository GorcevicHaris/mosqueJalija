// Pretraga neosjetljiva na dijakritike: č/ć→c, š→s, ž→z, đ→dj (i varijanta đ→d), mala slova.
// Čuva mapu pozicija (normalizovani znak → indeks u originalu) radi označavanja pogodaka.

export type DjVarijanta = 'dj' | 'd';

const cache = new Map<string, string>();

function znak(c: string, dj: DjVarijanta): string {
  if (c === 'đ' || c === 'Đ') return dj;
  const key = c;
  let v = cache.get(key);
  if (v === undefined) {
    v = c
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase();
    // Apostrofi i crtice u nazivima (Ša'ban, Zul-hidždže) ne smiju kvariti pretragu.
    if (/['’`ʼ]/.test(v)) v = '';
    cache.set(key, v);
  }
  return v;
}

export function normalizuj(s: string, dj: DjVarijanta = 'dj'): string {
  let out = '';
  for (const c of s) out += znak(c, dj);
  return out;
}

export function normalizujSaMapom(s: string, dj: DjVarijanta = 'dj'): { tekst: string; mapa: number[] } {
  let tekst = '';
  const mapa: number[] = [];
  let i = 0;
  for (const c of s) {
    const n = znak(c, dj);
    for (let k = 0; k < n.length; k++) mapa.push(i);
    tekst += n;
    i += c.length;
  }
  mapa.push(s.length);
  return { tekst, mapa };
}

/** Upit → jedinstveni tokeni (min. 1 znak), normalizovani. */
export function tokeni(upit: string, dj: DjVarijanta = 'dj'): string[] {
  return [...new Set(normalizuj(upit, dj).split(/[^a-z0-9]+/).filter(Boolean))];
}
