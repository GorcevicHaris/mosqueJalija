// HTML redova mjesečne vaktije — isti kod koristi build (početni prikaz) i pregledač (navigacija).
import {
  DANI_KRATKO,
  MJESECI,
  formatHidzretski,
  izracunajMjesec,
  type Koordinate,
} from '../../lib/vaktija.ts';
import { VAKTIJA_CONFIG } from '../../lib/vaktija-config.ts';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function naslovMjeseca(god: number, mj: number): string {
  return `${cap(MJESECI[mj - 1])} ${god}.`;
}

export function sabahUDzamiji(izlazak: Date): string | null {
  const min = VAKTIJA_CONFIG.sabahMinutaPrijeIzlaska;
  if (min == null) return null;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: VAKTIJA_CONFIG.timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(izlazak.getTime() - min * 60_000));
}

/** Redovi <tr> za mjesec; `danas` = 'YYYY-MM-DD' za isticanje (ili ''). */
export function redoviMjeseca(god: number, mj: number, k: Koordinate, danas: string): string {
  const dani = izracunajMjesec(god, mj, k);
  const saSabahom = VAKTIJA_CONFIG.sabahMinutaPrijeIzlaska != null;
  return dani
    .map((d) => {
      const jeDanas = d.datum === danas;
      const petak = d.danUSedmici === 5;
      const h = formatHidzretski(d.god, d.mj, d.dan);
      const cls = [jeDanas ? 'is-today' : '', petak ? 'is-friday' : ''].filter(Boolean).join(' ');
      const celije = d.vakti
        .map((v, i) => {
          const dz = petak && v.kljuc === 'podne' ? ' <span class="vm__dzuma">Džuma</span>' : '';
          return `<td class="vm__t${i === 1 ? ' vm__t--sun' : ''}">${v.hhmm}${dz}</td>`;
        })
        .join('');
      const sabah = saSabahom ? `<td class="vm__t vm__t--sabah">${sabahUDzamiji(d.vakti[1].vrijeme) ?? ''}</td>` : '';
      return (
        `<tr${cls ? ` class="${cls}"` : ''}${jeDanas ? ' aria-current="date"' : ''}>` +
        `<th scope="row" class="vm__day"><span class="vm__dnum">${d.dan}.</span> <span class="vm__dow">${DANI_KRATKO[d.danUSedmici]}</span>` +
        (jeDanas ? ' <span class="vm__today">danas</span>' : '') +
        (h ? `<span class="vm__hijri">${h.replace(/ h\.$/, '')}</span>` : '') +
        `</th>` +
        celije.replace(/(<td class="vm__t vm__t--sun">)/, `${sabah}$1`) +
        `</tr>`
      );
    })
    .join('');
}

/** CSV mjeseca (za preuzimanje). */
export function csvMjeseca(god: number, mj: number, k: Koordinate): string {
  const dani = izracunajMjesec(god, mj, k);
  const zaglavlje = ['Datum', 'Zora', 'Izlazak sunca', 'Podne', 'Ikindija', 'Akšam', 'Jacija'];
  const redovi = dani.map((d) => [d.datum, ...d.vakti.map((v) => v.hhmm)].join(','));
  return '﻿' + [zaglavlje.join(','), ...redovi].join('\r\n') + '\r\n';
}
