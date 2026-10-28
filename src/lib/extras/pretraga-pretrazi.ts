// Logika pretrage u pregledaču: raspakivanje indeksa, bodovanje, označavanje pogodaka.
import type { PretragaIndeks } from './pretraga-indeks';
import { normalizuj, normalizujSaMapom, tokeni } from './normalizuj';

export type Grupa = 'stranice' | 'predavanja' | 'obavjestenja' | 'dove' | 'imami';

export const GRUPE: { kljuc: Grupa; naziv: string }[] = [
  { kljuc: 'stranice', naziv: 'Stranice' },
  { kljuc: 'predavanja', naziv: 'Predavanja i hutbe' },
  { kljuc: 'obavjestenja', naziv: 'Obavještenja' },
  { kljuc: 'dove', naziv: 'Dove' },
  { kljuc: 'imami', naziv: 'Imam' },
];

export interface Stavka {
  g: Grupa;
  naslov: string;
  /** Meta red (imam · kategorija · datum) — prikazuje se i pretražuje. */
  meta: string;
  /** Kratak tekst ispod (sažetak, prevod) — prikazuje se i pretražuje. */
  opis: string;
  /** Samo za pretragu (aliasi, sinonimi). */
  skriveno: string;
  url: string; // bez base-a
  datum: string; // YYYY-MM-DD ili ''
  // Normalizovano (popunjava se jednom):
  nNaslov: string[];
  nOstalo: string[];
}

const MJ = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
export const fmtDatum = (iso: string) => {
  const [g, m, d] = iso.split('-').map(Number);
  return g && m && d ? `${d}. ${MJ[m - 1]} ${g}.` : '';
};

const varijante = (s: string): string[] => {
  const a = normalizuj(s, 'dj');
  return /[đĐ]/.test(s) ? [a, normalizuj(s, 'd')] : [a];
};

export function raspakuj(ix: PretragaIndeks): Stavka[] {
  const out: Omit<Stavka, 'nNaslov' | 'nOstalo'>[] = [];
  for (const [href, naslov, opis, kljucne] of ix.s) {
    out.push({ g: 'stranice', naslov, meta: '', opis, skriveno: kljucne, url: href, datum: '' });
  }
  for (const [id, naslov, datum, im, ka, se, dio] of ix.p) {
    const meta = [
      im >= 0 ? ix.im[im] : '',
      ka >= 0 ? ix.ka[ka] : '',
      se >= 0 ? `${ix.se[se]}${dio ? `, ${dio}. dio` : ''}` : '',
    ].filter(Boolean);
    out.push({ g: 'predavanja', naslov, meta: meta.join(' · '), opis: '', skriveno: '', url: `/predavanja/${id}`, datum });
  }
  for (const [slug, naslov, datum, kat, sazetak, tip] of ix.o) {
    out.push({
      g: 'obavjestenja',
      naslov,
      meta: [tip === 'b' ? 'Objava' : 'Obavještenje', kat].filter(Boolean).join(' · '),
      opis: sazetak,
      skriveno: '',
      url: `${tip === 'b' ? ix.ob : '/obavjestenja/'}${slug}`,
      datum,
    });
  }
  for (const [slug, naslov, kat, izvor, prevod] of ix.d) {
    out.push({ g: 'dove', naslov, meta: [kat, izvor].filter(Boolean).join(' · '), opis: prevod, skriveno: '', url: `/dove#${slug}`, datum: '' });
  }
  for (const [, ime, aliasi, uloga, broj] of ix.m) {
    const meta = [uloga, broj ? `${broj} ${broj % 10 === 1 && broj % 100 !== 11 ? 'predavanje' : 'predavanja'}` : '']
      .filter(Boolean)
      .join(' · ');
    out.push({ g: 'imami', naslov: ime, meta, opis: '', skriveno: aliasi, url: '/imam', datum: '' }); // jedini profil: imam džamije
  }
  return out.map((s) => ({
    ...s,
    nNaslov: varijante(s.naslov),
    nOstalo: varijante([s.meta, s.opis, s.skriveno].join(' ')),
  }));
}

const pocetakRijeci = (hay: string, idx: number) => idx === 0 || !/[a-z0-9]/.test(hay[idx - 1]);

function bodujToken(hays: string[], tok: string, tezina: number): number {
  let best = 0;
  for (const h of hays) {
    let i = h.indexOf(tok);
    while (i !== -1) {
      const b = pocetakRijeci(h, i) ? 2 * tezina : tezina;
      if (b > best) best = b;
      if (best === 2 * tezina) return best;
      i = h.indexOf(tok, i + 1);
    }
  }
  return best;
}

export interface Rezultat { s: Stavka; bod: number }

export function pretrazi(stavke: Stavka[], upit: string): Rezultat[] {
  const toks = tokeni(upit);
  if (!toks.length) return [];
  const fraza = toks.join(' ');
  const out: Rezultat[] = [];
  for (const s of stavke) {
    let bod = 0;
    let sviNadjeni = true;
    for (const t of toks) {
      const bn = bodujToken(s.nNaslov, t, 5);
      const bo = bn ? 0 : bodujToken(s.nOstalo, t, 1.5);
      if (!bn && !bo) { sviNadjeni = false; break; }
      bod += bn + bo;
    }
    if (!sviNadjeni) continue;
    if (toks.length > 1 && s.nNaslov.some((n) => n.includes(fraza))) bod += 8;
    if (s.nNaslov.some((n) => n === fraza)) bod += 12;
    if (s.g === 'stranice' || s.g === 'imami') bod += 2;
    out.push({ s, bod });
  }
  return out.sort((a, b) => b.bod - a.bod || b.s.datum.localeCompare(a.s.datum));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Original sa <mark> oko pogodaka (HTML-escaped). */
export function oznaci(original: string, upit: string): string {
  if (!original) return '';
  const toks = tokeni(upit);
  const opsezi: [number, number][] = [];
  for (const dj of ['dj', 'd'] as const) {
    if (dj === 'd' && !/[đĐ]/.test(original)) continue;
    const { tekst, mapa } = normalizujSaMapom(original, dj);
    for (const t of toks) {
      let i = tekst.indexOf(t);
      while (i !== -1) {
        opsezi.push([mapa[i], mapa[i + t.length - 1] + 1]);
        i = tekst.indexOf(t, i + t.length);
      }
    }
  }
  if (!opsezi.length) return esc(original);
  opsezi.sort((a, b) => a[0] - b[0]);
  const spojeni: [number, number][] = [];
  for (const o of opsezi) {
    const z = spojeni[spojeni.length - 1];
    if (z && o[0] <= z[1]) z[1] = Math.max(z[1], o[1]);
    else spojeni.push([...o]);
  }
  let html = '';
  let pos = 0;
  for (const [a, b] of spojeni) {
    // Proširi do kraja znaka sa kombinovanim dijakritikom (ako ga original ima u NFD obliku).
    let kraj = b;
    while (kraj < original.length && /[̀-ͯ]/.test(original[kraj])) kraj++;
    html += esc(original.slice(pos, a)) + '<mark>' + esc(original.slice(a, kraj)) + '</mark>';
    pos = kraj;
  }
  return html + esc(original.slice(pos));
}
