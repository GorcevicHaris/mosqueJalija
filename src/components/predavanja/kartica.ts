// Jedan izvor HTML-a za karticu predavanja: koristi ga LectureCard.astro (build) i klijentska
// skripta filtera (iscrtavanje rezultata) — markup je zato uvijek identičan.
// Bez uvoza podataka (sigurno za pregledač).
import { datumTekst, escapeHtml, trajanjeOpis, trajanjeTekst } from '../../lib/format.ts';

export interface KarticaPodaci {
  id: string;
  naslov: string;
  datum: string; // YYYY-MM-DD
  trajanje: number; // 0 = nepoznato
  thumbnail: string;
  imamIme: string | null;
  kategorijaNaziv: string | null;
  /** redni broj dijela serije (prikazuje se kao "Dio N") */
  dio?: number | null;
}

/** Sličice za karticu: mqdefault (320×180, 16:9) + hqdefault (480×360) za guste ekrane. */
export function sliciceKartice(id: string, thumbnail: string): { src: string; srcset: string } {
  if (/ytimg\.com|youtube\.com/.test(thumbnail) || !thumbnail) {
    const b = `https://i.ytimg.com/vi/${encodeURIComponent(id)}`;
    return { src: `${b}/mqdefault.jpg`, srcset: `${b}/mqdefault.jpg 320w, ${b}/hqdefault.jpg 480w` };
  }
  return { src: thumbnail, srcset: '' };
}

export function karticaHTML(p: KarticaPodaci, href: string, naslovTag: 'h2' | 'h3' = 'h3', eager = false): string {
  const e = escapeHtml;
  const { src, srcset } = sliciceKartice(p.id, p.thumbnail);
  const traj = trajanjeTekst(p.trajanje);
  const dur = traj
    ? `<span class="lcard__dur"><span class="visually-hidden">Trajanje: ${e(trajanjeOpis(p.trajanje))}</span><span aria-hidden="true">${traj}</span></span>`
    : '';
  const kat = p.kategorijaNaziv ? `<span class="badge lcard__badge">${e(p.kategorijaNaziv)}</span>` : '';
  const dio = p.dio ? `<span class="badge badge--primary lcard__badge">Dio ${p.dio}</span>` : '';
  const badge = kat || dio ? `<span class="lcard__badges">${kat}${dio}</span>` : '';
  const imam = p.imamIme ? `<span class="lcard__imam">${e(p.imamIme)}</span>` : '';
  return (
    `<article class="lcard">` +
    `<a class="lcard__link" href="${e(href)}">` +
    `<span class="lcard__thumb">` +
    `<img src="${e(src)}"${srcset ? ` srcset="${e(srcset)}" sizes="(min-width: 700px) 320px, 100vw"` : ''} alt="" width="320" height="180" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async" />` +
    `<span class="lcard__play" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg></span>` +
    dur +
    `</span>` +
    `<span class="lcard__body">` +
    badge +
    `<${naslovTag} class="lcard__title">${e(p.naslov)}</${naslovTag}>` +
    `<span class="lcard__meta">${imam}<time datetime="${e(p.datum)}">${e(datumTekst(p.datum))}</time></span>` +
    `</span>` +
    `</a>` +
    `</article>`
  );
}
