// Automatski transkripti predavanja (data/transkripti/<id>.json, pravi ih
// scripts/transkripcija/transkribuj.mjs). Ako postoji lektorisana verzija
// (data/transkripti-lektura/<id>.json), koristi se ona. Samo za build — NE uvoziti iz klijentskih skripti
// (import.meta.glob bi ugradio sve transkripte u JS). Za pregledač: ./transkripti-pretraga.ts.
// Ispravke pojedinih segmenata iz admina (tabela transkript_ispravke, preko data.ts) zamjenjuju tekst
// tog segmenta pri buildu: bs = prikazana (lektorisana ili automatska) verzija, en = prevod.
// Originali (bez ispravki) ostaju dostupni preko getTranskriptOriginal / getTranskriptEnOriginal
// (endpoint /transkripti/<id>.json za admin).
import { transkriptIspravke } from './data';

export interface TranskriptSegment {
  /** početak u sekundama */
  od: number;
  /** kraj u sekundama */
  do: number;
  tekst: string;
}

export interface Transkript {
  id: string;
  jezik: string;
  model: string;
  /** ISO datum generisanja */
  generisano: string;
  /** true = mašinski; false = ručno pregledan/ispravljen (skripta ga više ne prepisuje) */
  automatski: boolean;
  /** opciono: ko je pregledao/ispravio */
  ispravio?: string;
  /** true = konzervativno lektorisana verzija iz data/transkripti-lektura/ */
  lektorisano?: boolean;
  /** samo engleski prevod (data/transkripti-en/): naslov predavanja na engleskom */
  naslov?: string;
  segmenti: TranskriptSegment[];
}

const automatski = import.meta.glob<Transkript>('/data/transkripti/*.json', { eager: true, import: 'default' });
const lektura = import.meta.glob<Transkript>('/data/transkripti-lektura/*.json', { eager: true, import: 'default' });
// Engleski (mašinski) prevod lektorisanog transkripta — isti segmenti/vremena, + "jezik": "en" i "naslov".
// Ne postoji za svaki video (ili uopšte) — tada je glob prazan i getTranskriptEn vraća null.
// Čita se kao tekst i parsira u try/catch: neispravan (npr. napola upisan) fajl se preskače, build ne pada.
const engleskiRaw = import.meta.glob<string>('/data/transkripti-en/*.json', { eager: true, query: '?raw', import: 'default' });
const engleski: Record<string, Transkript | undefined> = {};
for (const [put, raw] of Object.entries(engleskiRaw)) {
  try {
    engleski[put] = JSON.parse(raw) as Transkript;
  } catch {
    console.warn(`[transkripti] preskačem neispravan engleski transkript: ${put}`);
  }
}

const ispravan = (t: Transkript | undefined): t is Transkript => !!t && Array.isArray(t.segmenti) && t.segmenti.length > 0;
const idIz = (put: string) => put.split('/').pop()!.replace(/\.json$/, '');

const mapa = new Map<string, Transkript>();
for (const [put, t] of Object.entries(automatski)) {
  if (ispravan(t)) mapa.set(idIz(put), { ...t, id: idIz(put), lektorisano: false });
}
// lektorisana verzija ima prednost
for (const [put, t] of Object.entries(lektura)) {
  if (ispravan(t)) mapa.set(idIz(put), { ...t, id: idIz(put), lektorisano: true });
}

const mapaEn = new Map<string, Transkript>();
for (const [put, t] of Object.entries(engleski)) {
  const id = idIz(put);
  if (!ispravan(t) || !mapa.has(id)) continue;
  const segmenti = t.segmenti.filter((s) => s && typeof s.tekst === 'string' && Number.isFinite(Number(s.od)));
  if (!segmenti.length) continue;
  mapaEn.set(id, {
    ...t,
    id,
    jezik: 'en',
    naslov: typeof t.naslov === 'string' && t.naslov.trim() ? t.naslov.trim() : undefined,
    segmenti,
  });
}

/** Primijeni ispravke iz baze (indeks segmenta → tekst); nepostojeći indeksi se preskaču. */
function saIspravkama(t: Transkript, isp: Record<number, string> | undefined): Transkript {
  if (!isp || !Object.keys(isp).length) return t;
  let promijenjeno = false;
  const segmenti = t.segmenti.map((s, i) => {
    const novi = isp[i];
    if (typeof novi !== 'string' || !novi.trim() || novi === s.tekst) return s;
    promijenjeno = true;
    return { ...s, tekst: novi };
  });
  return promijenjeno ? { ...t, segmenti } : t;
}

const ispravljeno = new Map<string, Transkript>();
const ispravljenoEn = new Map<string, Transkript>();
for (const [id, isp] of Object.entries(transkriptIspravke)) {
  const bs = mapa.get(id);
  if (bs && isp.bs) ispravljeno.set(id, saIspravkama(bs, isp.bs));
  const en = mapaEn.get(id);
  if (en && isp.en) ispravljenoEn.set(id, saIspravkama(en, isp.en));
}

/** Engleski prevod transkripta (sa ispravkama iz admina) ili null (nema ga za svaki video). */
export function getTranskriptEn(id: string): Transkript | null {
  return ispravljenoEn.get(id) ?? mapaEn.get(id) ?? null;
}

/** Transkript za video (sa ispravkama iz admina) ili null ako ne postoji. */
export function getTranskript(id: string): Transkript | null {
  return ispravljeno.get(id) ?? mapa.get(id) ?? null;
}

/** Original iz JSON-a, bez ispravki iz baze (za admin). */
export const getTranskriptOriginal = (id: string): Transkript | null => mapa.get(id) ?? null;
export const getTranskriptEnOriginal = (id: string): Transkript | null => mapaEn.get(id) ?? null;

export function imaTranskript(id: string): boolean {
  return mapa.has(id);
}

/** Svi id-jevi videa koji imaju transkript. */
export const transkriptIds: string[] = [...mapa.keys()];

/** 75 → "1:15", 3725 → "1:02:05" */
export function vrijemeTekst(sek: number): string {
  const s = Math.max(0, Math.floor(sek));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Običan tekst (za .txt, kopiranje, pretragu). */
export function transkriptTekst(t: Transkript, saVremenom = false): string {
  return t.segmenti.map((s) => (saVremenom ? `[${vrijemeTekst(s.od)}] ${s.tekst}` : s.tekst)).join(saVremenom ? '\n\n' : ' ');
}

export function brojRijeci(t: Transkript): number {
  let n = 0;
  for (const s of t.segmenti) n += s.tekst.split(/\s+/).filter(Boolean).length;
  return n;
}

/**
 * Kompaktni podaci za pretragu transkripata (endpoint /pretraga-transkripti.json).
 * Oblik: { v: 1, t: [[id, [[odSekundi, tekst], …]], …] }.
 * `maxZnakova` ograničava tekst po videu (dugi snimci) da JSON ostane razuman.
 */
export type TPretragaStavka = [string, [number, string][]];
export interface TPretragaPodaci {
  v: 1;
  t: TPretragaStavka[];
}

export function transkriptiZaPretragu(maxZnakova = 40_000, samo?: Set<string>): TPretragaPodaci {
  const t: TPretragaStavka[] = [];
  for (const id of mapa.keys()) {
    if (samo && !samo.has(id)) continue; // npr. skrivena predavanja
    const tr = getTranskript(id)!;
    let znakova = 0;
    const seg: [number, string][] = [];
    for (const s of tr.segmenti) {
      if (znakova >= maxZnakova) break;
      if (s.tekst.startsWith('[')) continue; // oznake tipa "[arapski / nije transkribovano]"
      const tekst = s.tekst.length + znakova > maxZnakova ? s.tekst.slice(0, maxZnakova - znakova) : s.tekst;
      seg.push([Math.floor(s.od), tekst]);
      znakova += tekst.length;
    }
    t.push([id, seg]);
  }
  return { v: 1, t };
}
