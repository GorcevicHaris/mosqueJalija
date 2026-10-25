// Zajedničko stanje admin panela: podaci ugrađeni pri buildu + liste iz baze (imami, kategorije, serije).
import type { Opcija } from './polja';
import { sb } from './sb';

export interface UgradjeniImam {
  slug: string;
  punoIme: string;
  aliasi: string[];
  uloga: string | null;
  bio: string | null;
  slika: string | null;
  potvrdjeno: boolean;
  izvori: { naziv: string; url: string | null }[];
}
export interface UgradjenoPredavanje {
  id: string;
  naslov: string;
  naslovCist: string;
  datum: string;
  imam: string | null;
  kategorija: string;
  serija: string | null;
  serijaDio: number | null;
  /** skriveno pri buildu (ispravka "skriveno": true) */
  skriveno?: boolean;
  /** ručno dodano (predavanja_rucna) */
  rucno?: boolean;
  /** ima transkript (bs) / engleski prevod */
  tr?: boolean;
  trEn?: boolean;
}
export interface UgradjenTekstStranice {
  kljuc: string;
  naziv: string;
  putanja: string;
  vrsta: 'uvod' | 'podnaslov' | 'tekst';
  naslov: string | null;
  sadrzaj: string | null;
  pomoc?: string;
}
export interface Ugradjeno {
  imami: UgradjeniImam[];
  kategorije: { slug: string; naziv: string; opis: string | null }[];
  serije: { slug: string; naziv: string; opis: string | null }[];
  predavanja: UgradjenoPredavanje[];
  dzamija: Record<string, unknown>;
  obavKategorije: string[];
  doveKategorije: string[];
  stranice: UgradjenTekstStranice[];
  /** nazivi ikonica iz src/components/ui/Icon.astro */
  ikone: string[];
  /** objavljena obavještenja (slug, naslov) — za vezu programa sa obavještenjem */
  obavjestenja: { slug: string; naslov: string }[];
}

let _ugradjeno: Ugradjeno | null = null;
export function ugradjeno(): Ugradjeno {
  if (!_ugradjeno) {
    const t = document.getElementById('adm-podaci')?.textContent ?? '{}';
    _ugradjeno = JSON.parse(t) as Ugradjeno;
  }
  return _ugradjeno;
}

export const stanje = {
  email: '' as string,
  uloga: 'urednik' as 'admin' | 'urednik',
  imami: [] as { slug: string; punoIme: string }[],
  kategorije: [] as { slug: string; naziv: string }[],
  serije: [] as { slug: string; naziv: string }[],
};

const spoji = <T extends { slug: string }>(a: T[], b: T[]): T[] => {
  const m = new Map(a.map((x) => [x.slug, x]));
  for (const x of b) m.set(x.slug, x);
  return Array.from(m.values());
};

/** Učitava imame/kategorije/serije iz baze i spaja sa ugrađenim listama (za padajuće menije). */
export async function osvjeziListe(): Promise<void> {
  const u = ugradjeno();
  stanje.imami = u.imami.map((i) => ({ slug: i.slug, punoIme: i.punoIme }));
  stanje.kategorije = u.kategorije.map((k) => ({ slug: k.slug, naziv: k.naziv }));
  stanje.serije = u.serije.map((s) => ({ slug: s.slug, naziv: s.naziv }));
  try {
    const k = await sb();
    const [im, kat, ser] = await Promise.all([
      k.from('imami').select('slug,puno_ime').order('redoslijed'),
      k.from('kategorije').select('slug,naziv').order('redoslijed'),
      k.from('serije').select('slug,naziv').order('redoslijed'),
    ]);
    if (!im.error) stanje.imami = spoji(stanje.imami, (im.data ?? []).map((r: { slug: string; puno_ime: string }) => ({ slug: r.slug, punoIme: r.puno_ime })));
    if (!kat.error) stanje.kategorije = spoji(stanje.kategorije, kat.data ?? []);
    if (!ser.error) stanje.serije = spoji(stanje.serije, ser.data ?? []);
  } catch {
    /* ostaju ugrađene liste */
  }
}

export const opcijeImama = (): Opcija[] => stanje.imami.map((i) => ({ v: i.slug, t: i.punoIme })).sort((a, b) => a.t.localeCompare(b.t, 'sr'));
export const opcijeKategorija = (): Opcija[] => stanje.kategorije.map((k) => ({ v: k.slug, t: k.naziv }));
export const opcijeSerija = (): Opcija[] => stanje.serije.map((s) => ({ v: s.slug, t: s.naziv }));
export const nazivImama = (slug: string | null | undefined) => stanje.imami.find((i) => i.slug === slug)?.punoIme ?? slug ?? '';
