// Generičke kontrole forme: od opisa polja pravi pristupačna polja (label, pomoć, greška),
// čita/postavlja vrijednosti (i ugniježđene ključeve "kontakt.email"), provjerava obavezna polja.
import { otpremiSliku, ukloniSliku } from './slike';
import type { SB } from './sb';
import { el, noviId, porukaGreske, slugify } from './util';

export interface Opcija {
  v: string;
  t: string;
}

export type TipPolja =
  | 'text' | 'textarea' | 'email' | 'url' | 'tel' | 'broj' | 'datum' | 'checkbox' | 'select'
  | 'lista' // text[] — jedna stavka po redu
  | 'paragrafi' // text[] — paragrafi odvojeni praznim redom
  | 'slika' // URL slike + upload
  | 'niz'; // niz objekata (podPolja), sa dodavanjem/brisanjem/redoslijedom

export interface Polje {
  k: string;
  l: string;
  t: TipPolja;
  pomoc?: string;
  obavezno?: boolean;
  max?: number;
  min?: number;
  korak?: number;
  redovi?: number;
  opcije?: Opcija[] | (() => Opcija[]);
  slobodno?: boolean; // select + "Drugo…" (slobodan unos)
  podPolja?: Polje[];
  dodajTekst?: string;
  zakljucanoPriIzmjeni?: boolean; // npr. slug postojećeg zapisa
  folder?: string; // folder u bucketu za 'slika'
  pola?: boolean; // pola širine na većim ekranima
  rtl?: boolean; // arapski tekst
  placeholder?: string;
  prazanString?: boolean; // prazno = '' umjesto null
}

export interface KontekstForme {
  klijent: () => Promise<SB>;
  /** URL-ovi slika otpremljenih tokom uređivanja (da se obrišu ako se izmjena otkaže). */
  otpremljene: Set<string>;
}

interface Kontrola {
  p: Polje;
  omot: HTMLElement;
  get(): unknown;
  set(v: unknown): void;
  provjeri(): string | null;
  greska(msg: string | null): void;
  fokus(): void;
  ulaz?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
}

const getPath = (o: Record<string, unknown> | null | undefined, k: string): unknown =>
  k.split('.').reduce<unknown>((a, d) => (a && typeof a === 'object' ? (a as Record<string, unknown>)[d] : undefined), o);

function setPath(o: Record<string, unknown>, k: string, v: unknown) {
  const d = k.split('.');
  let t = o;
  for (const x of d.slice(0, -1)) {
    if (!t[x] || typeof t[x] !== 'object' || Array.isArray(t[x])) t[x] = {};
    t = t[x] as Record<string, unknown>;
  }
  t[d[d.length - 1]] = v;
}

const opcijeOd = (p: Polje): Opcija[] => (typeof p.opcije === 'function' ? p.opcije() : p.opcije ?? []);

function omotac(p: Polje, id: string, ulaz: HTMLElement | null, extra?: HTMLElement) {
  const pomocId = `${id}-pomoc`;
  const greskaId = `${id}-greska`;
  const omot = el('div', { class: `field adm-polje${p.pola ? ' adm-polje--pola' : ''}` });
  if (p.t !== 'checkbox') {
    omot.append(el('label', { for: id, text: p.l + (p.obavezno ? ' *' : '') }));
  }
  if (ulaz) omot.append(ulaz);
  if (extra) omot.append(extra);
  const pomoc = p.pomoc ? el('p', { class: 'adm-pomoc', id: pomocId, text: p.pomoc }) : null;
  if (pomoc) omot.append(pomoc);
  const gr = el('p', { class: 'adm-greska', id: greskaId, hidden: true });
  omot.append(gr);
  const opisano = [pomoc ? pomocId : '', greskaId].filter(Boolean).join(' ');
  return { omot, gr, opisano };
}

function napraviKontrolu(p: Polje, ctx: KontekstForme, jeNovo: boolean): Kontrola {
  const id = noviId('polje');
  const zakljucano = !!p.zakljucanoPriIzmjeni && !jeNovo;

  if (p.t === 'niz') return napraviNiz(p, ctx);
  if (p.t === 'slika') return napraviSliku(p, ctx, id);

  if (p.t === 'checkbox') {
    const ulaz = el('input', { type: 'checkbox', id }) as HTMLInputElement;
    const lab = el('label', { class: 'adm-check', for: id }, ulaz, ' ' + p.l);
    const { omot, gr, opisano } = omotac(p, id, lab);
    ulaz.setAttribute('aria-describedby', opisano);
    return {
      p, omot, ulaz,
      get: () => ulaz.checked,
      set: (v) => (ulaz.checked = v === true),
      provjeri: () => null,
      greska: (m) => postaviGresku(ulaz, gr, m),
      fokus: () => ulaz.focus(),
    };
  }

  if (p.t === 'select') {
    const sel = el('select', { id, class: 'select' }) as HTMLSelectElement;
    const napuni = () => {
      const tren = sel.value;
      sel.replaceChildren(...opcijeOd(p).map((o) => el('option', { value: o.v, text: o.t })));
      if (p.slobodno) sel.append(el('option', { value: '__drugo', text: 'Drugo (upišite)…' }));
      if (tren) sel.value = tren;
    };
    napuni();
    const drugo = p.slobodno ? (el('input', { class: 'input', type: 'text', 'aria-label': `${p.l} — drugo`, placeholder: 'Upišite naziv', hidden: true, maxlength: p.max ? String(p.max) : undefined }) as HTMLInputElement) : undefined;
    if (drugo) sel.addEventListener('change', () => {
      drugo.hidden = sel.value !== '__drugo';
      if (!drugo.hidden) drugo.focus();
    });
    const { omot, gr, opisano } = omotac(p, id, sel, drugo);
    sel.setAttribute('aria-describedby', opisano);
    if (p.obavezno) sel.required = true;
    if (zakljucano) sel.disabled = true;
    return {
      p, omot, ulaz: sel,
      get: () => {
        const v = sel.value === '__drugo' ? (drugo?.value.trim() ?? '') : sel.value;
        return v === '' ? (p.prazanString ? '' : null) : v;
      },
      set: (v) => {
        napuni();
        const s = v === null || v === undefined ? '' : String(v);
        if (Array.from(sel.options).some((o) => o.value === s)) {
          sel.value = s;
          if (drugo) drugo.hidden = true;
        } else if (p.slobodno && drugo) {
          sel.value = '__drugo';
          drugo.hidden = false;
          drugo.value = s;
        } else {
          sel.append(el('option', { value: s, text: s }));
          sel.value = s;
        }
      },
      provjeri: () => {
        const v = sel.value === '__drugo' ? drugo?.value.trim() : sel.value;
        return p.obavezno && !v ? 'Izaberite vrijednost.' : null;
      },
      greska: (m) => postaviGresku(sel, gr, m),
      fokus: () => (sel.value === '__drugo' && drugo ? drugo.focus() : sel.focus()),
    };
  }

  const jeTekst = p.t === 'textarea' || p.t === 'lista' || p.t === 'paragrafi';
  const ulaz = jeTekst
    ? (el('textarea', { id, class: 'textarea', rows: String(p.redovi ?? (p.t === 'paragrafi' ? 8 : 4)) }) as HTMLTextAreaElement)
    : (el('input', {
        id,
        class: 'input',
        type: { email: 'email', url: 'url', tel: 'tel', broj: 'number', datum: 'date' }[p.t as string] ?? 'text',
        autocomplete: 'off',
      }) as HTMLInputElement);
  if (p.max && p.t !== 'broj') ulaz.maxLength = p.max;
  if (p.t === 'broj') {
    if (p.min !== undefined) (ulaz as HTMLInputElement).min = String(p.min);
    if (p.max !== undefined) (ulaz as HTMLInputElement).max = String(p.max);
    (ulaz as HTMLInputElement).step = String(p.korak ?? 1);
    ulaz.setAttribute('inputmode', 'numeric');
  }
  if (p.placeholder) ulaz.placeholder = p.placeholder;
  if (p.rtl) {
    ulaz.dir = 'rtl';
    ulaz.lang = 'ar';
    ulaz.classList.add('adm-arapski');
  }
  if (p.obavezno) ulaz.required = true;
  if (zakljucano) ulaz.readOnly = true;
  const { omot, gr, opisano } = omotac(p, id, ulaz);
  ulaz.setAttribute('aria-describedby', opisano);

  return {
    p, omot, ulaz,
    get: () => {
      const s = ulaz.value;
      if (p.t === 'lista') return s.split('\n').map((x) => x.trim()).filter(Boolean);
      if (p.t === 'paragrafi') return s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
      if (p.t === 'broj') return s.trim() === '' ? null : Number(s);
      const t = s.trim();
      return t === '' ? (p.prazanString ? '' : null) : p.t === 'email' ? t.toLowerCase() : t;
    },
    set: (v) => {
      if (p.t === 'lista') ulaz.value = Array.isArray(v) ? v.join('\n') : '';
      else if (p.t === 'paragrafi') ulaz.value = Array.isArray(v) ? v.join('\n\n') : typeof v === 'string' ? v : '';
      else ulaz.value = v === null || v === undefined ? '' : String(v);
    },
    provjeri: () => {
      const s = ulaz.value.trim();
      if (p.obavezno && !s) return 'Ovo polje je obavezno.';
      if (s && 'validity' in ulaz && !ulaz.validity.valid) {
        if (p.t === 'email') return 'Unesite ispravnu e-mail adresu.';
        if (p.t === 'url') return 'Unesite punu adresu koja počinje sa https://';
        if (p.t === 'broj') return `Unesite broj${p.min !== undefined ? ` od ${p.min}` : ''}${p.max !== undefined ? ` do ${p.max}` : ''}.`;
        return 'Vrijednost nije ispravna.';
      }
      return null;
    },
    greska: (m) => postaviGresku(ulaz, gr, m),
    fokus: () => ulaz.focus(),
  };
}

function postaviGresku(ulaz: HTMLElement, gr: HTMLElement, m: string | null) {
  gr.textContent = m ?? '';
  gr.hidden = !m;
  if (m) ulaz.setAttribute('aria-invalid', 'true');
  else ulaz.removeAttribute('aria-invalid');
}

function napraviSliku(p: Polje, ctx: KontekstForme, id: string): Kontrola {
  const url = el('input', { id, class: 'input', type: 'text', inputmode: 'url', placeholder: 'https://… ili /images/…', autocomplete: 'off' }) as HTMLInputElement;
  const pregled = el('img', { class: 'adm-slika__pregled', alt: '', hidden: true }) as HTMLImageElement;
  const fajlId = `${id}-fajl`;
  const fajl = el('input', { type: 'file', id: fajlId, accept: 'image/jpeg,image/png,image/webp,image/*', class: 'visually-hidden' }) as HTMLInputElement;
  const izaberi = el('label', { for: fajlId, class: 'btn btn--ghost btn--sm', text: 'Izaberi sliku…' });
  const ukloni = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Ukloni sliku', hidden: true }) as HTMLButtonElement;
  const stanje = el('p', { class: 'adm-pomoc', role: 'status' });
  const red = el('div', { class: 'adm-slika__dugmad' }, fajl, izaberi, ukloni);
  const extra = el('div', { class: 'adm-slika' }, pregled, red, stanje);
  const { omot, gr, opisano } = omotac({ ...p, pomoc: p.pomoc ?? 'Slika se automatski smanjuje (najviše 1600 px) i pretvara u WebP. Dozvoljeno: JPG, PNG, WebP.' }, id, url, extra);
  url.setAttribute('aria-describedby', opisano);

  const osvjezi = () => {
    const v = url.value.trim();
    const src = !v ? '' : /^https?:\/\//.test(v) ? v : `${import.meta.env.BASE_URL.replace(/\/$/, '')}${v.startsWith('/') ? v : `/${v}`}`;
    pregled.hidden = !src;
    if (src) pregled.src = src;
    else pregled.removeAttribute('src');
    ukloni.hidden = !v;
  };
  url.addEventListener('change', osvjezi);
  ukloni.addEventListener('click', () => {
    url.value = '';
    osvjezi();
    stanje.textContent = 'Slika će biti uklonjena kada sačuvate.';
  });
  fajl.addEventListener('change', async () => {
    const f = fajl.files?.[0];
    if (!f) return;
    izaberi.setAttribute('aria-disabled', 'true');
    stanje.textContent = 'Smanjujem i otpremam sliku…';
    try {
      const javni = await otpremiSliku(await ctx.klijent(), f, p.folder ?? 'ostalo');
      // ranije otpremljena (nesačuvana) slika u ovoj izmjeni više nije potrebna
      const prethodna = url.value.trim();
      if (prethodna && ctx.otpremljene.has(prethodna)) {
        ctx.otpremljene.delete(prethodna);
        void ukloniSliku(await ctx.klijent(), prethodna);
      }
      ctx.otpremljene.add(javni);
      url.value = javni;
      osvjezi();
      stanje.textContent = 'Slika je otpremljena. Sačuvajte izmjene.';
      postaviGresku(url, gr, null);
    } catch (e) {
      stanje.textContent = '';
      postaviGresku(url, gr, porukaGreske(e));
    } finally {
      izaberi.removeAttribute('aria-disabled');
      fajl.value = '';
    }
  });

  return {
    p, omot, ulaz: url,
    get: () => url.value.trim() || null,
    set: (v) => {
      url.value = typeof v === 'string' ? v : '';
      stanje.textContent = '';
      osvjezi();
    },
    provjeri: () => (p.obavezno && !url.value.trim() ? 'Dodajte sliku.' : null),
    greska: (m) => postaviGresku(url, gr, m),
    fokus: () => url.focus(),
  };
}

function napraviNiz(p: Polje, ctx: KontekstForme): Kontrola {
  const stavkeEl = el('ol', { class: 'adm-niz__stavke' });
  const dodajBtn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: p.dodajTekst ?? '+ Dodaj stavku' }) as HTMLButtonElement;
  const omot = el('fieldset', { class: 'adm-niz' }, el('legend', { text: p.l }));
  if (p.pomoc) omot.append(el('p', { class: 'adm-pomoc', text: p.pomoc }));
  const gr = el('p', { class: 'adm-greska', hidden: true });
  omot.append(stavkeEl, dodajBtn, gr);
  const stavke: { li: HTMLElement; forma: Forma }[] = [];

  const prerenumerisi = () => {
    stavke.forEach((s, i) => {
      s.li.querySelector('.adm-niz__broj')!.textContent = `${i + 1}.`;
      const [gore, dolje] = Array.from(s.li.querySelectorAll<HTMLButtonElement>('[data-niz-pomjeri]'));
      gore.disabled = i === 0;
      dolje.disabled = i === stavke.length - 1;
      gore.setAttribute('aria-label', `Pomjeri stavku ${i + 1} gore`);
      dolje.setAttribute('aria-label', `Pomjeri stavku ${i + 1} dolje`);
      s.li.querySelector('[data-niz-ukloni]')!.setAttribute('aria-label', `Ukloni stavku ${i + 1}`);
    });
  };
  const dodaj = (vr: Record<string, unknown> = {}, fokus = false) => {
    const forma = new Forma(p.podPolja ?? [], ctx, true);
    forma.postavi(vr);
    const gore = el('button', { type: 'button', class: 'adm-ikona', 'data-niz-pomjeri': 'gore', text: '↑' }) as HTMLButtonElement;
    const dolje = el('button', { type: 'button', class: 'adm-ikona', 'data-niz-pomjeri': 'dolje', text: '↓' }) as HTMLButtonElement;
    const ukloni = el('button', { type: 'button', class: 'adm-ikona adm-ikona--opasno', 'data-niz-ukloni': '', text: '✕' }) as HTMLButtonElement;
    const li = el('li', { class: 'adm-niz__stavka' }, el('div', { class: 'adm-niz__alati' }, el('span', { class: 'adm-niz__broj' }), gore, dolje, ukloni), forma.el);
    const s = { li, forma };
    stavke.push(s);
    stavkeEl.append(li);
    gore.addEventListener('click', () => pomjeri(s, -1));
    dolje.addEventListener('click', () => pomjeri(s, 1));
    ukloni.addEventListener('click', () => {
      const i = stavke.indexOf(s);
      stavke.splice(i, 1);
      li.remove();
      prerenumerisi();
      (stavke[Math.min(i, stavke.length - 1)]?.li.querySelector<HTMLElement>('[data-niz-ukloni]') ?? dodajBtn).focus();
    });
    prerenumerisi();
    if (fokus) forma.fokusPrvo();
  };
  const pomjeri = (s: { li: HTMLElement; forma: Forma }, smjer: number) => {
    const i = stavke.indexOf(s);
    const j = i + smjer;
    if (j < 0 || j >= stavke.length) return;
    [stavke[i], stavke[j]] = [stavke[j], stavke[i]];
    stavke.forEach((x) => stavkeEl.append(x.li));
    prerenumerisi();
    s.li.querySelector<HTMLButtonElement>(`[data-niz-pomjeri="${smjer < 0 ? 'gore' : 'dolje'}"]`)?.focus();
  };
  dodajBtn.addEventListener('click', () => dodaj({}, true));

  return {
    p, omot,
    get: () =>
      stavke
        .map((s) => s.forma.procitaj())
        .filter((o) => Object.values(o).some((v) => v !== null && v !== '' && v !== false && !(Array.isArray(v) && !v.length))),
    set: (v) => {
      stavke.splice(0).forEach((s) => s.li.remove());
      (Array.isArray(v) ? v : []).forEach((x) => dodaj(x && typeof x === 'object' ? (x as Record<string, unknown>) : {}));
    },
    provjeri: () => {
      let ok = true;
      for (const s of stavke) {
        const prazno = !Object.values(s.forma.procitaj()).some((x) => x !== null && x !== '' && x !== false);
        if (!prazno && !s.forma.provjeri()) ok = false;
      }
      return ok ? null : 'Provjerite označena polja u stavkama.';
    },
    greska: (m) => {
      gr.textContent = m ?? '';
      gr.hidden = !m;
    },
    fokus: () => (stavke[0]?.forma.fokusPrvo() ?? dodajBtn.focus()),
  };
}

export class Forma {
  readonly el: HTMLElement;
  private kontrole: Kontrola[];
  private auto = new Map<string, string>(); // poslednja automatski izvedena vrijednost (slug)

  constructor(polja: Polje[], ctx: KontekstForme, private jeNovo: boolean) {
    this.el = el('div', { class: 'adm-forma__polja' });
    this.kontrole = polja.map((p) => napraviKontrolu(p, ctx, jeNovo));
    this.kontrole.forEach((k) => this.el.append(k.omot));
  }

  kontrola(k: string) {
    return this.kontrole.find((x) => x.p.k === k);
  }

  /** Automatski popunjava `cilj` iz `izvor` dok ga korisnik ručno ne promijeni (samo za nove zapise). */
  autoIz(izvor: string, cilj: string, fn: (s: string) => string = slugify) {
    const a = this.kontrola(izvor)?.ulaz;
    const b = this.kontrola(cilj)?.ulaz;
    if (!a || !b || !this.jeNovo) return;
    a.addEventListener('input', () => {
      if (b.value === '' || b.value === this.auto.get(cilj)) {
        const v = fn(a.value);
        b.value = v;
        this.auto.set(cilj, v);
      }
    });
  }

  postavi(obj: Record<string, unknown> | null | undefined) {
    for (const k of this.kontrole) k.set(getPath(obj ?? {}, k.p.k));
  }

  procitaj(): Record<string, unknown> {
    const o: Record<string, unknown> = {};
    for (const k of this.kontrole) setPath(o, k.p.k, k.get());
    return o;
  }

  /** Provjera; prikazuje greške uz polja i fokusira prvo neispravno. */
  provjeri(): boolean {
    let prvo: Kontrola | null = null;
    for (const k of this.kontrole) {
      const m = k.provjeri();
      k.greska(m);
      if (m && !prvo) prvo = k;
    }
    if (prvo) prvo.fokus();
    return !prvo;
  }

  greska(k: string, poruka: string) {
    const c = this.kontrola(k);
    c?.greska(poruka);
    c?.fokus();
  }

  fokusPrvo() {
    this.kontrole[0]?.fokus();
  }
}

export { getPath, setPath };
