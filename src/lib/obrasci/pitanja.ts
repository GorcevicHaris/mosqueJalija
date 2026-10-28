// "Pitaj imama" — pitanja sa sajta (pogled public.pitanja_javna, 0007_pitanja_javna_privatna.sql):
//  * javna pitanja (javno = true) odmah, i bez odgovora; `ime` samo ako ga je pitalac upisao
//  * privatne poruke na koje je imam objavio odgovor (javno = false) — uvijek bez imena
// Pogled NIKAD ne sadrži e-mail. Isti render se koristi pri buildu i u pregledaču.

export interface JavnoPitanje {
  id: string;
  /** ime pitaoca (samo javna pitanja, ako je upisano) */
  ime?: string | null;
  pitanje: string;
  /** null = čeka odgovor */
  odgovor: string | null;
  odgovorio: string | null;
  odgovoreno_at: string | null;
  created_at: string;
  /** true = javno pitanje; false/izostavljeno = objavljen odgovor na privatno pitanje (prije 0007 sva) */
  javno?: boolean;
}

/** Najnovija prvo (po vremenu kad je pitanje postavljeno). */
export const UPIT_PITANJA = 'select=*&order=created_at.desc&limit=500';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Tekst → paragrafi (prazan red = novi paragraf, jedan red = <br>). */
function paragrafi(s: string): string {
  return s
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p>${esc(p.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function formatDatumKratko(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('sr-Latn', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Belgrade' }).format(d);
}

export const imaOdgovor = (p: JavnoPitanje): boolean => typeof p.odgovor === 'string' && p.odgovor.trim() !== '';

const vrijeme = (iso: string | null) => (iso ? `<time datetime="${esc(iso)}">${formatDatumKratko(iso)}</time>` : '');

export function renderPitanja(lista: JavnoPitanje[]): string {
  return lista
    .map((p) => {
      const odg = imaOdgovor(p);
      const ime = p.javno && p.ime?.trim() ? esc(p.ime.trim()) : '';
      const ko = p.javno ? (ime ? `Pita: <strong>${ime}</strong>` : 'Pita: anonimno') : 'Privatno pitanje, objavljeno bez imena';
      const status = odg
        ? '<span class="badge badge--primary pi-status">Odgovoreno</span>'
        : '<span class="badge badge--warn pi-status">Čeka odgovor</span>';
      const metaOdg = [p.odgovorio ? `Odgovorio: ${esc(p.odgovorio)}` : '', vrijeme(p.odgovoreno_at)].filter(Boolean).join(' · ');
      return (
        `<li class="pi-stavka card" data-pitanje-id="${esc(p.id)}" data-status="${odg ? 'odgovoreno' : 'ceka'}">` +
        `<article class="pi-clanak" aria-label="Pitanje">` +
        `<div class="pi-pitanje"><span class="pi-oznaka" aria-hidden="true">P</span><div class="pi-pitanje__tijelo">` +
        `<p class="pi-pitanje__tekst">${esc(p.pitanje.trim()).replace(/\n/g, '<br>')}</p>` +
        `<p class="pi-meta">${ko}${p.created_at ? ` · ${vrijeme(p.created_at)}` : ''} ${status}</p>` +
        `</div></div>` +
        (odg
          ? `<div class="pi-odgovor"><span class="pi-oznaka pi-oznaka--o" aria-hidden="true">O</span><div class="pi-odgovor__tekst">` +
            `<p class="visually-hidden">Odgovor imama:</p>${paragrafi(p.odgovor!)}` +
            (metaOdg ? `<p class="pi-meta">${metaOdg}</p>` : '') +
            `</div></div>`
          : `<p class="pi-ceka">Imam još nije odgovorio — odgovor će se pojaviti ovdje.</p>`) +
        `</article></li>`
      );
    })
    .join('');
}
