// Jedino mjesto koje čita /data. Stranice i komponente uvoze odavde, nikad direktno JSON.
import dzamijaJson from '../../data/dzamija.json';
import imamiJson from '../../data/imami.json';
import imamiBioJson from '../../data/imami-bio.json';
import predavanjaJson from '../../data/predavanja.json';
import kategorijeJson from '../../data/kategorije.json';
import serijeJson from '../../data/serije.json';
import obavjestenjaJson from '../../data/obavjestenja.json';
import doveJson from '../../data/dove.json';
import ajetiHadisiJson from '../../data/ajeti-hadisi.json';
import galerijaJson from '../../data/galerija.json';
import type {
  AjetHadis,
  Dova,
  Dzamija,
  GalerijaSlika,
  Imam,
  ImamBio,
  ImamOsnovno,
  Kategorija,
  Obavjestenje,
  Predavanje,
  Serija,
} from './types';

import { ucitajIzBaze, spojiDzamiju, spojiPoSlugu, primijeniIspravke } from './supabase/sadrzaj';
import type { TerminRasporeda, StranicaTekst, JavnoPitanje } from './supabase/tipovi';

export type { TerminRasporeda, StranicaTekst, JavnoPitanje } from './supabase/tipovi';

// Sadržaj iz Supabase baze (admin panel). null = nema varijabli ili baza nije dostupna → data/*.json.
// "Sve ili ništa": nikad mješavina baze i JSON-a (vidi docs/supabase.md).
const baza = await ucitajIzBaze();

/** true = ovaj build je napravljen iz baze (admin), false = iz data/*.json. */
export const izBaze = baza !== null;

export const dzamija: Dzamija = spojiDzamiju(dzamijaJson as Dzamija, baza?.dzamija);

export const kategorije: Kategorija[] = spojiPoSlugu(kategorijeJson as Kategorija[], baza?.kategorije ?? []);
export const serije: Serija[] = spojiPoSlugu(serijeJson as Serija[], baza?.serije ?? []);
const imamiOsnovno: ImamOsnovno[] = spojiPoSlugu(imamiJson as ImamOsnovno[], baza?.imami ?? []);

// Redoslijed je bitan: kategorije/serije/imami prije predavanja (validacija ispravki iz baze).
export const predavanja: Predavanje[] = primijeniIspravke(predavanjaJson as Predavanje[], baza?.ispravke ?? {}, {
  imami: new Set(imamiOsnovno.map((i) => i.slug)),
  kategorije: new Set(kategorije.map((k) => k.slug)),
  serije: new Set(serije.map((s) => s.slug)),
})
  .slice()
  .sort((a, b) => b.datum.localeCompare(a.datum));

const bio: Record<string, Partial<ImamBio>> = {
  ...(imamiBioJson as Record<string, Partial<ImamBio>>),
  ...(baza?.imamiBio ?? {}),
};

export const imami: Imam[] = imamiOsnovno
  .map((i) => ({
    ...i,
    uloga: bio[i.slug]?.uloga ?? null,
    bio: bio[i.slug]?.bio ?? null,
    slika: bio[i.slug]?.slika ?? null,
    potvrdjeno: bio[i.slug]?.potvrdjeno ?? false,
    izvori: bio[i.slug]?.izvori ?? [],
    brojPredavanja: predavanja.filter((p) => p.imam === i.slug).length,
  }))
  .sort((a, b) => b.brojPredavanja - a.brojPredavanja);

export const obavjestenja: Obavjestenje[] = (baza?.obavjestenja ?? (obavjestenjaJson as Obavjestenje[]))
  .slice()
  .sort((a, b) => b.datum.localeCompare(a.datum));

export const dove: Dova[] = baza?.dove ?? (doveJson as Dova[]);
export const ajetiHadisi: AjetHadis[] = baza?.ajetiHadisi ?? (ajetiHadisiJson as AjetHadis[]);
export const galerija: GalerijaSlika[] = baza?.galerija ?? (galerijaJson as GalerijaSlika[]);

/** Sedmični raspored (samo aktivni termini, po danu pa redoslijedu). Prazno bez baze. */
export const raspored: TerminRasporeda[] = baza?.raspored ?? [];
/** Uvodni tekstovi stranica iz admina (ključ: mekteb, donacije, pravila-ponasanja, ucenje-kurana). */
export const tekstoviStranica: Record<string, StranicaTekst> = baza?.stranice ?? {};
/** Objavljena pitanja sa odgovorom ("Pitaj imama"). */
export const javnaPitanja: JavnoPitanje[] = baza?.pitanja ?? [];

/** Paragrafi teksta stranice iz baze; prazan niz = stranica koristi svoj ugrađeni tekst. */
export const tekstStranice = (kljuc: string): StranicaTekst | null => {
  const t = tekstoviStranica[kljuc];
  return t && t.paragrafi.length ? t : null;
};

export const getImam = (slug: string | null) => imami.find((i) => i.slug === slug) ?? null;
export const getKategorija = (slug: string | null) => kategorije.find((k) => k.slug === slug) ?? null;
export const getSerija = (slug: string | null) => serije.find((s) => s.slug === slug) ?? null;
export const getPredavanje = (id: string) => predavanja.find((p) => p.id === id) ?? null;

const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

/** "2026-10-24" -> "24. oktobar 2026." */
export function formatDatum(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number);
  return `${d}. ${MJESECI[m - 1]} ${g}.`;
}

/** 636 -> "10:36", 3725 -> "1:02:05" */
export function formatTrajanje(sekunde: number): string {
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  const s = Math.floor(sekunde % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Kanali za privatne poruke džematu kada e-mail nije objavljen.
 * Instagram DM link (ig.me/m/<profil>) se izvodi iz adrese Instagram profila.
 */
export function kanaliPoruka(): { instagramDm: string | null; instagram: string | null; facebook: string | null } {
  const ig = dzamija.drustveneMreze.instagram ?? null;
  const fb = dzamija.drustveneMreze.facebook ?? null;
  const profil = ig?.match(/instagram\.com\/([A-Za-z0-9._]+)/)?.[1] ?? null;
  return { instagramDm: profil ? `https://ig.me/m/${profil}` : null, instagram: ig, facebook: fb };
}

/** Puna adresa za prikaz, bez ponavljanja grada ("Jalija 69, 36300 Novi Pazar, Srbija"). */
export function punaAdresa(): string {
  const { adresa, grad, drzava } = dzamija;
  const dijelovi = [adresa];
  if (grad && !(adresa ?? '').includes(grad)) dijelovi.push(grad);
  dijelovi.push(drzava);
  return dijelovi.filter(Boolean).join(', ');
}

/** Adresa rastavljena za schema.org PostalAddress. */
export function adresaDijelovi(): { ulica: string | null; postanskiBroj: string | null } {
  const a = dzamija.adresa ?? '';
  const m = a.match(/^(.*?),\s*(\d{5})\s+.+$/);
  return m ? { ulica: m[1], postanskiBroj: m[2] } : { ulica: a || null, postanskiBroj: null };
}
