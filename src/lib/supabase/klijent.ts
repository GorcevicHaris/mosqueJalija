// Klijentski (pregledač) helperi: najnovija objavljena obavještenja direktno iz baze, da se nova
// objava vidi odmah, bez čekanja na sljedeći build. Bez zavisnosti (fetch na PostgREST).
//
// Upotreba u <script> stranice:
//   import { dopuniObavjestenja } from '../../lib/supabase/klijent';
//   dopuniObavjestenja('[data-ol]', { tip: 'obavjestenje', oblik: 'lista' });       // /obavjestenja
//   dopuniObavjestenja('[data-ol]', { tip: 'objava', oblik: 'lista' });             // /objave
//   dopuniObavjestenja('[data-news]', { oblik: 'pocetna', max: 3 });                // početna
// Bez podešene baze funkcije ne rade ništa (vraćaju null / 0).

import { escapeHtml } from '../format';
import { datumTekst } from '../format';
import { restUrl, supabaseUkljucen, TABELE, zaglavlja } from './config';
import type { Obavjestenje } from '../types';

export type ObavjestenjeKlijent = Obavjestenje & { createdAt: string };

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const POLJA = 'slug,tip,naslov,datum,kategorija,sazetak,sadrzaj,slika,placeholder,created_at';

function mapiraj(r: Record<string, unknown>): ObavjestenjeKlijent {
  return {
    slug: String(r.slug ?? ''),
    tip: r.tip === 'objava' ? 'objava' : 'obavjestenje',
    naslov: String(r.naslov ?? ''),
    datum: String(r.datum ?? '').slice(0, 10),
    kategorija: String(r.kategorija ?? 'Ostalo'),
    sazetak: String(r.sazetak ?? ''),
    sadrzaj: Array.isArray(r.sadrzaj) ? (r.sadrzaj as unknown[]).map(String) : [],
    slika: typeof r.slika === 'string' && r.slika ? r.slika : null,
    placeholder: r.placeholder === true,
    createdAt: String(r.created_at ?? ''),
  };
}

async function dohvati(putanja: string, ms = 6000): Promise<Record<string, unknown>[] | null> {
  if (!supabaseUkljucen) return null;
  try {
    const res = await fetch(restUrl(putanja), { headers: zaglavlja(), signal: AbortSignal.timeout(ms) });
    if (!res.ok) return null;
    const d = (await res.json()) as unknown;
    return Array.isArray(d) ? (d as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

/** Najnovija objavljena obavještenja/objave (null = baza nije podešena ili nije dostupna). */
export async function ucitajObjavljena(opts: { tip?: Obavjestenje['tip']; limit?: number } = {}): Promise<ObavjestenjeKlijent[] | null> {
  const tip = opts.tip ? `&tip=eq.${opts.tip}` : '';
  const rows = await dohvati(`${TABELE.obavjestenja}?select=${POLJA}&objavljeno=eq.true${tip}&order=datum.desc,created_at.desc&limit=${opts.limit ?? 20}`);
  return rows ? rows.map(mapiraj).filter((o) => SLUG_RE.test(o.slug) && o.naslov) : null;
}

/** Jedno objavljeno obavještenje po slugu (null = ne postoji / nije dostupno). */
export async function ucitajPoSlugu(slug: string): Promise<ObavjestenjeKlijent | null> {
  if (!SLUG_RE.test(slug)) return null;
  const rows = await dohvati(`${TABELE.obavjestenja}?select=${POLJA}&objavljeno=eq.true&slug=eq.${slug}&limit=1`);
  return rows?.[0] ? mapiraj(rows[0]) : null;
}

/** Ista pravila kao kategorijaSlug iz src/lib/obavjestenja.ts (filter čipovi). */
export const kategorijaSlug = (k: string) =>
  k.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** Statična stranica (ako je napravljena pri buildu) ili klijentski prikaz ?slug=. */
export function hrefObavjestenja(slug: string, staticni?: Set<string>): string {
  return staticni?.has(slug) ? `${BASE}obavjestenja/${slug}/` : `${BASE}obavjestenja/prikaz/?slug=${encodeURIComponent(slug)}`;
}

const slikaUrl = (s: string | null) => (!s ? null : /^https?:\/\//.test(s) ? s : `${BASE}${s.replace(/^\//, '')}`);

/** Tekst paragrafa → HTML (escape + linkovi), isto kao opisHTML na statičnim stranicama. */
export function paragrafHTML(par: string): string {
  const e = escapeHtml(par.trim()).replace(
    /\b(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g,
    (m) => `<a href="${m}" target="_blank" rel="noopener noreferrer">${m}</a>`,
  );
  return `<p>${e.replace(/\n/g, '<br />')}</p>`;
}

/** HTML stavke — ISTI markup i klase kao src/pages/obavjestenja/_Lista.astro. */
export function stavkaListeHTML(o: ObavjestenjeKlijent, href: string): string {
  const img = slikaUrl(o.slika);
  return `<li class="card ol__item" data-ol-item="${escapeHtml(kategorijaSlug(o.kategorija))}" data-slug="${escapeHtml(o.slug)}">
  ${img ? `<img class="ol__img" src="${escapeHtml(img)}" alt="" width="320" height="180" loading="lazy" decoding="async" />` : ''}
  <div class="ol__body">
    <p class="ol__meta">
      <time datetime="${escapeHtml(o.datum)}">${escapeHtml(datumTekst(o.datum))}</time>
      <span class="badge">${escapeHtml(o.kategorija)}</span>
      ${o.placeholder ? '<span class="badge badge--warn" title="Primjer sadržaja — biće zamijenjen stvarnim obavještenjem">Primjer</span>' : ''}
    </p>
    <h2 class="ol__title card__title"><a href="${escapeHtml(href)}">${escapeHtml(o.naslov)}</a></h2>
    <p class="ol__sazetak">${escapeHtml(o.sazetak)}</p>
    <span class="ol__more link-arrow" aria-hidden="true">Pročitaj više</span>
  </div>
</li>`;
}

/** HTML stavke za početnu — ISTI markup kao sekcija "Aktuelno" u src/pages/index.astro. */
export function stavkaPocetneHTML(o: ObavjestenjeKlijent, href: string): string {
  return `<li class="news__item card card--link" data-slug="${escapeHtml(o.slug)}">
  <div class="news__meta">
    <time datetime="${escapeHtml(o.datum)}">${escapeHtml(datumTekst(o.datum))}</time>
    <span class="badge">${escapeHtml(o.kategorija)}</span>
    ${o.placeholder ? '<span class="badge badge--warn">Primjer sadržaja</span>' : ''}
  </div>
  <h3 class="card__title news__title"><a href="${escapeHtml(href)}">${escapeHtml(o.naslov)}</a></h3>
  <p class="news__excerpt">${escapeHtml(o.sazetak)}</p>
</li>`;
}

/** Astro scoped CSS koristi atribute data-astro-cid-*; nove elemente "potpisujemo" istim atributima. */
function cidAtributi(el: Element | null): Attr[] {
  const rez: Attr[] = [];
  for (let e: Element | null = el; e && rez.length === 0; e = e.parentElement) {
    for (const a of Array.from(e.attributes)) if (a.name.startsWith('data-astro-cid-')) rez.push(a);
  }
  return rez;
}
function potpisi(el: Element, attrs: Attr[]) {
  if (!attrs.length) return;
  [el, ...Array.from(el.querySelectorAll('*'))].forEach((x) => attrs.forEach((a) => x.setAttribute(a.name, a.value)));
}

/**
 * Dodaje u postojeću (statičnu) listu objave iz baze kojih u njoj još nema (npr. objavljene poslije
 * zadnjeg builda). Vraća broj dodanih stavki. Već prikazane stavke se ne diraju.
 *
 * @param root    element/selektor liste: `[data-ol]` (_Lista.astro) ili omotač `ul.news` na početnoj
 * @param opts.tip       filter po tipu (lista); početna obično bez filtera
 * @param opts.oblik     'lista' (_Lista.astro markup) ili 'pocetna' (index.astro markup)
 * @param opts.max       najviše stavki u listi poslije dopune (početna: 3)
 * @param opts.staticni  slugovi koji imaju statičnu stranicu (inače se čitaju iz postojećih linkova)
 */
export async function dopuniObavjestenja(
  root: Element | string | null,
  opts: { tip?: Obavjestenje['tip']; oblik?: 'lista' | 'pocetna'; max?: number; staticni?: string[] } = {},
): Promise<number> {
  const el = typeof root === 'string' ? document.querySelector(root) : root;
  if (!el || !supabaseUkljucen) return 0;
  const oblik = opts.oblik ?? 'lista';
  const sveze = await ucitajObjavljena({ tip: opts.tip, limit: opts.max ? Math.max(opts.max, 10) : 20 });
  if (!sveze?.length) return 0;

  // Slugovi koji već postoje na stranici (iz linkova /obavjestenja/<slug>/ ili data-slug)
  const prikazani = new Set<string>();
  el.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const m = a.getAttribute('href')?.match(/\/obavjestenja\/([a-z0-9-]+)\/?(?:[?#]|$)/);
    if (m && m[1] !== 'prikaz') prikazani.add(m[1]);
  });
  el.querySelectorAll<HTMLElement>('[data-slug]').forEach((x) => x.dataset.slug && prikazani.add(x.dataset.slug));
  const staticni = new Set([...(opts.staticni ?? []), ...prikazani]);
  const nove = sveze.filter((o) => !prikazani.has(o.slug));
  if (!nove.length) return 0;

  let lista = el.matches('ul') ? (el as HTMLUListElement) : el.querySelector<HTMLUListElement>(oblik === 'lista' ? '.ol__list' : 'ul.news, ul');
  const cid = cidAtributi(lista ?? el);
  if (!lista) {
    // prazno stanje → napravi listu na mjestu poruke "nema objava"
    lista = document.createElement('ul');
    lista.className = oblik === 'lista' ? 'ol__list' : 'news';
    lista.setAttribute('role', 'list');
    potpisi(lista, cid);
    const prazno = el.querySelector('.ol__empty, .empty');
    if (prazno) prazno.replaceWith(lista);
    else el.appendChild(lista);
  }

  const aktivniFilter = el.querySelector<HTMLButtonElement>('[data-ol-kat][aria-pressed="true"]')?.dataset.olKat ?? '';
  for (const o of nove) {
    const t = document.createElement('template');
    const href = hrefObavjestenja(o.slug, staticni);
    t.innerHTML = (oblik === 'lista' ? stavkaListeHTML(o, href) : stavkaPocetneHTML(o, href)).trim();
    const li = t.content.firstElementChild as HTMLElement;
    potpisi(li, cid);
    if (aktivniFilter && li.dataset.olItem !== aktivniFilter) li.hidden = true;
    // ubaci prije prve stavke sa starijim datumom
    const stavke = Array.from(lista.children) as HTMLElement[];
    const prije = stavke.find((s) => (s.querySelector('time')?.getAttribute('datetime') ?? '') < o.datum);
    lista.insertBefore(li, prije ?? null);
  }
  if (opts.max) while (lista.children.length > opts.max) lista.lastElementChild?.remove();
  el.dispatchEvent(new CustomEvent('obavjestenja:dopunjeno', { bubbles: true, detail: { dodano: nove.length } }));
  return nove.length;
}

/** Javna pitanja sa odgovorima ("Pitaj imama"). */
export async function ucitajJavnaPitanja(limit = 50) {
  const rows = await dohvati(`${TABELE.pitanjaJavna}?select=id,pitanje,odgovor,odgovorio,odgovoreno_at,created_at&odgovor=not.is.null&order=odgovoreno_at.desc.nullslast&limit=${limit}`);
  return rows
    ? rows.map((r) => ({
        id: String(r.id),
        pitanje: String(r.pitanje ?? ''),
        odgovor: String(r.odgovor ?? ''),
        odgovorio: typeof r.odgovorio === 'string' ? r.odgovorio : null,
        odgovorenoAt: typeof r.odgovoreno_at === 'string' ? r.odgovoreno_at : null,
      }))
    : null;
}
