// Podaci za pretragu po transkriptima predavanja. Učitava se lijeno (tek kad korisnik pretražuje),
// pa ne opterećuje stranicu /pretraga. Vidi src/lib/transkripti-pretraga.ts.
import type { APIRoute } from 'astro';
import { transkriptiZaPretragu } from '../lib/transkripti';

export const GET: APIRoute = () =>
  new Response(JSON.stringify(transkriptiZaPretragu()), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
