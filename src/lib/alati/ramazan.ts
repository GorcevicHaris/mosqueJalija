/**
 * Ramazan: datum (iz hidžretskog kalendara Umm al-Qura, src/lib/extras/hidzra.ts) i imsakija
 * (iz kalibrisane vaktije, src/lib/vaktija.ts). Imsak = zora (početak sabaha), iftar = akšam.
 * Radi i pri buildu i u pregledaču.
 */
import { dayNum, fromDayNum, hijri, hijriUDan } from '../extras/hidzra.ts';
import { danUZoni, izracunajDan, DANI_KRATKO, MJESECI_GEN, type Koordinate } from '../vaktija.ts';

export interface RamazanInfo {
  /** hidžretska godina */
  hy: number;
  /** broj dana (dayNum) prvog dana posta */
  pocetak: number;
  /** zadnji dan posta */
  kraj: number;
  /** 1. ševval — Ramazanski bajram */
  bajram: number;
  brojDana: number;
  /** true = danas je (u zoni džamije) dan Ramazana */
  uToku: boolean;
}

/** Današnji kalendarski dan u zoni džamije kao dayNum. */
export function danasUZoni(now: Date = new Date()): number {
  const d = danUZoni(now);
  return dayNum(d.god, d.mj, d.dan);
}

/** Tekući (ako je u toku) ili sljedeći Ramazan. */
export function ramazanZa(danas: number): RamazanInfo {
  const h = hijri(danas);
  const hy = h.m <= 9 ? h.y : h.y + 1;
  const pocetak = hijriUDan(hy, 9, 1) ?? danas;
  const bajram = hijriUDan(hy, 10, 1) ?? pocetak + 30;
  return { hy, pocetak, kraj: bajram - 1, bajram, brojDana: bajram - pocetak, uToku: danas >= pocetak && danas < bajram };
}

export interface DanImsakije {
  rb: number;
  dan: number;
  god: number;
  mj: number;
  d: number;
  danUSedmici: number;
  /** [zora/imsak, izlazak, podne, ikindija, akšam/iftar, jacija] */
  vakti: { vrijeme: Date; hhmm: string }[];
}

export function imsakija(info: RamazanInfo, k: Koordinate): DanImsakije[] {
  const out: DanImsakije[] = [];
  for (let i = 0; i < info.brojDana; i++) {
    const n = info.pocetak + i;
    const g = fromDayNum(n);
    const dv = izracunajDan(g.y, g.m, g.d, k);
    out.push({
      rb: i + 1,
      dan: n,
      god: g.y,
      mj: g.m,
      d: g.d,
      danUSedmici: dv.danUSedmici,
      vakti: dv.vakti.map((v) => ({ vrijeme: v.vrijeme, hhmm: v.hhmm })),
    });
  }
  return out;
}

/** "8. februara 2027." */
export function datumDugo(n: number): string {
  const g = fromDayNum(n);
  return `${g.d}. ${MJESECI_GEN[g.m - 1]} ${g.y}.`;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string);

/** HTML redova tabele imsakije (isti kod pri buildu i u pregledaču → nema pomjeranja sadržaja). */
export function renderImsakijaRedovi(dani: DanImsakije[], danas: number): string {
  return dani
    .map((r) => {
      const jeDanas = r.dan === danas;
      const kadr = r.rb === 27;
      const pet = r.danUSedmici === 5;
      const cls = [jeDanas && 'is-danas', pet && 'is-petak', kadr && 'is-kadr'].filter(Boolean).join(' ');
      const oznaka = [jeDanas ? '<span class="im-tag im-tag--danas">danas</span>' : '', kadr ? '<span class="im-tag" title="Lejletul-kadr se obilježava noć uoči 27. ramazana (noć prije ovog dana)">kadr</span>' : '']
        .filter(Boolean)
        .join(' ');
      const v = r.vakti;
      return `<tr${cls ? ` class="${cls}"` : ''}${jeDanas ? ' aria-current="date"' : ''}>
<th scope="row" class="im-rb">${r.rb}.</th>
<td class="im-datum"><span class="im-dow">${esc(DANI_KRATKO[r.danUSedmici])}</span> ${r.d}.&#8239;${r.mj}.${oznaka ? ` ${oznaka}` : ''}</td>
<td class="im-t im-t--imsak"><time>${v[0].hhmm}</time></td>
<td class="im-t im-x"><time>${v[1].hhmm}</time></td>
<td class="im-t im-x"><time>${v[2].hhmm}</time></td>
<td class="im-t im-x"><time>${v[3].hhmm}</time></td>
<td class="im-t im-t--iftar"><time>${v[4].hhmm}</time></td>
<td class="im-t im-x"><time>${v[5].hhmm}</time></td>
</tr>`;
    })
    .join('');
}
