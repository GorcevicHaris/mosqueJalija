// Objavljena pitanja i odgovori (pogled public.pitanja_javna, 0004_javni_unosi.sql) — tipovi i render.
// Pogled NE sadrži ime ni e-mail pitaoca.

export interface JavnoPitanje {
  id: string;
  pitanje: string;
  odgovor: string;
  odgovorio: string | null;
  odgovoreno_at: string | null;
  created_at: string;
  /** opcionalno — ako urednici kasnije dodaju kategorije u pogled */
  kategorija?: string | null;
}

export const UPIT_PITANJA = 'select=*&order=odgovoreno_at.desc.nullslast,created_at.desc&limit=500';

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

export function renderPitanja(lista: JavnoPitanje[]): string {
  return lista
    .map((p) => {
      const datum = p.odgovoreno_at ?? p.created_at;
      const meta = [p.odgovorio ? `Odgovorio: ${esc(p.odgovorio)}` : '', datum ? `<time datetime="${esc(datum)}">${formatDatumKratko(datum)}</time>` : '']
        .filter(Boolean)
        .join(' · ');
      return (
        `<li class="pi-stavka card" data-pitanje-id="${esc(p.id)}"${p.kategorija ? ` data-kategorija="${esc(p.kategorija)}"` : ''}>` +
        `<details class="pi-det"><summary class="pi-pitanje"><span class="pi-oznaka" aria-hidden="true">P</span><span class="pi-pitanje__tekst">${esc(p.pitanje.trim())}</span></summary>` +
        `<div class="pi-odgovor"><span class="pi-oznaka pi-oznaka--o" aria-hidden="true">O</span><div class="pi-odgovor__tekst"><p class="visually-hidden">Odgovor:</p>${paragrafi(p.odgovor)}` +
        (meta ? `<p class="pi-meta">${meta}</p>` : '') +
        (p.kategorija ? `<span class="badge badge--muted">${esc(p.kategorija)}</span>` : '') +
        `</div></div></details></li>`
      );
    })
    .join('');
}
