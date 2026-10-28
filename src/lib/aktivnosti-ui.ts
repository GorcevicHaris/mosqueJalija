// Ponašanje u pregledaču za aktivnosti i citate: relativno vrijeme, "Prikaži više", lightbox
// (tastatura, Esc, prevlačenje na telefonu) i dugme "Podijeli" (Web Share ili kopiranje).
// Sve je preko delegiranja događaja, pa radi i za stavke koje skripta doda poslije učitavanja.
import { prijeKoliko } from './aktivnosti';
import { kopirajTekst } from './kopiraj';

/** "prije 2 dana" u svim <time data-rel> unutar root-a (pun datum ostaje u title). */
export function osvjeziVremena(root: ParentNode = document) {
  const sada = Date.now();
  root.querySelectorAll<HTMLTimeElement>('time[data-rel]').forEach((t) => {
    const r = prijeKoliko(t.dateTime, sada);
    if (r && t.textContent !== r) t.textContent = r;
  });
}

let vremenaPokrenuta = false;
/** Osvježava relativna vremena odmah i svake minute. */
export function pokreniVremena() {
  osvjeziVremena();
  if (vremenaPokrenuta) return;
  vremenaPokrenuta = true;
  window.setInterval(() => osvjeziVremena(), 60_000);
}

/** Dugi tekstovi se skraćuju (bez JS-a ostaju puni) uz dugme "Prikaži više". */
export function pripremiSklapanje(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('.akt__tekst[data-dugo]:not([data-sklopivo])').forEach((t) => {
    t.dataset.sklopivo = '';
    const b = t.parentElement?.querySelector<HTMLButtonElement>(`[data-akt-vise][aria-controls="${CSS.escape(t.id)}"]`);
    if (!b) return;
    t.classList.add('je-sklopljeno');
    b.hidden = false;
    b.setAttribute('aria-expanded', 'false');
    b.textContent = 'Prikaži više';
  });
}

let povezano = false;
/** Jednom po stranici: klikovi na "Prikaži više", slike (lightbox) i "Podijeli". */
export function poveziPonasanje() {
  if (povezano) return;
  povezano = true;
  document.addEventListener('click', (e) => {
    const cilj = e.target as HTMLElement;
    const vise = cilj.closest<HTMLButtonElement>('[data-akt-vise]');
    if (vise) {
      const t = document.getElementById(vise.getAttribute('aria-controls') ?? '');
      if (!t) return;
      const otvori = t.classList.contains('je-sklopljeno');
      t.classList.toggle('je-sklopljeno', !otvori);
      vise.setAttribute('aria-expanded', String(otvori));
      vise.textContent = otvori ? 'Prikaži manje' : 'Prikaži više';
      if (!otvori) t.closest('article')?.scrollIntoView({ block: 'nearest' });
      return;
    }
    const slika = cilj.closest<HTMLButtonElement>('[data-akt-slika]');
    if (slika) {
      const grupa = slika.closest<HTMLElement>('[data-slike]');
      let slike: string[] = [];
      try {
        slike = JSON.parse(grupa?.dataset.slike ?? '[]');
      } catch {
        /* neispravno */
      }
      if (slike.length) otvoriLightbox(slike, Number(slika.dataset.aktSlika) || 0, grupa?.dataset.opis ?? '', slika);
      return;
    }
    const dijeli = cilj.closest<HTMLButtonElement>('[data-podijeli]');
    if (dijeli) void podijeli(dijeli);
  });
}

// ---------------------------------------------------------------------------------------------
// Podijeli
// ---------------------------------------------------------------------------------------------
async function podijeli(b: HTMLButtonElement) {
  const url = new URL(b.dataset.podijeliUrl ?? location.href, location.href).href;
  const tekst = b.dataset.podijeliTekst ?? '';
  const naslov = b.dataset.podijeliNaslov ?? document.title;
  const oznaka = b.querySelector<HTMLElement>('[data-podijeli-oznaka]') ?? b;
  const javi = (t: string) => {
    oznaka.textContent = t;
    window.setTimeout(() => (oznaka.textContent = 'Podijeli'), 2200);
  };
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: naslov, text: tekst || naslov, url });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // korisnik je odustao
    }
  }
  const ok = await kopirajTekst(tekst ? `${tekst}\n${url}` : url);
  javi(ok ? (tekst ? 'Kopirano ✓' : 'Link kopiran ✓') : 'Kopiranje nije uspjelo');
}

// ---------------------------------------------------------------------------------------------
// Lightbox
// ---------------------------------------------------------------------------------------------
const IKONA = (d: string) =>
  `<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;

let dlg: HTMLDialogElement | null = null;
let lbSlike: string[] = [];
let lbIdx = 0;
let lbOpis = '';
let lbOtvarac: HTMLElement | null = null;

function napraviLightbox(): HTMLDialogElement {
  const d = document.createElement('dialog');
  d.className = 'akt-lb';
  d.setAttribute('aria-label', 'Pregled slike');
  d.innerHTML = `<div class="akt-lb__okvir">
    <p class="akt-lb__broj" aria-live="polite" data-lb-broj></p>
    <button type="button" class="akt-lb__dugme akt-lb__zatvori" data-lb-zatvori aria-label="Zatvori (Esc)">${IKONA('M18 6 6 18M6 6l12 12')}</button>
    <button type="button" class="akt-lb__dugme akt-lb__nav akt-lb__nav--pret" data-lb-pret aria-label="Prethodna slika">${IKONA('m15 18-6-6 6-6')}</button>
    <figure class="akt-lb__slika"><img data-lb-img alt="" /></figure>
    <button type="button" class="akt-lb__dugme akt-lb__nav akt-lb__nav--sled" data-lb-sled aria-label="Sljedeća slika">${IKONA('m9 18 6-6-6-6')}</button>
  </div>`;
  document.body.append(d);
  const img = d.querySelector<HTMLImageElement>('[data-lb-img]')!;
  d.querySelector('[data-lb-zatvori]')!.addEventListener('click', () => d.close());
  d.querySelector('[data-lb-pret]')!.addEventListener('click', () => prikazi(lbIdx - 1));
  d.querySelector('[data-lb-sled]')!.addEventListener('click', () => prikazi(lbIdx + 1));
  d.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === d || t.classList.contains('akt-lb__okvir') || t.classList.contains('akt-lb__slika')) d.close();
  });
  d.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prikazi(lbIdx - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      prikazi(lbIdx + 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      prikazi(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      prikazi(lbSlike.length - 1);
    }
  });
  // prevlačenje prstom lijevo/desno (dolje = zatvori)
  let x0 = 0;
  let y0 = 0;
  let aktivno = false;
  d.addEventListener('touchstart', (e) => {
    aktivno = e.touches.length === 1;
    if (!aktivno) return;
    x0 = e.touches[0].clientX;
    y0 = e.touches[0].clientY;
  }, { passive: true });
  d.addEventListener('touchend', (e) => {
    if (!aktivno) return;
    aktivno = false;
    const dx = e.changedTouches[0].clientX - x0;
    const dy = e.changedTouches[0].clientY - y0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) prikazi(lbIdx + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) d.close();
  }, { passive: true });
  d.addEventListener('close', () => {
    document.body.classList.remove('no-scroll');
    img.removeAttribute('src');
    lbOtvarac?.focus();
  });
  return d;
}

function prikazi(i: number) {
  if (!dlg || !lbSlike.length) return;
  lbIdx = (i + lbSlike.length) % lbSlike.length;
  const img = dlg.querySelector<HTMLImageElement>('[data-lb-img]')!;
  img.src = lbSlike[lbIdx];
  const n = lbSlike.length;
  img.alt = n > 1 ? `Slika ${lbIdx + 1} od ${n}${lbOpis ? ` — ${lbOpis}` : ''}` : lbOpis || 'Slika';
  dlg.querySelector<HTMLElement>('[data-lb-broj]')!.textContent = n > 1 ? `${lbIdx + 1} / ${n}` : '';
  // unaprijed učitaj susjedne
  for (const j of [lbIdx + 1, lbIdx - 1]) if (n > 1) new Image().src = lbSlike[(j + n) % n];
}

function otvoriLightbox(slike: string[], i: number, opis: string, otvarac: HTMLElement) {
  dlg ??= napraviLightbox();
  lbSlike = slike;
  lbOpis = opis;
  lbOtvarac = otvarac;
  const vise = slike.length > 1;
  dlg.querySelectorAll<HTMLElement>('[data-lb-pret],[data-lb-sled]').forEach((b) => (b.hidden = !vise));
  prikazi(i);
  dlg.showModal();
  document.body.classList.add('no-scroll');
  dlg.querySelector<HTMLElement>(vise ? '[data-lb-sled]' : '[data-lb-zatvori]')?.focus();
}
