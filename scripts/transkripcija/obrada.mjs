// Naknadna obrada sirovog whisper.cpp JSON izlaza (-oj) u data/transkripti/<id>.json.
// Bez zavisnosti. Ne izmišlja sadržaj: samo uklanja poznate halucinacije, ponavljanja,
// ujednačava pisanje nekoliko islamskih izraza i spaja kratke segmente u pasuse.

/** "00:01:02,345" ili milisekunde → sekunde */
function uSekunde(seg) {
  if (seg.offsets && typeof seg.offsets.from === 'number') {
    return [seg.offsets.from / 1000, seg.offsets.to / 1000];
  }
  const p = (t) => {
    const [h, m, s] = t.replace(',', '.').split(':').map(Number);
    return h * 3600 + m * 60 + s;
  };
  return [p(seg.timestamps.from), p(seg.timestamps.to)];
}

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9؀-ۿ]+/g, ' ')
    .trim();

// Cijeli segment koji je poznata whisper halucinacija (titlovi, odjave sa YouTube-a, muzika).
const HALUCINACIJE = [
  /^(hvala|zahvaljujem)( vam| ti)? (na|za|sto ste) (gledanju|gledanje|pracenju|pracenje|pratili|gledali|paznji)\b.*$/,
  /^hvala sto ste (pogledali|gledali|pratili)\b.*$/,
  /^(pretplatite|pretplati|pratite|lajkajte|podijelite) se?\b.*(kanal|video|pretplat|zvonc)?.*$/,
  /^(titlov|titlova|titlovi|titl|prevod|prijevod|preveo|prevela|prevodilac|obrada titla|sinhroniz)\b.*$/,
  /\b(subtitles|subtitle|amara org|transcribed by|titlovi by|www \w+ (com|rs|ba|hr))\b/,
  /^(muzika|music|glazba|muzicka pauza|aplauz|smijeh)$/,
  /^(dovidjenja|dovidenja|do sljedeceg|do slijedeceg|vidimo se)( puta| put)?$/,
];

/** Oznaka za dio koji whisper nije uspio transkribovati (najčešće arapsko učenje: hutbe-uvod, ajeti, dove). */
export const OZNAKA_ARAPSKI = '[arapski / nije transkribovano]';

const SAMO_SIMBOLI = /^[\s♪♫*.,!?…\-–—"'„“”()[\]]*$/;

function jeHalucinacija(tekst) {
  if (SAMO_SIMBOLI.test(tekst)) return true;
  if (/^\s*[\[(].*[\])]\s*$/.test(tekst)) return true; // [Muzika], (aplauz)…
  const n = norm(tekst);
  if (!n) return true;
  return HALUCINACIJE.some((r) => r.test(n));
}

/** Skraćuje petlje unutar jednog segmenta: "i onda i onda i onda i onda…" → "i onda…" */
function skratiPetlje(t) {
  // isti niz od 1–6 riječi ponovljen 4+ puta zaredom → ostavi dva puta
  let out = t.replace(/((?:\S+\s+){0,5}?\S+?)([,.]?\s+\1){3,}/giu, '$1, $1…');
  // isti znak ponovljen (npr. "aaaaaaaa")
  out = out.replace(/(\p{L})\1{5,}/gu, '$1$1$1');
  return out;
}

// Ujednačavanje pisanja. Namjerno konzervativno — mijenja samo očigledne varijante.
const ZAMJENE = [
  // Allah (i padeži), Bog ostaje kako je izgovoreno
  [/\ballah(a|u|om|ov|ova|ove|ovo|ovu|ovom|ovih|ovim|ovoj)?\b/giu, (m, k = '') => 'Allah' + k.toLowerCase()],
  [/\bdž?d?ž?el+e[ -]?š?s?anuh?u\b/giu, 'dželle šanuhu'],
  [/\bdželle šanuhu\b/giu, 'dželle šanuhu'],
  // sallallahu alejhi ve sellem (whisper piše i arapsko-engleske varijante: alayhi wa sallam, alihi wa sallam…)
  [/\bs+al+al+ahu?\s+a?l?(?:ej|ey|ay|aj|e|a|i)?hi\s*(?:ve|we|wa|va|v)\s*-?\s*s+[ae]l+[ae]m[ae]?\b/giu, 'sallallahu alejhi ve sellem'],
  [/\b(?:a|e)l(?:ej|ey|ay|aj)hi\s*(?:ve|we|wa|va)\s*-?\s*s+[ae]l+[ae]m[ae]?\b/giu, 'alejhi ve sellem'],
  [/\bsubhan[ae]h[uū]\s*(?:ve|we|wa|va)\s*-?\s*t[ae]'?[aā]l[aā]\b/giu, "subhanehu ve te'ala"],
  [/\balejhis+-?selam\b/giu, 'alejhis-selam'],
  [/\bradij?(j)?al+ahu\s+anh(u|a|um)\b/giu, (m, _j, k) => 'radijallahu anh' + k.toLowerCase()],
  [/\bkur'?a?n(a|u|om)?\b/giu, (m, k = '') => (/^kur/i.test(m) && /'|kuran/i.test(m) ? "Kur'an" + k.toLowerCase() : m)],
  [/\bkur[’`´]an(a|u|om)?\b/giu, (m, k = '') => "Kur'an" + k.toLowerCase()],
  [/\bposlanik(a|u|om|ov|ova|ove|ovo|ovu|ovom|ovih|ovim|ovoj)?\b/gu, (m, k = '') => 'Poslanik' + k],
  [/\bresul(ul+ah|ulah|ullaha|ullahu|ullahom)\b/giu, (m, k) => 'Resul' + k.toLowerCase().replace(/^ulah/, 'ullah')],
  [/\bmuham+ed(a|u|om|ov|ova|ove|ovu)?\b/giu, (m, k = '') => 'Muhammed' + k.toLowerCase()],
  [/\bbismil+ah\b/giu, 'Bismillah'],
  [/\belhamdulil+ah\b/giu, 'elhamdulillah'],
  [/\binša'?al+ah\b/giu, "inša'Allah"],
  [/\bmaša'?al+ah\b/giu, "maša'Allah"],
  [/\bramazan(a|u|om)?\b/gu, (m, k = '') => 'Ramazan' + k],
  [/\bdžum[aeiu]\b/gu, (m) => m], // ostaje malim slovom
  [/\bhz\.\s*/giu, 'hz. '],
  // whisper ponekad "numeriše" arapske rečenice: "… حي 1. لينذر" → bez brojeva
  [/([؀-ۿ][ً-ٟ]*)\s+\d{1,2}\.(?=\s)/gu, '$1'],
  [/(^|\s)\d{1,2}\.\s+(?=[؀-ۿ])/gu, '$1'],
  [/ {2,}/g, ' '],
];

export function ujednaci(t) {
  let out = t;
  for (const [r, z] of ZAMJENE) out = out.replace(r, z);
  return out.trim();
}

const kraj = (t) => /[.!?…]["”»)]*$/.test(t.trim());
const velikoPocetno = (t) => t.replace(/^(["„“«(]*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());

/**
 * @param {object} sirovo  whisper.cpp JSON (-oj)
 * @param {object} meta    { id, model, jezik, trajanje }
 */
export function obradi(sirovo, meta) {
  const ulaz = (sirovo.transcription || [])
    .map((s) => {
      const [od, d] = uSekunde(s);
      return { od, do: d, tekst: String(s.text || '').replace(/\s+/g, ' ').trim() };
    })
    .filter((s) => s.tekst && s.do > s.od - 0.01);

  // 1) halucinacije i ponavljanja
  const ocisceni = [];
  let prethodni = '';
  let ponavljanja = 0;
  for (const s of ulaz) {
    if (jeHalucinacija(s.tekst)) continue;
    let t = skratiPetlje(s.tekst);
    // Dug segment sa svega par riječi latinicom = whisper je "progutao" arapsko učenje
    // (npr. 60 s hutbe-uvoda → "Al-Fatiha."). Takav tekst je netačan, pa ga zamijeni oznakom.
    const rijeci = t.split(/\s+/).filter(Boolean).length;
    const duz = s.do - s.od;
    if (duz >= 12 && rijeci / duz < 0.3 && !/[\u0600-\u06ff]/.test(t)) t = OZNAKA_ARAPSKI;
    const n = norm(t);
    if (n === prethodni) {
      ponavljanja++;
      if (ponavljanja >= 1) {
        // isti red ponovljen — produži prethodni umjesto dupliranja
        const z = ocisceni[ocisceni.length - 1];
        if (z) z.do = Math.max(z.do, s.do);
        continue;
      }
    } else {
      ponavljanja = 0;
    }
    prethodni = n;
    ocisceni.push({ ...s, tekst: t });
  }

  // 1b) dugi niz istih kratkih fraza raspoređen preko više segmenata (A B A B A B…)
  const bez = [];
  for (let i = 0; i < ocisceni.length; i++) {
    const s = ocisceni[i];
    const n = norm(s.tekst);
    const prozor = bez.slice(-4).map((x) => norm(x.tekst));
    if (n.split(' ').length <= 6 && prozor.filter((p) => p === n).length >= 2) {
      bez[bez.length - 1].do = Math.max(bez[bez.length - 1].do, s.do);
      continue;
    }
    bez.push(s);
  }

  // 1c) halucinacije na samom kraju (tišina nakon predavanja)
  while (bez.length) {
    const z = bez[bez.length - 1];
    const n = norm(z.tekst);
    if (meta.trajanje && z.od > meta.trajanje + 1) { bez.pop(); continue; }
    if (/^(hvala|amin|amen|selam|es selamu alejkum)\b/.test(n) && n.split(' ').length <= 4 && bez.length > 3) {
      // vjerovatno stvarno izgovoreno (amin, selam) — zadrži
      break;
    }
    break;
  }

  // 2) spajanje u pasuse ~15–40 s
  const MIN = 15;
  const MAX = 40;
  const PAUZA = 2.5;
  const pasusi = [];
  let tren = null;
  for (const s of bez) {
    const oznaka = s.tekst === OZNAKA_ARAPSKI;
    if (tren && (oznaka || tren.tekst === OZNAKA_ARAPSKI)) {
      if (oznaka && tren.tekst === OZNAKA_ARAPSKI) { tren.do = s.do; continue; }
      pasusi.push(tren);
      tren = null;
    }
    if (tren) {
      const duz = tren.do - tren.od;
      const pauza = s.od - tren.do;
      const zatvori =
        (duz >= MIN && kraj(tren.tekst)) ||
        duz + (s.do - s.od) > MAX + 10 ||
        (duz >= MAX) ||
        (pauza >= PAUZA && duz >= 8);
      if (zatvori) {
        pasusi.push(tren);
        tren = null;
      }
    }
    if (!tren) tren = { od: s.od, do: s.do, tekst: s.tekst };
    else {
      tren.do = s.do;
      tren.tekst += ' ' + s.tekst;
    }
  }
  if (tren) pasusi.push(tren);

  const segmenti = pasusi
    .map((p) => ({
      od: Math.round(p.od * 10) / 10,
      do: Math.round(p.do * 10) / 10,
      tekst: p.tekst === OZNAKA_ARAPSKI ? p.tekst : velikoPocetno(ujednaci(p.tekst)),
    }))
    .filter((p) => p.tekst);

  return {
    id: meta.id,
    jezik: meta.jezik || 'bs',
    model: meta.model,
    generisano: meta.generisano || new Date().toISOString(),
    automatski: true,
    segmenti,
  };
}
