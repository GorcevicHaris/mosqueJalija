// /transkripti/<id>.json — ORIGINALNI tekstovi segmenata transkripta (bez ispravki iz baze) za admin
// (Predavanja → Transkripti učitava ovaj fajl tek kad urednik izabere predavanje, da se svi
// transkripti ne ugrađuju u admin stranicu).
// Oblik: { bs: string[], en: string[] | null, od: number[], odEn: number[] | null, ar?, arEn? }.
// `ar`/`arEn` = arapski segmenti (jezik "ar"): { [indeks]: { prevod, provjeriti } } — tekst im je arapskim pismom.
// `od`/`odEn` = početak segmenta u sekundama; indeks u nizu = `segment` u tabeli transkript_ispravke.
import type { APIRoute, GetStaticPaths } from 'astro';
import { svaPredavanja } from '../../lib/data';
import { getTranskriptEnOriginal, getTranskriptOriginal, jeArapski, type Transkript } from '../../lib/transkripti';

export const getStaticPaths = (() =>
  svaPredavanja.filter((p) => getTranskriptOriginal(p.id)).map((p) => ({ params: { id: p.id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const id = String(params.id);
  const bs = getTranskriptOriginal(id);
  const en = getTranskriptEnOriginal(id);
  const sek = (s: { od: number }) => Math.floor(Number(s.od) || 0);
  const arapski = (t: Transkript | null) => {
    const m: Record<number, { prevod: string | null; provjeriti?: true }> = {};
    t?.segmenti.forEach((s, i) => {
      if (jeArapski(s)) m[i] = { prevod: s.prevod ?? null, ...(s.provjeriti ? { provjeriti: true as const } : {}) };
    });
    return Object.keys(m).length ? m : undefined;
  };
  const tijelo = {
    bs: bs ? bs.segmenti.map((s) => s.tekst) : [],
    en: en ? en.segmenti.map((s) => s.tekst) : null,
    od: bs ? bs.segmenti.map(sek) : [],
    odEn: en ? en.segmenti.map(sek) : null,
    ar: arapski(bs),
    arEn: arapski(en),
  };
  return new Response(JSON.stringify(tijelo), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
