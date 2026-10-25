// Sedmični raspored (tabela public.raspored, 0001_sadrzaj.sql) — tipovi i HTML render.
// Isti render se koristi u buildu (set:html, SEO) i u pregledniku (osvježavanje), pa je izgled identičan.

export type ZaKoga = 'muškarci' | 'žene' | 'djeca' | 'svi';

export interface Termin {
  id: string;
  dan: number; // 1 = ponedjeljak … 7 = nedjelja
  vrijeme: string; // "17:00" ili "nakon akšama"
  naziv: string;
  opis: string | null;
  za_koga: ZaKoga;
  aktivno: boolean;
  redoslijed: number;
}

export const UPIT_RASPORED = 'select=id,dan,vrijeme,naziv,opis,za_koga,aktivno,redoslijed&aktivno=eq.true&order=dan.asc,redoslijed.asc,vrijeme.asc';

export const DANI = ['', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota', 'Nedjelja'];

export const ZA_KOGA: Record<ZaKoga, string> = {
  svi: 'Za sve',
  muškarci: 'Muškarci',
  žene: 'Žene',
  djeca: 'Djeca',
};

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** "17:00:00" → "17:00"; tekst ("nakon akšama") ostaje. */
export function formatVrijeme(v: string): string {
  const m = v.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : v.trim();
}

/** Ključ za sortiranje unutar dana: tačna vremena po satu, opisna ("nakon akšama") na kraj. */
function kljucVremena(t: Termin): string {
  const m = t.vrijeme.trim().match(/^(\d{1,2}):(\d{2})/);
  return `${String(t.redoslijed).padStart(6, '0')}|${m ? `${m[1].padStart(2, '0')}${m[2]}` : '9999'}`;
}

/** Današnji dan (1–7) po vremenu u Novom Pazaru. */
export function danasDan(d = new Date()): number {
  const ime = new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'Europe/Belgrade' }).format(d);
  return { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }[ime] ?? ((d.getDay() + 6) % 7) + 1;
}

export function grupisi(termini: Termin[]): Map<number, Termin[]> {
  const m = new Map<number, Termin[]>();
  for (const t of termini.filter((x) => x.aktivno !== false && x.dan >= 1 && x.dan <= 7)) {
    const arr = m.get(t.dan) ?? [];
    arr.push(t);
    m.set(t.dan, arr);
  }
  for (const arr of m.values()) arr.sort((a, b) => kljucVremena(a).localeCompare(kljucVremena(b)));
  return new Map([...m.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * HTML za listu dana. `danas` = null u buildu (statična stranica ne zna koji je dan kada se otvori);
 * preglednik ponovo iscrta sa današnjim danom.
 */
export function renderRaspored(termini: Termin[], danas: number | null): string {
  const g = grupisi(termini);
  let html = '';
  for (const [dan, lista] of g) {
    const jeDanas = dan === danas;
    html += `<section class="rs-dan${jeDanas ? ' rs-dan--danas' : ''}" aria-labelledby="rs-dan-${dan}" data-dan="${dan}">`;
    html += `<h2 class="rs-dan__naslov" id="rs-dan-${dan}">${DANI[dan]}${jeDanas ? ' <span class="badge badge--primary rs-danas">Danas</span>' : ''}</h2>`;
    html += '<ul class="rs-lista" role="list">';
    for (const t of lista) {
      const zk = ZA_KOGA[t.za_koga] ?? t.za_koga;
      html += `<li class="rs-stavka card" data-za-koga="${esc(t.za_koga)}">`;
      html += `<p class="rs-stavka__vrijeme"><span class="visually-hidden">Vrijeme: </span>${esc(formatVrijeme(t.vrijeme))}</p>`;
      html += '<div class="rs-stavka__tijelo">';
      html += `<h3 class="rs-stavka__naziv">${esc(t.naziv)}</h3>`;
      if (t.opis?.trim()) html += `<p class="rs-stavka__opis">${esc(t.opis.trim())}</p>`;
      html += `<span class="badge badge--muted rs-stavka__za">${esc(zk)}</span>`;
      html += '</div></li>';
    }
    html += '</ul></section>';
  }
  return html;
}
