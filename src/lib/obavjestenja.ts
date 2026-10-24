// Pomoćne funkcije za obavještenja i objave (build).
import { getImam, obavjestenja, predavanja } from './data';
import { url } from './url';
import type { Obavjestenje } from './types';

/** Stavka liste: stvarno obavještenje ili automatski izvedena vijest o novom snimku. */
export interface StavkaListe {
  kljuc: string;
  naslov: string;
  datum: string;
  kategorija: string;
  sazetak: string;
  href: string;
  slika: string | null;
  placeholder: boolean;
  automatski: boolean;
}

export const kategorijaSlug = (k: string) =>
  k
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'dj')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function izObavjestenja(o: Obavjestenje): StavkaListe {
  return {
    kljuc: o.slug,
    naslov: o.naslov,
    datum: o.datum,
    kategorija: o.kategorija,
    sazetak: o.sazetak,
    href: url(`/obavjestenja/${o.slug}`),
    slika: o.slika ? (/^https?:\/\//.test(o.slika) ? o.slika : url(o.slika)) : null,
    placeholder: o.placeholder,
    automatski: false,
  };
}

/** Vijesti o najnovijim snimcima (izvedeno iz data/predavanja.json — stvarni podaci). */
export function vijestiONovimSnimcima(broj = 3): StavkaListe[] {
  return predavanja
    .filter((p) => p.kategorija !== 'kratki-video')
    .slice(0, broj)
    .map((p) => {
      const imam = getImam(p.imam);
      const hutba = p.kategorija === 'hutba';
      return {
        kljuc: `snimak-${p.id}`,
        naslov: `${hutba ? 'Nova hutba' : 'Novo predavanje'}: ${p.naslovCist || p.naslov}`,
        datum: p.datum,
        kategorija: 'Predavanje',
        sazetak: `${hutba ? 'Objavljen je snimak hutbe' : 'Objavljen je novi snimak'}${imam ? ` — ${imam.punoIme}` : ''}. Pogledajte ga na sajtu ili na YouTube kanalu džamije.`,
        href: url(`/predavanja/${p.id}`),
        slika: `https://i.ytimg.com/vi/${p.id}/mqdefault.jpg`,
        placeholder: false,
        automatski: true,
      };
    });
}

export const obavjestenjaTipa = (tip: Obavjestenje['tip']) => obavjestenja.filter((o) => o.tip === tip);
