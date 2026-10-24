// Serverske (build) pomoćne funkcije za predavanja. NE uvoziti u klijentske skripte (vuče sve podatke).
import { getImam, getKategorija, getSerija, imami, kategorije, predavanja, serije } from './data';
import type { Predavanje } from './types';
import type { KarticaPodaci } from '../components/predavanja/kartica.ts';
import { escapeHtml } from './format.ts';

export const HUTBA_KATEGORIJA = 'hutba';

export function karticaPodaci(p: Predavanje): KarticaPodaci {
  return {
    id: p.id,
    naslov: p.naslovCist || p.naslov,
    datum: p.datum,
    trajanje: p.trajanje ?? 0,
    thumbnail: p.thumbnail,
    imamIme: getImam(p.imam)?.punoIme ?? null,
    kategorijaNaziv: getKategorija(p.kategorija)?.naziv ?? null,
    dio: p.serija ? p.serijaDio : null,
  };
}

/** Kompaktan zapis za klijentsku skriptu (samo potrebna polja). */
export interface KlijentPredavanje {
  id: string;
  n: string; // naslovCist
  o: string; // originalni naslov (za pretragu)
  d: string; // datum
  t: number; // trajanje
  th: string; // thumbnail
  i: string | null; // imam slug
  k: string; // kategorija slug
  s: string | null; // serija slug
  sd: number | null; // dio serije
  p: number | null; // pregledi
}

export interface KlijentPodaci {
  stavke: KlijentPredavanje[];
  imami: Record<string, string>;
  kategorije: Record<string, string>;
  serije: Record<string, string>;
}

export function klijentPodaci(lista: Predavanje[]): KlijentPodaci {
  const map = (arr: { slug: string; naziv?: string; punoIme?: string }[]) =>
    Object.fromEntries(arr.map((x) => [x.slug, (x.punoIme ?? x.naziv ?? x.slug) as string]));
  return {
    stavke: lista.map((p) => ({
      id: p.id,
      n: p.naslovCist || p.naslov,
      o: p.naslov,
      d: p.datum,
      t: p.trajanje ?? 0,
      th: p.thumbnail,
      i: p.imam ?? null,
      k: p.kategorija,
      s: p.serija ?? null,
      sd: p.serijaDio ?? null,
      p: p.pregledi ?? null,
    })),
    imami: map(imami),
    kategorije: map(kategorije),
    serije: map(serije),
  };
}

/** JSON siguran za umetanje u <script type="application/json">. */
export function jsonZaSkriptu(v: unknown): string {
  return JSON.stringify(v).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}

/** Dijelovi serije, redom (serijaDio, pa datum). */
export function dijeloviSerije(serija: string | null): Predavanje[] {
  if (!serija) return [];
  return predavanja
    .filter((p) => p.serija === serija)
    .slice()
    .sort((a, b) => {
      const da = a.serijaDio ?? Number.MAX_SAFE_INTEGER;
      const db = b.serijaDio ?? Number.MAX_SAFE_INTEGER;
      return da - db || a.datum.localeCompare(b.datum) || a.id.localeCompare(b.id);
    });
}

/** Srodna predavanja: ista serija → isti imam → ista kategorija (najnovija prva), bez duplikata. */
export function srodnaPredavanja(p: Predavanje, broj = 6): Predavanje[] {
  const out: Predavanje[] = [];
  const vidjeno = new Set([p.id]);
  const dodaj = (lista: Predavanje[]) => {
    for (const x of lista) {
      if (out.length >= broj) return;
      if (vidjeno.has(x.id)) continue;
      vidjeno.add(x.id);
      out.push(x);
    }
  };
  if (p.serija) {
    // najbliži dijelovi serije prvo
    const dijelovi = dijeloviSerije(p.serija);
    const idx = dijelovi.findIndex((x) => x.id === p.id);
    const poBlizini = dijelovi
      .map((x, i) => ({ x, d: Math.abs(i - idx) }))
      .sort((a, b) => a.d - b.d)
      .map((o) => o.x);
    dodaj(poBlizini);
  }
  if (p.imam) dodaj(predavanja.filter((x) => x.imam === p.imam && x.kategorija === p.kategorija));
  if (p.imam) dodaj(predavanja.filter((x) => x.imam === p.imam));
  dodaj(predavanja.filter((x) => x.kategorija === p.kategorija));
  return out;
}

/** Opis: escape + linkovi + prelomi reda. Vraća HTML. */
export function opisHTML(opis: string): string {
  const e = escapeHtml(opis.trim());
  const saLinkovima = e.replace(
    /\b(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g,
    (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`,
  );
  return saLinkovima
    .split(/\n{2,}/)
    .map((par) => `<p>${par.replace(/\n/g, '<br />')}</p>`)
    .join('');
}

/** Link na filtrirana predavanja: filterUrl({imam:'x'}) -> "?imam=x" */
export function filterQuery(params: Record<string, string | null | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Monogram iz imena ("Hfz. Admir ef. Jašarević" -> "AJ"), bez titula. */
export function monogram(punoIme: string): string {
  const titule = /^(hfz|hafiz|ef|efendija|muftija|m|prof|dr|mr|kurra|hadži|hadzi)\.?$/i;
  const rijeci = punoIme
    .replace(/\./g, '. ')
    .split(/\s+/)
    .filter((w) => w && !titule.test(w) && /^\p{L}/u.test(w));
  const prva = rijeci[0]?.[0] ?? '';
  const zadnja = rijeci.length > 1 ? rijeci[rijeci.length - 1][0] : '';
  return (prva + zadnja).toUpperCase() || '؟';
}

export { getImam, getKategorija, getSerija };
