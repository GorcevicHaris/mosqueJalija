// Aktivnosti i citati: formatiranje, HTML stavki i čitanje iz baze u pregledaču.
// ISTI kod pravi markup pri buildu (set:html u .astro) i u pregledaču (osvježavanje bez builda),
// pa stavke uvijek izgledaju isto. Bez uvoza data.ts — sigurno za klijentske skripte.
// Sav tekst iz baze prolazi kroz escapeHtml; linkovi se prave samo od http(s)/www adresa.
import { datumTekst, escapeHtml, oblik } from './format';
import { restUrl, supabaseUkljucen, TABELE, zaglavlja } from './supabase/config';
import {
  aktivnostIz,
  AKTIVNOSTI_SELECT,
  citatIz,
  CITATI_SELECT,
  VRSTE_CITATA,
  type Aktivnost,
  type Citat,
  type VrstaCitata,
} from './supabase/tipovi';

export type { Aktivnost, Citat, VrstaCitata };
export { VRSTE_CITATA };

const BASE = import.meta.env.BASE_URL.replace(/\/?$/, '/');
/** Koliko objava se prikazuje odjednom ("Učitaj još" dodaje isto toliko). */
export const PO_STRANI = 10;

const MJESECI = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];

// ---------------------------------------------------------------------------------------------
// Datum i vrijeme (uvijek po vremenu u Novom Pazaru)
// ---------------------------------------------------------------------------------------------
let fmt: Intl.DateTimeFormat | null = null;
function dijelovi(iso: string): { g: number; m: number; d: number; sat: string; min: string } | null {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return null;
  fmt ??= new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Belgrade', year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const p = Object.fromEntries(fmt.formatToParts(t).map((x) => [x.type, x.value]));
  return { g: Number(p.year), m: Number(p.month), d: Number(p.day), sat: p.hour ?? '00', min: p.minute ?? '00' };
}

/** "24. oktobar 2026. u 18:30" */
export function datumVrijemeTekst(iso: string): string {
  const p = dijelovi(iso);
  return p ? `${p.d}. ${MJESECI[p.m - 1]} ${p.g}. u ${p.sat}:${p.min}` : '';
}

/** "24. oktobar 2026." */
export function samoDatumTekst(iso: string): string {
  const p = dijelovi(iso);
  return p ? datumTekst(`${p.g}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`) : '';
}

/** "upravo sada", "prije 5 minuta", "prije 2 sata", "juče", "prije 3 dana", "prije 2 sedmice", pa datum. */
export function prijeKoliko(iso: string, sada = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const s = (sada - t) / 1000;
  if (s < 60) return 'upravo sada';
  const min = Math.floor(s / 60);
  if (min < 60) return `prije ${min} ${oblik(min, 'minut', 'minuta', 'minuta')}`;
  const h = Math.floor(min / 60);
  if (h < 24) return `prije ${h} ${oblik(h, 'sat', 'sata', 'sati')}`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'juče';
  if (d < 14) return `prije ${d} ${oblik(d, 'dan', 'dana', 'dana')}`;
  if (d < 35) {
    const w = Math.floor(d / 7);
    return `prije ${w} ${oblik(w, 'sedmicu', 'sedmice', 'sedmica')}`;
  }
  return samoDatumTekst(iso);
}

/** <time> koji skripta pretvara u "prije 2 dana" (bez JS-a: pun datum); pun datum je u title. */
const vrijemeHTML = (iso: string, cls = '') =>
  `<time${cls ? ` class="${cls}"` : ''} datetime="${escapeHtml(iso)}" title="${escapeHtml(datumVrijemeTekst(iso))}" data-rel>${escapeHtml(datumVrijemeTekst(iso))}</time>`;

// ---------------------------------------------------------------------------------------------
// Tekst → HTML (bez ubacivanja HTML-a; linkovi samo za http(s):// i www.)
// ---------------------------------------------------------------------------------------------
const URL_RE = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+/gi;
const ZAVRSNI = /[.,;:!?…)\]}»“”]+$/;

function linkuj(sirov: string): string {
  let out = '';
  let zadnji = 0;
  for (const m of sirov.matchAll(URL_RE)) {
    const i = m.index ?? 0;
    let u = m[0];
    // završna interpunkcija ne pripada adresi; zatvorena zagrada ostaje ako je u adresi i otvorena
    const kraj = u.match(ZAVRSNI)?.[0] ?? '';
    if (kraj) u = u.slice(0, -kraj.length);
    if (kraj.startsWith(')') && u.includes('(')) u += ')';
    if (!u) continue;
    const href = /^www\./i.test(u) ? `https://${u}` : u;
    const prikaz = u.replace(/^https?:\/\//i, '').replace(/\/$/, '');
    out += escapeHtml(sirov.slice(zadnji, i));
    out += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(prikaz.length > 60 ? `${prikaz.slice(0, 57)}…` : prikaz)}</a>`;
    zadnji = i + u.length;
  }
  return out + escapeHtml(sirov.slice(zadnji));
}

/** Paragrafi (prazan red) → <p>, jedan novi red → <br>, adrese → linkovi. */
export function tekstHTML(tekst: string | null | undefined): string {
  return (tekst ?? '')
    .replace(/\r\n?/g, '\n')
    .split(/\n[ \t]*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${linkuj(p).replace(/\n/g, '<br />')}</p>`)
    .join('');
}

/** Kratak izvod za prikaz u listi/početnoj (bez HTML-a). */
export function izvod(tekst: string | null | undefined, max = 160): string {
  const t = (tekst ?? '').replace(/\s+/g, ' ').trim();
  if (t.length <= max) return t;
  const rez = t.slice(0, max);
  return `${rez.slice(0, Math.max(rez.lastIndexOf(' '), max - 20)).replace(/[\s,.;:–-]+$/, '')}…`;
}

export const srcSlike = (s: string): string => (/^https?:\/\//.test(s) ? s : `${BASE}${s.replace(/^\//, '')}`);

const DUGO_ZNAKOVA = 700;
const DUGO_REDOVA = 12;

// ---------------------------------------------------------------------------------------------
// HTML: objava aktivnosti
// ---------------------------------------------------------------------------------------------
const AVATAR = `<span class="akt__avatar" aria-hidden="true"><svg viewBox="0 0 100 100" width="22" height="22"><path d="M50,2L64.06,16.06L83.94,16.06L83.94,35.94L98,50L83.94,64.06L83.94,83.94L64.06,83.94L50,98L35.94,83.94L16.06,83.94L16.06,64.06L2,50L16.06,35.94L16.06,16.06L35.94,16.06Z" fill="currentColor"/></svg></span>`;

function slikeHTML(a: Aktivnost): string {
  const n = a.slike.length;
  if (!n) return '';
  const prikazane = a.slike.slice(0, n > 4 ? 4 : n);
  const json = escapeHtml(JSON.stringify(a.slike.map(srcSlike)));
  const opis = escapeHtml(a.naslov ?? izvod(a.tekst, 80));
  return `<div class="akt__slike akt__slike--${Math.min(n, 4)}" data-slike="${json}" data-opis="${opis}">${prikazane
    .map((s, i) => {
      const jos = n > 4 && i === 3 ? n - 4 : 0;
      const oznaka = jos ? `Prikaži sve slike (još ${jos})` : n === 1 ? 'Uvećaj sliku' : `Uvećaj sliku ${i + 1} od ${n}`;
      return `<button type="button" class="akt__slika" data-akt-slika="${i}" aria-label="${escapeHtml(oznaka)}"><img src="${escapeHtml(srcSlike(s))}" alt="" loading="lazy" decoding="async" />${jos ? `<span class="akt__jos" aria-hidden="true">+${jos}</span>` : ''}</button>`;
    })
    .join('')}</div>`;
}

/** Stavka liste na /aktivnosti (li > article). */
export function aktivnostHTML(a: Aktivnost): string {
  const id = escapeHtml(a.id);
  const naslovId = `a-${id}-naslov`;
  const dugo = (a.tekst?.length ?? 0) > DUGO_ZNAKOVA || (a.tekst?.split('\n').length ?? 0) > DUGO_REDOVA;
  const link = `${BASE}aktivnosti/#a-${id}`;
  const dijeli = escapeHtml(a.naslov || izvod(a.tekst, 120) || 'Aktivnost džemata');
  return `<li class="akt-stavka" data-id="${id}" data-v="${escapeHtml(a.verzija)}">
<article class="akt card" id="a-${id}"${a.naslov ? ` aria-labelledby="${naslovId}"` : ` aria-label="Objava od ${escapeHtml(samoDatumTekst(a.datum))}"`}>
  <header class="akt__glava">${AVATAR}<div class="akt__ko"><p class="akt__autor">Džamija na Jaliji</p><a class="akt__vrijeme" href="#a-${id}">${vrijemeHTML(a.datum)}</a></div></header>
  ${a.naslov ? `<h2 class="akt__naslov" id="${naslovId}">${escapeHtml(a.naslov)}</h2>` : ''}
  ${a.tekst ? `<div class="akt__tekst"${dugo ? ' data-dugo' : ''} id="a-${id}-tekst">${tekstHTML(a.tekst)}</div>${dugo ? `<button type="button" class="akt__vise" data-akt-vise aria-expanded="true" aria-controls="a-${id}-tekst" hidden>Prikaži manje</button>` : ''}` : ''}
  ${slikeHTML(a)}
  <footer class="akt__dno"><button type="button" class="btn btn--ghost btn--sm akt__dijeli" data-podijeli data-podijeli-naslov="${dijeli}" data-podijeli-url="${escapeHtml(link)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span data-podijeli-oznaka>Podijeli</span></button></footer>
</article>
</li>`;
}

/** Kratka stavka za početnu (kartica sa linkom na objavu). */
export function aktivnostKratkoHTML(a: Aktivnost): string {
  const id = escapeHtml(a.id);
  // bez naslova: izvod teksta je naslov kartice (bez ponavljanja istog teksta ispod)
  const naslov = a.naslov ?? (izvod(a.tekst, 110) || (a.slike.length > 1 ? 'Nove fotografije' : 'Nova fotografija'));
  const opis = a.naslov ? izvod(a.tekst, 140) : '';
  const slika = a.slike[0];
  return `<li class="akt-k card card--link" data-id="${id}" data-v="${escapeHtml(a.verzija)}">
  ${slika ? `<div class="akt-k__slika"><img src="${escapeHtml(srcSlike(slika))}" alt="" loading="lazy" decoding="async" />${a.slike.length > 1 ? `<span class="akt-k__broj">${a.slike.length} ${oblik(a.slike.length, 'slika', 'slike', 'slika')}</span>` : ''}</div>` : `<div class="akt-k__slika akt-k__slika--bez" aria-hidden="true">${AVATAR}</div>`}
  <div class="akt-k__tijelo">
    <p class="akt-k__meta">${vrijemeHTML(a.datum)}</p>
    <h3 class="card__title akt-k__naslov"><a href="${BASE}aktivnosti/#a-${id}">${escapeHtml(naslov)}</a></h3>
    ${opis && opis !== naslov ? `<p class="akt-k__opis">${escapeHtml(opis)}</p>` : ''}
  </div>
</li>`;
}

// ---------------------------------------------------------------------------------------------
// HTML: citat / hadis / ajet / pouka
// ---------------------------------------------------------------------------------------------
export const nazivVrste = (v: VrstaCitata) => VRSTE_CITATA.find((x) => x.v === v)?.naziv ?? 'Citat';

/** Tekst za dijeljenje: "tekst" — izvor */
export const citatZaDijeljenje = (c: Citat) => `„${c.tekst}“${c.izvor ? ` — ${c.izvor}` : ''}`;

/** Kartica citata. `istaknuto` = veći prikaz za početnu ("Hadis dana"…), bez sidra/id-a. */
export function citatHTML(c: Citat, opts: { istaknuto?: boolean } = {}): string {
  const id = escapeHtml(c.id);
  const vrsta = VRSTE_CITATA.find((x) => x.v === c.vrsta) ?? VRSTE_CITATA[0];
  const link = `${BASE}citati/#c-${id}`;
  const oznaka = opts.istaknuto ? vrsta.dana : vrsta.naziv;
  const tekstP = escapeHtml(c.tekst).replace(/\r\n?/g, '\n').replace(/\n{2,}/g, '\n\n').replace(/\n/g, '<br />');
  return `<li class="cit-stavka" data-id="${id}" data-v="${escapeHtml(c.verzija)}" data-vrsta="${c.vrsta}">
<figure class="cit cit--${c.vrsta}${opts.istaknuto ? ' cit--istaknuto' : ''}${c.slika ? ' cit--sa-slikom' : ''}"${opts.istaknuto ? '' : ` id="c-${id}"`}>
  ${c.slika ? `<img class="cit__slika" src="${escapeHtml(srcSlike(c.slika))}" alt="" loading="lazy" decoding="async" />` : ''}
  <div class="cit__tijelo">
    <p class="cit__glava"><span class="cit__oznaka">${escapeHtml(oznaka)}</span>${opts.istaknuto ? '' : `<a class="cit__vrijeme" href="#c-${id}">${vrijemeHTML(c.datum)}</a>`}</p>
    <blockquote class="cit__citat">
      ${c.arapski ? `<p class="cit__arapski" lang="ar" dir="rtl">${escapeHtml(c.arapski).replace(/\r?\n/g, '<br />')}</p>` : ''}
      <p class="cit__tekst">${tekstP}</p>
    </blockquote>
    <figcaption class="cit__dno">
      ${c.izvor ? `<cite class="cit__izvor">${escapeHtml(c.izvor)}</cite>` : '<span></span>'}
      <button type="button" class="btn btn--ghost btn--sm cit__dijeli" data-podijeli data-podijeli-tekst="${escapeHtml(citatZaDijeljenje(c))}" data-podijeli-naslov="${escapeHtml(vrsta.naziv)}" data-podijeli-url="${escapeHtml(link)}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg><span data-podijeli-oznaka>Podijeli</span></button>
    </figcaption>
  </div>
</figure>
</li>`;
}

// ---------------------------------------------------------------------------------------------
// Pregledač: čitanje iz baze (PostgREST, anon) i usklađivanje liste
// ---------------------------------------------------------------------------------------------
async function dohvati(putanja: string, ms = 6000): Promise<Record<string, unknown>[] | null> {
  if (!supabaseUkljucen) return null;
  try {
    const res = await fetch(restUrl(putanja), { headers: zaglavlja(), signal: AbortSignal.timeout(ms), cache: 'no-store' });
    if (!res.ok) return null; // npr. 404 dok migracija 0006 nije primijenjena → ostaje sadržaj iz builda
    const d = (await res.json()) as unknown;
    return Array.isArray(d) ? (d as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
}

/** Objavljene aktivnosti, najnovije prve (null = baza nije dostupna). */
export async function ucitajAktivnosti(limit = 200, offset = 0): Promise<Aktivnost[] | null> {
  const r = await dohvati(`${TABELE.aktivnosti}?select=${AKTIVNOSTI_SELECT}&objavljeno=eq.true&order=datum.desc,id.desc&limit=${limit}&offset=${offset}`);
  return r ? r.map(aktivnostIz).filter((a): a is Aktivnost => a !== null) : null;
}

/** Objavljeni citati, najnoviji prvi (null = baza nije dostupna). */
export async function ucitajCitate(limit = 500): Promise<Citat[] | null> {
  const r = await dohvati(`${TABELE.citati}?select=${CITATI_SELECT}&objavljeno=eq.true&order=datum.desc,id.desc&limit=${limit}`);
  return r ? r.map(citatIz).filter((c): c is Citat => c !== null) : null;
}

/**
 * Usklađuje listu sa svježim podacima iz baze: nepromijenjene stavke (isti id i verzija) ostaju
 * netaknute, izmijenjene se zamjenjuju, nove dodaju, obrisane/skrivene uklanjaju; redoslijed kao u bazi.
 * Vraća id-jeve novih stavki.
 */
export function uskladi<T extends { id: string; verzija: string }>(lista: HTMLElement, stavke: T[], html: (s: T) => string): string[] {
  const postojece = new Map<string, HTMLElement>();
  for (const e of Array.from(lista.children) as HTMLElement[]) {
    if (e.dataset.id) postojece.set(e.dataset.id, e);
    else e.remove();
  }
  const nove: string[] = [];
  const redom = stavke.map((s) => {
    const staro = postojece.get(s.id);
    postojece.delete(s.id);
    if (staro && staro.dataset.v === s.verzija) return staro;
    const t = document.createElement('template');
    t.innerHTML = html(s).trim();
    const el = t.content.firstElementChild as HTMLElement;
    if (staro) {
      el.hidden = staro.hidden;
      staro.replaceWith(el);
    } else nove.push(s.id);
    return el;
  });
  postojece.forEach((e) => e.remove());
  redom.forEach((el, i) => {
    if (lista.children[i] !== el) lista.insertBefore(el, lista.children[i] ?? null);
  });
  return nove;
}
