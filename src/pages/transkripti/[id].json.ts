// /transkripti/<id>.json — ORIGINALNI tekstovi segmenata transkripta (bez ispravki iz baze) za admin
// (Predavanja → Transkripti učitava ovaj fajl tek kad urednik izabere predavanje, da se svi
// transkripti ne ugrađuju u admin stranicu).
// Oblik: { bs: string[], en: string[] | null, od: number[], odEn: number[] | null }.
// `od`/`odEn` = početak segmenta u sekundama; indeks u nizu = `segment` u tabeli transkript_ispravke.
import type { APIRoute, GetStaticPaths } from 'astro';
import { svaPredavanja } from '../../lib/data';
import { getTranskriptEnOriginal, getTranskriptOriginal } from '../../lib/transkripti';

export const getStaticPaths = (() =>
  svaPredavanja.filter((p) => getTranskriptOriginal(p.id)).map((p) => ({ params: { id: p.id } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const id = String(params.id);
  const bs = getTranskriptOriginal(id);
  const en = getTranskriptEnOriginal(id);
  const sek = (s: { od: number }) => Math.floor(Number(s.od) || 0);
  const tijelo = {
    bs: bs ? bs.segmenti.map((s) => s.tekst) : [],
    en: en ? en.segmenti.map((s) => s.tekst) : null,
    od: bs ? bs.segmenti.map(sek) : [],
    odEn: en ? en.segmenti.map(sek) : null,
  };
  return new Response(JSON.stringify(tijelo), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
