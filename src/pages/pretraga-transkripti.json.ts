// Podaci za pretragu po transkriptima predavanja. Učitava se lijeno (tek kad korisnik pretražuje),
// pa ne opterećuje stranicu /pretraga. Vidi src/lib/transkripti-pretraga.ts.
import type { APIRoute } from 'astro';
import { predavanja } from '../lib/data';
import { transkriptiZaPretragu } from '../lib/transkripti';

// samo vidljiva predavanja (skrivena iz admina nemaju stranicu)
export const GET: APIRoute = () =>
  new Response(JSON.stringify(transkriptiZaPretragu(40_000, new Set(predavanja.map((p) => p.id)))), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
