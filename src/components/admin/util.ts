// Zajednički pomoćnici admin panela (pregledač).
import { escapeHtml } from '../../lib/format';

export const esc = (v: unknown): string => escapeHtml(v === null || v === undefined ? '' : String(v));

export const SACUVANO =
  'Sačuvano. Nova obavještenja se odmah vide na sajtu; ostale izmjene se na sajtu pojavljuju za otprilike 15–20 minuta (automatsko osvježavanje).';

/** "Džuma — Hfz. Ćazim" → "dzuma-hfz-cazim" (ascii, mala slova, crtice). */
export function slugify(s: string, max = 80): string {
  return s
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

/** Slug imama bez titula: "Hfz. Admir ef. Jašarević" → "admir-jasarevic". */
export function slugImama(punoIme: string): string {
  const TITULE = new Set(['hfz', 'hafiz', 'ef', 'efendija', 'muftija', 'prof', 'dr', 'mr', 'h', 'hadzi', 'imam', 'sejh']);
  return slugify(punoIme)
    .split('-')
    .filter((d) => d && !TITULE.has(d))
    .join('-');
}

/** Jedinstven slug: ako "x" postoji → "x-2", "x-3"… */
export function jedinstven(slug: string, zauzeti: Set<string>): string {
  if (!zauzeti.has(slug)) return slug;
  for (let i = 2; ; i++) if (!zauzeti.has(`${slug}-${i}`)) return `${slug}-${i}`;
}

export const danas = (): string => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function datumVrijeme(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}. u ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Razumljiva poruka za grešku iz Supabase-a / mreže / fajla. */
export function porukaGreske(e: unknown): string {
  const g = (e ?? {}) as { message?: string; code?: string; status?: number; statusCode?: string | number; name?: string; hint?: string };
  const m = String(g.message ?? e ?? '');
  const kod = String(g.code ?? '');
  const st = String(g.statusCode ?? g.status ?? '');
  if (/failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(m) || g.name === 'AbortError' || g.name === 'TimeoutError')
    return 'Nema veze sa serverom. Provjerite internet i pokušajte ponovo.';
  if (/jwt expired|invalid jwt|refresh token|session.*(missing|expired)/i.test(m) || st === '401')
    return 'Sesija je istekla — odjavite se i prijavite ponovo.';
  if (kod === '42501' || /row-level security|permission denied|not authorized|unauthorized/i.test(m) || st === '403')
    return 'Nemate dozvolu za ovu izmjenu. Provjerite da ste prijavljeni kao urednik (ili administrator, za urednike).';
  if (kod === '23505' || /duplicate key/i.test(m)) return 'Već postoji zapis sa istom vrijednošću (npr. isti slug ili e-mail). Promijenite je pa pokušajte ponovo.';
  if (kod === '23514' || /check constraint/i.test(m)) return 'Neka vrijednost nije u dozvoljenom obliku (prekratka, preduga ili pogrešan format).';
  if (kod === '23502') return 'Nije popunjeno obavezno polje.';
  if (kod === '23503') return 'Zapis je povezan sa drugim podacima i ne može se tako promijeniti.';
  if (kod === 'P0001') return m.replace(/^.*?:\s*/, '') || 'Izmjena nije dozvoljena.';
  if (st === '413' || /exceeded the maximum allowed size|payload too large|entity too large/i.test(m)) return 'Slika je prevelika (najviše 5 MB).';
  if (/mime type|invalid_mime_type|not supported/i.test(m) && /image|mime/i.test(m)) return 'Format slike nije dozvoljen (dozvoljeno: JPG, PNG, WebP).';
  if (/email address not authorized/i.test(m))
    return 'Server trenutno ne može slati e-mail na ovu adresu (nije podešen vlastiti SMTP). Javite se administratoru sajta.';
  if (/rate limit|too many requests|over_email_send_rate_limit|security purposes/i.test(m) || st === '429')
    return 'Previše pokušaja u kratkom vremenu. Sačekajte nekoliko minuta pa pokušajte ponovo.';
  if (/signups not allowed|user not found/i.test(m)) return 'Ova adresa nema nalog. Zamolite administratora da vas pozove.';
  if (/token has expired|otp.*(expired|invalid)|invalid.*otp/i.test(m)) return 'Kod je neispravan ili je istekao. Zatražite novi.';
  if (/Could not find the table|schema cache|PGRST205/i.test(m)) return 'Tabela još ne postoji u bazi (migracije nisu primijenjene — za programe, kartice, transkripte i dodane videe treba 0005, vidi docs/supabase.md).';
  return m || 'Došlo je do neočekivane greške.';
}

export type VrstaPoruke = 'info' | 'uspjeh' | 'greska';

/** Poruka u live regiji (role=status / alert). */
export function poruka(el: HTMLElement | null, tekst: string, vrsta: VrstaPoruke = 'info') {
  if (!el) return;
  el.textContent = tekst;
  el.dataset.vrsta = vrsta;
  el.hidden = !tekst;
  el.setAttribute('role', vrsta === 'greska' ? 'alert' : 'status');
}

/** Globalna obavijest na dnu ekrana. */
let toastTimer: number | undefined;
export function toast(tekst: string, vrsta: VrstaPoruke = 'uspjeh', ms = 7000) {
  const el = document.getElementById('adm-toast');
  if (!el) return;
  poruka(el, tekst, vrsta);
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), vrsta === 'greska' ? ms * 2 : ms);
}

export const potvrdi = (tekst: string): boolean => window.confirm(tekst);

/** Dugme u stanju "radi…" dok traje akcija; vraća rezultat akcije. */
export async function uToku<T>(btn: HTMLButtonElement | null, tekst: string, fn: () => Promise<T>): Promise<T> {
  const staro = btn?.textContent ?? '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = tekst;
    btn.setAttribute('aria-busy', 'true');
  }
  try {
    return await fn();
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = staro;
      btn.removeAttribute('aria-busy');
    }
  }
}

/** CSV (separator ';' — Excel u našem regionu) sa BOM-om za ispravna slova č, ć, š, ž, đ. */
export function csv(redovi: Record<string, unknown>[], kolone: { k: string; l: string }[]): string {
  const polje = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linije = [kolone.map((c) => polje(c.l)).join(';'), ...redovi.map((r) => kolone.map((c) => polje(r[c.k])).join(';'))];
  return '﻿' + linije.join('\r\n');
}

export function preuzmi(ime: string, sadrzaj: string, tip = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([sadrzaj], { type: tip }));
  const a = document.createElement('a');
  a.href = url;
  a.download = ime;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Tekst za pretragu bez dijakritika. */
export const norm = (s: unknown): string =>
  String(s ?? '')
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export const odgovara = (indeks: string, upit: string): boolean =>
  norm(upit)
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => indeks.includes(w));

let brojac = 0;
export const noviId = (prefiks = 'adm'): string => `${prefiks}-${++brojac}`;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | undefined> = {},
  ...djeca: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') e.className = String(v);
    else if (k === 'text') e.textContent = String(v);
    else if (k === 'html') e.innerHTML = String(v);
    else e.setAttribute(k, v === true ? '' : String(v));
  }
  for (const d of djeca) if (d !== null && d !== undefined && d !== false) e.append(d);
  return e;
}
