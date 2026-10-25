// Putanje slika (build): lokalne slike iz public/ dobijaju base sajta, URL-ovi iz admina (Supabase
// storage) ostaju kako jesu. Manje varijante lokalnih slika (<ime>-1000.webp, <ime>-600.webp) se
// koriste samo ako fajl zaista postoji u public/.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { url } from './url';
import { dzamija } from './data';

export const jeVanjska = (src: string) => /^https?:\/\//.test(src);

/** '/images/x.webp' → '/mosqueJalija/images/x.webp'; 'https://…' ostaje. */
export const slikaSrc = (src: string) => (jeVanjska(src) ? src : url(src));

const postojiUPublic = (putanja: string) => {
  try {
    return existsSync(join(process.cwd(), 'public', putanja.replace(/^\//, '')));
  } catch {
    return false;
  }
};

/** Lokalna varijanta '<ime>-<sufiks>.webp' ako postoji, inače null. */
export function varijanta(src: string, sufiks: string): string | null {
  if (jeVanjska(src) || !/\.webp$/i.test(src)) return null;
  const v = src.replace(/\.webp$/i, `-${sufiks}.webp`);
  return postojiUPublic(v) ? v : null;
}

export interface NaslovnaSlika {
  src: string;
  srcset?: string;
  izvor: string | null;
}

/** Naslovna fotografija džamije (admin → Podaci o džamiji → Naslovna fotografija). null = nema. */
export function naslovnaSlika(): NaslovnaSlika | null {
  const s = dzamija.naslovnaSlika;
  if (!s) return null;
  const mala = varijanta(s, '1000');
  return {
    src: slikaSrc(mala ?? s),
    srcset: mala ? `${slikaSrc(mala)} 1000w, ${slikaSrc(s)} 2000w` : undefined,
    izvor: dzamija.naslovnaSlikaIzvor?.trim() || null,
  };
}
