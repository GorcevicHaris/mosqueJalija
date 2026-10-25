// HTML za kalendar — iste funkcije koristi i build (početni prikaz bez JS-a) i pregledač
// (ponovni prikaz za stvarni "danas" i navigaciju po mjesecima). Sav tekst je statičan, bez korisničkog unosa.
import {
  DANI_KRATKO,
  DANI,
  GREG_MJESECI,
  danUSedmici,
  danaRijec,
  dayNum,
  formatGreg,
  formatHijri,
  fromDayNum,
  hijri,
  hijriMjesecNaziv,
  isoDatum,
  nocUoci,
  pregledVaznihDatuma,
  vazniUMjesecu,
  type VazanDatum,
} from './hidzra';

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function naslovMjeseca(y: number, m: number) {
  const prvi = dayNum(y, m, 1);
  const zadnji = dayNum(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - 1;
  const h1 = hijri(prvi);
  const h2 = hijri(zadnji);
  const hTekst =
    h1.y === h2.y
      ? h1.m === h2.m
        ? `${hijriMjesecNaziv(h1.m)} ${h1.y}.`
        : `${hijriMjesecNaziv(h1.m)} – ${hijriMjesecNaziv(h2.m)} ${h1.y}.`
      : `${hijriMjesecNaziv(h1.m)} ${h1.y}. – ${hijriMjesecNaziv(h2.m)} ${h2.y}.`;
  return { greg: `${cap(GREG_MJESECI[m - 1])} ${y}.`, hijri: hTekst };
}

/** Mreža mjeseca (tabela, sedmica počinje ponedjeljkom). */
export function renderMjesec(y: number, m: number, danas: number): string {
  const prvi = dayNum(y, m, 1);
  const zadnji = dayNum(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - 1;
  const vazni = new Map<number, VazanDatum[]>();
  for (const v of vazniUMjesecu(y, m)) vazni.set(v.dan, [...(vazni.get(v.dan) ?? []), v]);

  const start = prvi - danUSedmici(prvi);
  const kraj = zadnji + (6 - danUSedmici(zadnji));
  let rows = '';
  for (let w = start; w <= kraj; w += 7) {
    let cells = '';
    for (let n = w; n < w + 7; n++) {
      if (n < prvi || n > zadnji) {
        cells += '<td class="hk-cell hk-cell--empty" aria-hidden="true"></td>';
        continue;
      }
      const g = fromDayNum(n);
      const h = hijri(n);
      const ev = vazni.get(n) ?? [];
      const cls = ['hk-cell'];
      if (n === danas) cls.push('hk-cell--today');
      if (danUSedmici(n) === 4) cls.push('hk-cell--friday');
      if (h.d === 1) cls.push('hk-cell--hstart');
      if (ev.length) cls.push('hk-cell--event');
      const label =
        `${formatGreg(n)} — ${formatHijri(h)}` +
        (ev.length ? `; ${ev.map((e) => (e.noc ? `${e.naziv} (noć)` : e.naziv)).join(', ')}` : '') +
        (n === danas ? ' (danas)' : '');
      cells +=
        `<td class="${cls.join(' ')}"${n === danas ? ' aria-current="date"' : ''}>` +
        `<span class="visually-hidden">${label}</span>` +
        `<span class="hk-cell__in" aria-hidden="true">` +
        `<span class="hk-g">${g.d}</span>` +
        (ev.length ? `<span class="hk-ev" title="${ev.map((e) => e.naziv).join(', ')}">${ev.map((e) => e.naziv.replace(/ \(.*\)$/, '')).join(', ')}</span>` : '') +
        `<span class="hk-h">${h.d}${h.d === 1 ? `<span class="hk-h__m">. ${hijriMjesecNaziv(h.m)}</span>` : ''}</span>` +
        `</span></td>`;
    }
    rows += `<tr>${cells}</tr>`;
  }
  const t = naslovMjeseca(y, m);
  const head = DANI_KRATKO.map((d, i) => `<th scope="col"><abbr title="${DANI[i]}">${d}</abbr></th>`).join('');
  return (
    `<table class="hk-table"><caption class="visually-hidden">${t.greg} (${t.hijri})</caption>` +
    `<thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`
  );
}

/** Lista važnih datuma u prikazanom mjesecu + početaka hidžretskih mjeseci. */
export function renderMjesecLegenda(y: number, m: number, danas: number): string {
  const prvi = dayNum(y, m, 1);
  const zadnji = dayNum(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - 1;
  const stavke: { n: number; html: string }[] = [];
  const vazni = vazniUMjesecu(y, m);
  for (let n = prvi; n <= zadnji; n++) {
    const h = hijri(n);
    // Početak mjeseca se ne ponavlja kad je to već važan datum (Nova godina, Ramazan, Bajram).
    if (h.d === 1 && !vazni.some((v) => v.dan === n && !v.noc))
      stavke.push({ n, html: `Počinje <strong>${hijriMjesecNaziv(h.m)} ${h.y}.</strong>` });
  }
  for (const v of vazni) stavke.push({ n: v.dan, html: opisDogadjaja(v) });
  stavke.sort((a, b) => a.n - b.n);
  if (!stavke.length) return '';
  return (
    '<ul class="hk-legend">' +
    stavke
      .map(
        (s) =>
          `<li${s.n < danas ? ' class="is-past"' : ''}><time datetime="${isoDatum(s.n)}">${formatGreg(s.n)}</time><span>${s.html}</span></li>`,
      )
      .join('') +
    '</ul>'
  );
}

function opisDogadjaja(v: VazanDatum): string {
  const kad = v.noc ? `${nocUoci(v.h)} (uveče)` : formatHijri(v.h);
  return `<strong>${v.naziv}</strong> — ${kad}${v.priblizno ? ' <span class="badge badge--warn">približno</span>' : ''}`;
}

function odbrojavanje(v: VazanDatum, danas: number): string {
  const razlika = v.dan - danas;
  if (razlika === 0) return v.noc ? 'Večeras' : 'Danas';
  if (razlika === 1) return v.noc ? 'Sutra uveče' : 'Sutra';
  return `${razlika} ${danaRijec(razlika)}`;
}

/** Istaknuto odbrojavanje do sljedećeg važnog datuma + Ramazan i Kurban-bajram. */
export function renderOdbrojavanje(danas: number): string {
  const { sljedeci, sljedeciPo } = pregledVaznihDatuma(danas);
  if (!sljedeci) return '';
  const extra = ['ramazan', 'ramazanski-bajram', 'kurban-bajram']
    .map((k) => sljedeciPo(k))
    .filter((v): v is VazanDatum => !!v && v.kljuc !== sljedeci.kljuc)
    .map(
      (v) =>
        `<li><span class="hk-cd__mini-label">${v.doNaziv}:</span> <strong>${odbrojavanje(v, danas)}</strong></li>`,
    )
    .join('');
  const r = sljedeci.dan - danas;
  const broj = r > 1 ? `<span class="hk-cd__num">${r}</span> <span class="hk-cd__unit">${danaRijec(r)}</span>` : `<span class="hk-cd__num hk-cd__num--word">${odbrojavanje(sljedeci, danas)}</span>`;
  return (
    `<div class="hk-cd__main">` +
    `<p class="hk-cd__label">${sljedeci.doNaziv}</p>` +
    `<p class="hk-cd__value">${broj}</p>` +
    `<p class="hk-cd__date">${sljedeci.noc ? cap(nocUoci(sljedeci.h)) + ' — veče, ' : ''}<time datetime="${isoDatum(sljedeci.dan)}">${formatGreg(sljedeci.dan)}</time>${sljedeci.noc ? '' : ` · ${formatHijri(sljedeci.h)}`}</p>` +
    `</div>` +
    (extra ? `<ul class="hk-cd__more">${extra}</ul>` : '')
  );
}

/** Tabele važnih datuma za tekuću i sljedeću hidžretsku godinu. */
export function renderVazniDatumi(danas: number): string {
  const { godine, sljedeci } = pregledVaznihDatuma(danas);
  return godine
    .map(
      ({ godina, datumi }) =>
        `<section class="hk-year" aria-labelledby="hk-god-${godina}">` +
        `<h3 id="hk-god-${godina}" class="hk-year__title">${godina}. godina po Hidžri</h3>` +
        `<ol class="hk-dates">` +
        datumi
          .map((v) => {
            const prosao = v.dan < danas;
            const cls = ['hk-date'];
            if (prosao) cls.push('is-past');
            if (sljedeci && v.kljuc === sljedeci.kljuc && v.dan === sljedeci.dan) cls.push('is-next');
            const status = prosao
              ? '<span class="badge badge--muted">prošlo</span>'
              : `<span class="badge badge--primary">${v.dan - danas > 1 ? 'za ' : ''}${odbrojavanje(v, danas)}</span>`;
            return (
              `<li class="${cls.join(' ')}">` +
              `<div class="hk-date__when"><time datetime="${isoDatum(v.dan)}">${formatGreg(v.dan)}</time>` +
              `<span class="hk-date__h">${v.noc ? `${nocUoci(v.h)} (uveče)` : formatHijri(v.h)}</span></div>` +
              `<div class="hk-date__what"><strong>${v.naziv}</strong>` +
              (v.priblizno ? ' <span class="badge badge--warn">približno</span>' : '') +
              (v.napomena ? `<span class="hk-date__note">${v.napomena}</span>` : '') +
              `</div><div class="hk-date__status">${status}</div></li>`
            );
          })
          .join('') +
        `</ol></section>`,
    )
    .join('');
}
