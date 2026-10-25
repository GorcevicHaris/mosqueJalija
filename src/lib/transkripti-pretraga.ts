// Pretraga po transkriptima — za pregledač (bez import.meta.glob, bez velikih podataka u bundle-u).
// Podaci se lijeno učitavaju sa /pretraga-transkripti.json (src/pages/pretraga-transkripti.json.ts)
// tek kad korisnik nešto traži.
import type { TPretragaPodaci } from './transkripti';
import { normalizuj, tokeni } from './extras/normalizuj';

export interface TPogodak {
  /** id videa */
  id: string;
  /** sekunda početka prvog odlomka koji sadrži sve riječi upita */
  od: number;
  /** isječak originalnog teksta oko pogotka (za prikaz; označiti sa oznaci() iz pretraga-pretrazi) */
  isjecak: string;
  /** broj odlomaka sa pogotkom */
  broj: number;
  bod: number;
}

interface Pripremljeno {
  id: string;
  seg: { od: number; tekst: string; n: string }[];
}

let obecanje: Promise<Pripremljeno[]> | null = null;

/** Učitaj (jednom) i pripremi podatke. `base` = import.meta.env.BASE_URL. */
export function ucitajTranskripte(base: string): Promise<Pripremljeno[]> {
  if (!obecanje) {
    const url = `${base.replace(/\/$/, '')}/pretraga-transkripti.json`;
    obecanje = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<TPretragaPodaci>) : { v: 1 as const, t: [] }))
      .then((d) =>
        d.t.map(([id, seg]) => ({
          id,
          seg: seg.map(([od, tekst]) => {
            const a = normalizuj(tekst, 'dj');
            return { od, tekst, n: /[đĐ]/.test(tekst) ? `${a} ${normalizuj(tekst, 'd')}` : a };
          }),
        })),
      )
      .catch(() => {
        obecanje = null;
        return [];
      });
  }
  return obecanje;
}

function isjeci(tekst: string, tok: string, max = 180): string {
  const n = normalizuj(tekst, 'dj');
  const i = Math.max(0, n.indexOf(tok));
  // normalizovani i originalni tekst su približno iste dužine (dijakritici → 1 znak, đ → 2)
  const start = Math.max(0, i - Math.floor(max / 3));
  let s = tekst.slice(start, start + max);
  if (start > 0) s = '…' + s.replace(/^\S*\s/, '');
  if (start + max < tekst.length) s = s.replace(/\s\S*$/, '') + '…';
  return s;
}

/**
 * Traži videe čiji transkript sadrži SVE riječi upita (u istom odlomku ili u odlomku ± susjedni).
 * Rezultati sortirani po broju pogodaka.
 */
export function pretraziTranskripte(podaci: Pripremljeno[], upit: string, limit = 30): TPogodak[] {
  const toks = tokeni(upit).filter((t) => t.length >= 3 || /\d/.test(t));
  if (!toks.length) return [];
  const fraza = toks.join(' ');
  const out: TPogodak[] = [];
  for (const v of podaci) {
    let prvi = -1;
    let broj = 0;
    let bod = 0;
    for (let i = 0; i < v.seg.length; i++) {
      const sam = toks.every((t) => v.seg[i].n.includes(t));
      // riječi upita mogu biti razdvojene granicom odlomka → gledaj i sljedeći (ali ga ne broji dvaput)
      const prozor = sam || (toks.some((t) => v.seg[i].n.includes(t)) && toks.every((t) => (v.seg[i].n + ' ' + (v.seg[i + 1]?.n ?? '')).includes(t)));
      if (!prozor) continue;
      broj++;
      bod += v.seg[i].n.includes(fraza) ? 3 : sam ? 2 : 1;
      if (prvi === -1) prvi = i;
    }
    if (prvi === -1) continue;
    const s = v.seg[prvi];
    out.push({ id: v.id, od: s.od, isjecak: isjeci(s.tekst, toks.find((t) => s.n.includes(t)) ?? toks[0]), broj, bod });
  }
  return out.sort((a, b) => b.bod - a.bod).slice(0, limit);
}
