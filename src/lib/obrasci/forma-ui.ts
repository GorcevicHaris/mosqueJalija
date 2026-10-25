// Zajednička logika javnih obrazaca u pregledniku: provjera polja, pristupačne greške uz polje,
// sažetak grešaka, stanja učitavanja / uspjeha / greške i slanje u Supabase.
import { unesi, type VrstaGreske } from './supabase-rest';
import { MIN_VRIJEME_MS, jeBot, provjeriOgranicenje, startMjerenja, zabiljeziSlanje } from './zastita';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Polje = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface Pravilo {
  /** name atribut polja */
  ime: string;
  /** naziv za sažetak grešaka */
  naziv: string;
  /** vraća tekst greške ili '' */
  provjera: (vrijednost: string, polje: Polje) => string;
}

export interface OpcijeObrasca {
  form: HTMLFormElement;
  /** ključ za ograničenje po pregledniku i ime tabele */
  tabela: string;
  pravila: Pravilo[];
  /** sastavlja red za bazu (samo dozvoljene kolone!) */
  red: () => Record<string, unknown>;
  /** tekst nakon uspješnog slanja */
  uspjeh: string;
  /** dodatne provjere (npr. saglasnost) — vraća listu grešaka */
  dodatno?: () => { el: Polje; naziv: string; greska: string }[];
  /** poziva se nakon uspjeha (npr. reset dodatnih elemenata) */
  poslije?: () => void;
}

const vrijednost = (el: Polje) => (el instanceof HTMLInputElement && el.type === 'checkbox' ? (el.checked ? 'da' : '') : el.value.trim());

export function obrazac(o: OpcijeObrasca) {
  const { form } = o;
  const summary = form.querySelector<HTMLElement>('[data-ob-summary]')!;
  const status = form.querySelector<HTMLElement>('[data-ob-status]')!;
  const submit = form.querySelector<HTMLButtonElement>('[data-ob-submit]')!;
  const fallback = form.querySelector<HTMLElement>('[data-ob-fallback]');
  const uspjehEl = form.parentElement?.querySelector<HTMLElement>(`[data-ob-uspjeh="${form.id}"]`) ?? null;
  const proteklo = startMjerenja();
  const dodirnuto = new Set<string>();
  const el = (n: string) => form.elements.namedItem(n) as Polje;

  function errEl(p: Polje) {
    return form.querySelector<HTMLElement>(`[data-ob-err="${p.name}"]`);
  }

  function prikazi(p: Polje, g: string) {
    const e = errEl(p);
    if (e) e.textContent = g;
    if (g) p.setAttribute('aria-invalid', 'true');
    else p.removeAttribute('aria-invalid');
  }

  function provjeri(pr: Pravilo): string {
    const p = el(pr.ime);
    if (!p) return '';
    // sakrivena polja (npr. roditelj kad je kandidat odrasla osoba) se ne provjeravaju
    if (p.closest('[hidden]')) {
      prikazi(p, '');
      return '';
    }
    const g = pr.provjera(vrijednost(p), p);
    prikazi(p, g);
    return g;
  }

  for (const pr of o.pravila) {
    const p = el(pr.ime);
    if (!p) continue;
    p.addEventListener('blur', () => {
      if (vrijednost(p)) dodirnuto.add(pr.ime);
      if (dodirnuto.has(pr.ime)) provjeri(pr);
    });
    p.addEventListener(p instanceof HTMLSelectElement || (p as HTMLInputElement).type === 'checkbox' ? 'change' : 'input', () => {
      if (dodirnuto.has(pr.ime) || p.getAttribute('aria-invalid')) provjeri(pr);
    });
  }

  // brojači znakova
  form.querySelectorAll<HTMLElement>('[data-ob-brojac]').forEach((b) => {
    const p = el(b.dataset.obBrojac!);
    if (!p) return;
    const azuriraj = () => (b.textContent = String(p.value.length));
    p.addEventListener('input', azuriraj);
    azuriraj();
  });

  function postaviStatus(tip: 'ok' | 'greska' | 'info' | '', tekst: string) {
    status.dataset.tip = tip;
    status.textContent = tekst;
  }

  function sazetak(greske: { el: Polje; naziv: string; greska: string }[]) {
    summary.innerHTML = '';
    if (!greske.length) {
      summary.hidden = true;
      return;
    }
    summary.hidden = false;
    const naslov = document.createElement('p');
    naslov.textContent = greske.length === 1 ? 'Ispravite jedno polje:' : `Ispravite ${greske.length} polja:`;
    const ul = document.createElement('ul');
    for (const g of greske) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#${g.el.id}`;
      a.textContent = `${g.naziv}: ${g.greska}`;
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        g.el.focus();
      });
      li.append(a);
      ul.append(li);
    }
    summary.append(naslov, ul);
    greske[0].el.focus();
  }

  function zauzeto(da: boolean) {
    submit.disabled = da;
    submit.setAttribute('aria-busy', String(da));
    form.setAttribute('aria-busy', String(da));
    const t = submit.querySelector<HTMLElement>('[data-ob-submit-tekst]');
    if (t) {
      t.dataset.staro ??= t.textContent ?? '';
      t.textContent = da ? 'Šaljem…' : t.dataset.staro;
    }
  }

  function pokaziFallback(vrsta: VrstaGreske | null) {
    if (fallback) fallback.hidden = vrsta === null || vrsta === 'validacija';
  }

  function uspjelo() {
    form.reset();
    dodirnuto.clear();
    form.querySelectorAll<HTMLElement>('[data-ob-brojac]').forEach((b) => (b.textContent = '0'));
    form.querySelectorAll('[aria-invalid]').forEach((x) => x.removeAttribute('aria-invalid'));
    o.poslije?.();
    if (uspjehEl) {
      const tekst = uspjehEl.querySelector<HTMLElement>('[data-ob-uspjeh-tekst]');
      if (tekst) tekst.textContent = o.uspjeh;
      form.hidden = true;
      uspjehEl.hidden = false;
      uspjehEl.focus();
    } else {
      postaviStatus('ok', o.uspjeh);
    }
  }

  // "Pošalji novu poruku" na kartici uspjeha
  uspjehEl?.querySelector<HTMLButtonElement>('[data-ob-ponovo]')?.addEventListener('click', () => {
    uspjehEl.hidden = true;
    form.hidden = false;
    postaviStatus('', '');
    form.querySelector<HTMLElement>('input:not([type=hidden]):not([tabindex="-1"]), select, textarea')?.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    postaviStatus('', '');
    pokaziFallback(null);

    const greske: { el: Polje; naziv: string; greska: string }[] = [];
    for (const pr of o.pravila) {
      dodirnuto.add(pr.ime);
      const g = provjeri(pr);
      if (g) greske.push({ el: el(pr.ime), naziv: pr.naziv, greska: g });
    }
    greske.push(...(o.dodatno?.() ?? []));
    sazetak(greske);
    if (greske.length) return;

    // zamka za botove: tiho "uspješno", ništa se ne šalje
    if (jeBot(form)) {
      uspjelo();
      return;
    }
    if (proteklo() < MIN_VRIJEME_MS) {
      postaviStatus('info', 'Obrazac je poslan prebrzo. Provjerite podatke i pritisnite dugme ponovo.');
      return;
    }
    const limit = provjeriOgranicenje(o.tabela);
    if (limit) {
      postaviStatus('info', limit);
      return;
    }

    zauzeto(true);
    postaviStatus('info', 'Šaljem…');
    const r = await unesi(o.tabela, o.red());
    zauzeto(false);
    if (r.ok) {
      zabiljeziSlanje(o.tabela);
      postaviStatus('', '');
      uspjelo();
      return;
    }
    postaviStatus('greska', r.poruka);
    pokaziFallback(r.vrsta);
    status.focus();
  });

  return { el, postaviStatus };
}

/** Prazan string → null (za neobavezne kolone). */
export const iliNull = (s: string) => (s.trim() ? s.trim() : null);
