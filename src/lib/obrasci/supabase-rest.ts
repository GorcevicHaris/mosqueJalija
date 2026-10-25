// Minimalni klijent za Supabase PostgREST — bez biblioteka (radi i u buildu i u pregledniku).
// Javni (publishable) ključ je javan po dizajnu; sva zaštita je u RLS-u i privilegijama u bazi.
//
// PRAVILO: nikad ne logovati lične podatke (tijelo zahtjeva, imena, e-mailove) u konzolu.

const URL_BAZE = ((import.meta.env.PUBLIC_SUPABASE_URL as string | undefined) ?? '').trim().replace(/\/+$/, '');
const KLJUC = ((import.meta.env.PUBLIC_SUPABASE_ANON_KEY as string | undefined) ?? '').trim();

/** true ako su PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_ANON_KEY postavljeni u vrijeme builda. */
export const imaSupabase = Boolean(URL_BAZE && KLJUC);

export type VrstaGreske = 'mreza' | 'prava' | 'validacija' | 'limit' | 'nema-tabele' | 'server' | 'konfiguracija';

export type Rezultat<T = undefined> =
  | { ok: true; podaci: T }
  | { ok: false; vrsta: VrstaGreske; status: number; poruka: string };

const PORUKE: Record<VrstaGreske, string> = {
  mreza: 'Nema veze sa serverom. Provjerite internet vezu i pokušajte ponovo.',
  prava: 'Server je odbio zahtjev (nema dozvole za slanje). Pokušajte kasnije ili nam pišite na Instagramu.',
  validacija: 'Neki podaci nisu prihvaćeni — provjerite dužinu i format polja pa pokušajte ponovo.',
  limit: 'Poslano je previše poruka u kratkom vremenu. Pokušajte ponovo za sat vremena.',
  'nema-tabele': 'Ovaj obrazac još nije aktiviran na serveru. Pokušajte kasnije ili nam pišite na Instagramu.',
  server: 'Došlo je do greške na serveru. Pokušajte ponovo malo kasnije.',
  konfiguracija: 'Obrazac nije podešen (nedostaje veza sa bazom).',
};

/** Ljudska poruka za vrstu greške (srpski, ijekavica). */
export function porukaZaGresku(vrsta: VrstaGreske): string {
  return PORUKE[vrsta];
}

interface PgGreska { code?: string; message?: string; hint?: string | null; details?: string | null }

async function citajGresku(r: Response): Promise<PgGreska> {
  try {
    return (await r.json()) as PgGreska;
  } catch {
    return {};
  }
}

/** HTTP status + PostgREST/Postgres kod → vrsta greške. */
export function razvrstaj(status: number, g: PgGreska): VrstaGreske {
  if (g.hint === 'ogranicenje_slanja' || status === 429) return 'limit';
  if (g.code === 'PGRST205' || g.code === '42P01' || status === 404) return 'nema-tabele';
  // 42501 = insufficient_privilege (RLS / privilegije po koloni)
  if (status === 401 || status === 403 || g.code === '42501') return 'prava';
  if (status === 400 || status === 409 || status === 422) return 'validacija';
  if (status >= 500) return 'server';
  return 'server';
}

function zaglavlja(extra: Record<string, string> = {}): Record<string, string> {
  return { apikey: KLJUC, Authorization: `Bearer ${KLJUC}`, ...extra };
}

async function saRokom(input: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/**
 * INSERT jednog reda u javnu tabelu (anon smije samo INSERT — zato `return=minimal`, bez čitanja nazad).
 */
export async function unesi(tabela: string, red: Record<string, unknown>): Promise<Rezultat> {
  if (!imaSupabase) return { ok: false, vrsta: 'konfiguracija', status: 0, poruka: PORUKE.konfiguracija };
  let r: Response;
  try {
    r = await saRokom(
      `${URL_BAZE}/rest/v1/${encodeURIComponent(tabela)}`,
      {
        method: 'POST',
        headers: zaglavlja({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
        body: JSON.stringify(red),
      },
      15000,
    );
  } catch {
    return { ok: false, vrsta: 'mreza', status: 0, poruka: PORUKE.mreza };
  }
  if (r.ok) return { ok: true, podaci: undefined };
  const g = await citajGresku(r);
  const vrsta = razvrstaj(r.status, g);
  return { ok: false, vrsta, status: r.status, poruka: PORUKE[vrsta] };
}

/**
 * GET iz javne tabele/pogleda. `upit` je PostgREST query string, npr. "select=*&order=dan".
 * Koristi se i u buildu (SEO) i u pregledniku (osvježavanje).
 */
export async function procitaj<T>(tabela: string, upit = 'select=*', ms = 10000): Promise<Rezultat<T[]>> {
  if (!imaSupabase) return { ok: false, vrsta: 'konfiguracija', status: 0, poruka: PORUKE.konfiguracija };
  let r: Response;
  try {
    r = await saRokom(
      `${URL_BAZE}/rest/v1/${encodeURIComponent(tabela)}?${upit}`,
      { headers: zaglavlja({ Accept: 'application/json' }) },
      ms,
    );
  } catch {
    return { ok: false, vrsta: 'mreza', status: 0, poruka: PORUKE.mreza };
  }
  if (!r.ok) {
    const g = await citajGresku(r);
    const vrsta = razvrstaj(r.status, g);
    return { ok: false, vrsta, status: r.status, poruka: PORUKE[vrsta] };
  }
  try {
    const podaci = (await r.json()) as T[];
    return { ok: true, podaci: Array.isArray(podaci) ? podaci : [] };
  } catch {
    return { ok: false, vrsta: 'server', status: r.status, poruka: PORUKE.server };
  }
}

/** Isto kao `procitaj`, ali za build: greška → prazna lista (build nikad ne pada zbog baze). */
export async function procitajZaBuild<T>(tabela: string, upit = 'select=*'): Promise<{ redovi: T[]; greska: VrstaGreske | null }> {
  const r = await procitaj<T>(tabela, upit, 8000);
  return r.ok ? { redovi: r.podaci, greska: null } : { redovi: [], greska: r.vrsta };
}
