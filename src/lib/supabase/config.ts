// Podešavanje veze sa Supabase bazom (sadržaj sajta).
// PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_ANON_KEY su JAVNI po dizajnu (ključ je "anon"/"publishable");
// podatke štite RLS politike u bazi (supabase/migrations/0002_rls.sql).
// Ako varijable nisu postavljene, koriste se javne vrijednosti projekta džamije ispod (svaki posjetilac
// ih ionako vidi u JS-u sajta), pa build radi i na hostingu bez podešenih varijabli (npr. Vercel).
// Prazna vrijednost ('') isključuje bazu: sve se tada čita iz data/*.json.
// Bez zavisnosti — smije se uvoziti i u klijentskim skriptama (Vite ugrađuje PUBLIC_* vrijednosti).

export const JAVNI_SUPABASE_URL = 'https://rcpdboohgumvezbtafrg.supabase.co';
export const JAVNI_SUPABASE_KLJUC = 'sb_publishable_bgyu3pp5MhPQKjztthGCzw_YPF_cunR';

export const SUPABASE_URL: string = String(import.meta.env.PUBLIC_SUPABASE_URL ?? JAVNI_SUPABASE_URL)
  .trim()
  .replace(/\/+$/, '');
export const SUPABASE_ANON_KEY: string = String(import.meta.env.PUBLIC_SUPABASE_ANON_KEY ?? JAVNI_SUPABASE_KLJUC).trim();

/** true = baza je podešena (obje varijable postoje i URL je ispravan). */
export const supabaseUkljucen: boolean = /^https:\/\/[^/]+$/.test(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 20;

/** Pun URL PostgREST resursa: restUrl('obavjestenja?select=*') */
export const restUrl = (putanja: string): string => `${SUPABASE_URL}/rest/v1/${putanja.replace(/^\//, '')}`;

/** Javni URL fajla iz storage bucketa. */
export const storageUrl = (bucket: string, putanja: string): string =>
  `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${putanja.split('/').map(encodeURIComponent).join('/')}`;

/**
 * Zaglavlja za anonimne REST zahtjeve. Novi "publishable" ključ (sb_publishable_…) nije JWT i šalje
 * se samo kao `apikey`; stari "anon" ključ (JWT, počinje sa eyJ) može ići i kao Bearer.
 */
export function zaglavlja(): Record<string, string> {
  const h: Record<string, string> = { apikey: SUPABASE_ANON_KEY, Accept: 'application/json' };
  if (SUPABASE_ANON_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPABASE_ANON_KEY}`;
  return h;
}

/** Nazivi tabela (jedno mjesto — koriste ih sajt i admin). */
export const TABELE = {
  obavjestenja: 'obavjestenja',
  galerija: 'galerija',
  imami: 'imami',
  imamiBio: 'imami_bio',
  kategorije: 'kategorije',
  serije: 'serije',
  dove: 'dove',
  ajetiHadisi: 'ajeti_hadisi',
  raspored: 'raspored',
  stranice: 'stranice_tekstovi',
  postavke: 'postavke',
  ispravke: 'predavanja_ispravke',
  urednici: 'urednici',
  poruke: 'poruke',
  prijave: 'prijave',
  pitanja: 'pitanja',
  pitanjaJavna: 'pitanja_javna',
  // migracija 0005 (opcione pri buildu: ako tabela još ne postoji, koristi se ugrađeni sadržaj)
  programi: 'programi',
  kartice: 'kartice_stranica',
  transkriptIspravke: 'transkript_ispravke',
  predavanjaRucna: 'predavanja_rucna',
  // migracija 0006 (opcione pri buildu: bez tabele = prazno stanje)
  aktivnosti: 'aktivnosti',
  citati: 'citati',
} as const;

export const BUCKET_SLIKE = 'slike';
