// Imam džamije: jedini predavač sa vlastitim profilom (/imam/). Ostali predavači se i dalje
// prikazuju uz predavanja (filteri, kartice), ali bez stranice profila.
import { getImam } from './data';

/** Slug imama džamije (data/imami.json). */
export const IMAM_SLUG = 'admir-jasarevic';
/** Putanja profila imama (bez base-a; prolazi kroz url()). */
export const IMAM_PUTANJA = '/imam';

/** Imam džamije sa biografijom (null ako ga nema u podacima). */
export const imamDzamije = getImam(IMAM_SLUG);

/** Putanja profila za predavača ili null (profil postoji samo za imama džamije). */
export function profilPredavaca(slug: string | null | undefined): string | null {
  return slug === IMAM_SLUG && imamDzamije ? IMAM_PUTANJA : null;
}
