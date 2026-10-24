// Pomoćne funkcije za rad sa tekstom (bez zavisnosti).

const POSEBNA = { đ: 'd', Đ: 'd', ł: 'l', Ł: 'l', ß: 's', ø: 'o', Ø: 'o' };

/**
 * Normalizuje tekst 1:1 po UTF-16 jedinici: mala slova, bez dijakritika.
 * Dužina rezultata je ISTA kao dužina ulaza, pa se indeksi pogodaka regexa
 * na normalizovanom tekstu mogu direktno primijeniti na originalni tekst.
 */
export function normalizuj(tekst) {
  let out = '';
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i];
    if (POSEBNA[c]) {
      out += POSEBNA[c];
      continue;
    }
    const code = c.charCodeAt(0);
    if (code >= 0xd800 && code <= 0xdfff) {
      out += c; // pola surogat para — ostavi
      continue;
    }
    const d = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    out += d.length === 1 ? d : c.length === 1 && c.toLowerCase().length === 1 ? c.toLowerCase() : c;
  }
  return out;
}

/** ascii slug: "Hfz. Admir Jašarević" -> "hfz-admir-jasarevic" */
export function slugify(tekst) {
  return normalizuj(tekst)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function sabijRazmake(t) {
  return t.replace(/\s+/g, ' ').trim();
}

/** Uklanja sve pogotke regexa (na normalizovanom tekstu) iz originala, mijenjajući ih `zamjena`. */
export function ukloniPoNormalizovanom(original, regex, zamjena = ' | ') {
  const norm = normalizuj(original);
  const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
  const dijelovi = [];
  let zadnji = 0;
  const pogoci = [];
  for (const m of norm.matchAll(re)) {
    if (m[0].length === 0) continue;
    dijelovi.push(original.slice(zadnji, m.index));
    pogoci.push(original.slice(m.index, m.index + m[0].length));
    zadnji = m.index + m[0].length;
  }
  dijelovi.push(original.slice(zadnji));
  return { tekst: dijelovi.join(zamjena), pogoci };
}

export function formatDatumBs(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}.`;
}
