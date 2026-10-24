// Heuristike: od sirovih YouTube podataka do Predavanje/ImamOsnovno/Kategorija/Serija.
// Pravila (imena, kategorije, serije) su u scripts/podaci-config.json.
import { normalizuj, slugify, sabijRazmake, ukloniPoNormalizovanom, formatDatumBs } from './tekst.mjs';

const PREFIKS_TITULE = String.raw`(?:\b(?:muftija|prof|hfz|dr|mr|ef)\b\.?\s*|\b[a-z]\.\s*)*`;
const SEP = '\u0001';

function imamRegex(imam) {
  const ime = imam.imeObrazac;
  const prezime = imam.prezimeObrazac;
  const jezgro =
    (ime ? String.raw`(?:\b(?:${ime})[a-z]{0,2}\b\.?\s*)?` : '') +
    String.raw`(?:\bef\b\.?\s*)?\b(?:${prezime})[a-z]{0,2}\b`;
  return new RegExp(PREFIKS_TITULE + jezgro, 'g');
}

const NEPOZNAT_GOVORNIK =
  /\b(?:[Hh]fz|HFZ|[Mm]uftija|[Pp]rof|[Ee]f)\.?\s*([A-ZČĆŠŽĐ][a-zčćšžđ]+)\s+(?:ef\.?\s*)?([A-ZČĆŠŽĐ][a-zčćšžđ]+)/gu;

function cistiAlias(s) {
  return sabijRazmake(s).replace(/^[\s\-|,.;:]+|[\s\-|,;:]+$/g, '');
}

/** Pronađi imama u tekstu; vraća {slug, alias, index} prvog (najranijeg) pogotka ili null. */
function nadjiImama(tekst, imami) {
  if (!tekst) return null;
  const norm = normalizuj(tekst);
  let najbolji = null;
  for (const im of imami) {
    for (const m of norm.matchAll(im._re)) {
      if (!najbolji || m.index < najbolji.index) {
        najbolji = { slug: im.slug, alias: cistiAlias(tekst.slice(m.index, m.index + m[0].length)), index: m.index };
      }
      break;
    }
  }
  return najbolji;
}

const DIO_RE = /(\d{1,3})\s*\.?\s*dio\b/;

function sredjivanjeSegmenta(s) {
  return s
    .replace(/^[\s\-–—,.:;]+/, '')
    .replace(/[\s\-–—,:;]+$/, '')
    .trim();
}

function imaLatinicu(s) {
  return /[A-Za-zČĆŠŽĐčćšžđ]/.test(s);
}

function lijepiTekst(t) {
  let s = t
    .replace(/,(?=[^\s\d])/g, ', ')
    .replace(/\s+([!?.,:])/g, '$1')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?');
  // RIJEČI VELIKIM SLOVIMA -> mala; "dIjela" -> "dijela"
  s = s.replace(/[\p{L}]+/gu, (w) => {
    const velika = (w.match(/\p{Lu}/gu) || []).length;
    if (w.length >= 2 && velika === w.length) return w.toLowerCase();
    if (/^\p{Ll}+\p{Lu}\p{Ll}+$/u.test(w)) return w.toLowerCase();
    return w;
  });
  s = sabijRazmake(s);
  if (/^\p{Ll}/u.test(s)) s = s[0].toUpperCase() + s.slice(1);
  return s;
}

/**
 * Očisti naslov: ukloni imena govornika, "Džamija na Jaliji", "Dzuma", "Hutba <datum>",
 * oznaku "N.dio" (vraća se posebno), separatore.
 */
function ocistiNaslov(naslov, imami, config) {
  let t = naslov;
  for (const im of imami) t = ukloniPoNormalizovanom(t, im._re, ' | ').tekst;
  t = t.replace(NEPOZNAT_GOVORNIK, ' | ');
  for (const re of config._naslovUkloni) t = ukloniPoNormalizovanom(t, re, ' | ').tekst;

  // N.dio
  let dio = null;
  let osnova = null;
  const norm = normalizuj(t);
  const m = norm.match(DIO_RE);
  if (m) {
    dio = Number(m[1]);
    const prije = t.slice(0, m.index);
    const segPrije = prije.split(/\s*[|;]\s*|\s+[-–—]+\s*|\s*[-–—]+\s+/).pop();
    if (segPrije && /\p{L}{3,}/u.test(segPrije)) osnova = sredjivanjeSegmenta(segPrije);
    t = t.slice(0, m.index) + ' | ' + t.slice(m.index + m[0].length);
  }

  // segmenti
  t = t.replace(/\s*[|;]\s*/g, SEP).replace(/\s+[-–—]+\s*|\s*[-–—]+\s+/g, SEP);
  t = t.replace(/([\p{L}\p{N}']+)[-–—](?=[\p{L}"„“])/gu, (cijelo, lijevo) =>
    lijevo.length > 3 && !/^\d+$/.test(lijevo) ? lijevo + SEP : cijelo,
  );
  let segmenti = t
    .split(SEP)
    .map(sredjivanjeSegmenta)
    .filter((s) => /\p{L}/u.test(s))
    .filter((s) => !/^\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?\.?$/.test(s));
  if (segmenti.some(imaLatinicu)) segmenti = segmenti.filter(imaLatinicu);
  return { naslovCist: lijepiTekst(segmenti.join(' - ')), dio, osnova };
}

function ocistiOpis(opis, config) {
  if (!opis) return null;
  const linije = opis
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !config._opisBoilerplate.some((re) => re.test(normalizuj(l))));
  const out = linije.join('\n').trim();
  return out ? out : null;
}

function datumIzTeksta(...tekstovi) {
  for (const t of tekstovi) {
    const m = (t || '').match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/);
    if (m) return `${m[1].padStart(2, '0')}.${m[2].padStart(2, '0')}.${m[3]}.`;
  }
  return null;
}

function pravilo(r, v) {
  if (r.tip && v.tip !== r.tip) return false;
  if (r.serija && !r.serija.includes(v.serija)) return false;
  if (r._naslov && !r._naslov.test(v._normNaslov)) return false;
  if (r._opis && !r._opis.test(v._normOpis)) return false;
  if (r.maxTrajanje && !(v.trajanje > 0 && v.trajanje <= r.maxTrajanje)) return false;
  if (r.bezImama && v.imam !== null) return false;
  return true;
}

export function pripremiConfig(config) {
  const c = structuredClone(config);
  for (const im of c.imami) im._re = imamRegex(im);
  c._naslovUkloni = c.naslovUkloni.map((s) => new RegExp(s, 'g'));
  c._opisBoilerplate = c.opisBoilerplateLinije.map((s) => new RegExp(s));
  for (const r of c.kategorijePravila) {
    if (r.naslov) r._naslov = new RegExp(r.naslov);
    if (r.opis) r._opis = new RegExp(r.opis);
  }
  for (const s of c.serije) {
    if (s.naslovObrazac) s._naslov = new RegExp(s.naslovObrazac);
    if (s.opisObrazac) s._opis = new RegExp(s.opisObrazac);
  }
  return c;
}

/**
 * @param sirovi   mapa id -> sirovi zapis (vidi update-videos.mjs)
 * @param playliste [{id, naslov, opis, videi}]
 * @param ispravke  ručne ispravke (predavanja-ispravke.json)
 */
export function izgradi(sirovi, playliste, configSirovi, ispravke) {
  const config = pripremiConfig(configSirovi);
  const upozorenja = [];
  const imami = [...config.imami];
  const aliasiNadjeni = new Map(imami.map((i) => [i.slug, new Set(i.aliasi || [])]));
  const serijeMapa = new Map(config.serije.map((s) => [s.slug, { slug: s.slug, naziv: s.naziv, opis: s.opis ?? null }]));
  const playlistaUSeriju = new Map();
  for (const s of config.serije) for (const p of s.playliste || []) playlistaUSeriju.set(p, s.slug);
  // playliste koje nisu u configu -> automatska serija po nazivu playliste
  for (const p of playliste) {
    if (playlistaUSeriju.has(p.id)) continue;
    const slug = slugify(p.naslov);
    if (!slug) continue;
    playlistaUSeriju.set(p.id, slug);
    if (!serijeMapa.has(slug)) {
      serijeMapa.set(slug, { slug, naziv: lijepiTekst(p.naslov), opis: p.opis ? sabijRazmake(p.opis) : null });
      upozorenja.push(`Nova serija iz playliste "${p.naslov}" (${slug}) — po želji dodaj u podaci-config.json`);
    }
  }
  const videoUPlaylisti = new Map();
  for (const p of playliste) for (const id of p.videi) if (!videoUPlaylisti.has(id)) videoUPlaylisti.set(id, p.id);

  const lista = [];
  for (const r of Object.values(sirovi)) {
    const naslov = r.naslov || r.id;
    const opisSirov = r.opis || '';

    // --- imam
    let imam = null;
    let imamPotvrdjen = false;
    const pogodak = nadjiImama(naslov, imami) || nadjiImama(opisSirov, imami);
    if (pogodak) {
      imam = pogodak.slug;
      imamPotvrdjen = true;
      aliasiNadjeni.get(imam).add(pogodak.alias);
    } else {
      // nepoznat govornik u naslovu?
      const m = [...naslov.matchAll(NEPOZNAT_GOVORNIK)][0];
      if (m) {
        const slug = slugify(`${m[1]} ${m[2]}`);
        if (!aliasiNadjeni.has(slug)) {
          const novi = { slug, punoIme: cistiAlias(m[0]), imeObrazac: normalizuj(m[1]), prezimeObrazac: normalizuj(m[2]), aliasi: [] };
          novi._re = imamRegex(novi);
          imami.push(novi);
          aliasiNadjeni.set(slug, new Set());
          upozorenja.push(`Novi govornik "${cistiAlias(m[0])}" (${slug}) — dodaj ga u scripts/podaci-config.json (punoIme, obrasci)`);
        }
        imam = slug;
        imamPotvrdjen = true;
        aliasiNadjeni.get(slug).add(cistiAlias(m[0]));
      }
    }

    // --- naslov
    let { naslovCist, dio, osnova } = ocistiNaslov(naslov, imami, config);

    const v = {
      id: r.id,
      naslov,
      naslovCist,
      datum: r.datum,
      trajanje: r.trajanje ?? 0,
      thumbnail: r.maxres ? `https://i.ytimg.com/vi/${r.id}/maxresdefault.jpg` : `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg`,
      imam,
      imamPotvrdjen,
      kategorija: config.podrazumijevanaKategorija,
      serija: null,
      serijaDio: dio,
      opis: ocistiOpis(opisSirov, config),
      pregledi: r.pregledi ?? null,
      tip: r.tip,
      _ts: r.timestamp ?? 0,
      _normNaslov: normalizuj(naslov),
      _normOpis: normalizuj(opisSirov),
      _osnova: osnova,
      _sirovOpis: opisSirov,
    };

    // --- serija: playlista > pravilo iz configa > "Naziv N.dio"
    const pl = videoUPlaylisti.get(r.id);
    if (pl) v.serija = playlistaUSeriju.get(pl) ?? null;
    if (!v.serija) {
      const s = config.serije.find((s) => (s._naslov && s._naslov.test(v._normNaslov)) || (s._opis && s._opis.test(v._normOpis)));
      if (s) v.serija = s.slug;
    }
    if (!v.serija && osnova) {
      const slug = slugify(osnova);
      v.serija = slug;
      if (!serijeMapa.has(slug)) {
        serijeMapa.set(slug, { slug, naziv: lijepiTekst(osnova), opis: null });
        upozorenja.push(`Automatski prepoznata serija "${osnova}" (${slug}) — po želji dodaj naziv/opis u podaci-config.json`);
      }
    }
    if (!v.serija) v.serijaDio = null; // "N.dio" bez serije nema smisla
    lista.push(v);
  }

  // nenumerisani video čiji je naslov = naziv automatske serije (npr. 1. dio bez oznake)
  for (const v of lista) {
    if (v.serija) continue;
    const slug = slugify(v.naslovCist);
    if (serijeMapa.has(slug) && lista.some((o) => o.serija === slug && o !== v)) v.serija = slug;
  }

  // ručne ispravke: imam / serija / serijaDio (prije zaključivanja)
  for (const v of lista) {
    const isp = ispravke[v.id];
    if (!isp) continue;
    if ('imam' in isp) {
      v.imam = isp.imam;
      v.imamPotvrdjen = 'imamPotvrdjen' in isp ? !!isp.imamPotvrdjen : isp.imam !== null;
    } else if ('imamPotvrdjen' in isp) v.imamPotvrdjen = !!isp.imamPotvrdjen;
    if ('serija' in isp) v.serija = isp.serija;
    if ('serijaDio' in isp) v.serijaDio = isp.serijaDio;
  }

  // serije: popuni nedostajuće brojeve dijelova hronološki; zaključi imama
  const poSeriji = new Map();
  for (const v of lista) if (v.serija) (poSeriji.get(v.serija) || poSeriji.set(v.serija, []).get(v.serija)).push(v);
  for (const [, clanovi] of poSeriji) {
    clanovi.sort((a, b) => (a.datum || '').localeCompare(b.datum || '') || a._ts - b._ts);
    const zauzeti = new Set(clanovi.map((c) => c.serijaDio).filter((x) => x != null));
    let n = 1;
    for (const c of clanovi) {
      if (c.serijaDio != null || (ispravke[c.id] && 'serijaDio' in ispravke[c.id])) continue;
      while (zauzeti.has(n)) n++;
      c.serijaDio = n;
      zauzeti.add(n);
    }
    const imamiSerije = new Set(clanovi.filter((c) => c.imam).map((c) => c.imam));
    if (imamiSerije.size === 1) {
      const [slug] = imamiSerije;
      for (const c of clanovi) if (!c.imam) Object.assign(c, { imam: slug, imamPotvrdjen: false });
    }
  }

  // kategorija + naslov fallback + ostale ispravke
  for (const v of lista) {
    const r = config.kategorijePravila.find((r) => pravilo(r, v));
    if (r) v.kategorija = r.kategorija;
    const isp = ispravke[v.id] || {};
    if ('kategorija' in isp) v.kategorija = isp.kategorija;

    if (v.tip === 'short' && /^\d{1,2}\s+\p{L}+\s+\d{4}$/u.test(v.naslov.trim())) {
      v.naslovCist = `Kratki video (${formatDatumBs(v.datum)})`;
    }
    if (!v.naslovCist) {
      const d = datumIzTeksta(v.naslov, v._sirovOpis) || formatDatumBs(v.datum);
      v.naslovCist = v.kategorija === 'hutba' ? `Hutba ${d}` : `Video ${d}`;
    }
    if ('naslovCist' in isp) v.naslovCist = isp.naslovCist;
    if ('opis' in isp) v.opis = isp.opis;
    if (v.trajanje === 0) upozorenja.push(`${v.id}: trajanje nepoznato (0) — podatak iz RSS-a`);
  }

  lista.sort(
    (a, b) =>
      (b.datum || '').localeCompare(a.datum || '') || b._ts - a._ts || (b.serijaDio ?? 0) - (a.serijaDio ?? 0) || a.id.localeCompare(b.id),
  );

  const predavanja = lista.map(({ id, naslov, naslovCist, datum, trajanje, thumbnail, imam, imamPotvrdjen, kategorija, serija, serijaDio, opis, pregledi }) => ({
    id, naslov, naslovCist, datum, trajanje, thumbnail, imam, imamPotvrdjen, kategorija, serija, serijaDio, opis, pregledi,
  }));

  const koristeni = new Set(predavanja.map((p) => p.imam).filter(Boolean));
  const imamiOut = imami
    .filter((i) => koristeni.has(i.slug))
    .map((i) => ({
      slug: i.slug,
      punoIme: i.punoIme,
      aliasi: [...aliasiNadjeni.get(i.slug)].filter((a) => a && a !== i.punoIme),
    }));
  // imam iz ispravki koji ne postoji u configu
  for (const slug of koristeni) {
    if (!imamiOut.some((i) => i.slug === slug)) {
      upozorenja.push(`Imam "${slug}" (iz ispravki) nije u podaci-config.json — dodat sa privremenim imenom`);
      imamiOut.push({ slug, punoIme: slug.split('-').map((x) => x[0].toUpperCase() + x.slice(1)).join(' '), aliasi: [] });
    }
  }

  const koristeneSerije = new Set(predavanja.map((p) => p.serija).filter(Boolean));
  const serije = [...serijeMapa.values()].filter((s) => koristeneSerije.has(s.slug));
  for (const slug of koristeneSerije) {
    if (!serijeMapa.has(slug)) {
      upozorenja.push(`Serija "${slug}" (iz ispravki) nije definisana — dodata sa privremenim nazivom`);
      serije.push({ slug, naziv: slug.replace(/-/g, ' '), opis: null });
    }
  }

  const kategorije = config.kategorije.map(({ slug, naziv, opis }) => ({ slug, naziv, opis: opis ?? null }));
  for (const p of predavanja) {
    if (!kategorije.some((k) => k.slug === p.kategorija)) {
      upozorenja.push(`Kategorija "${p.kategorija}" (${p.id}) nije definisana — dodata`);
      kategorije.push({ slug: p.kategorija, naziv: p.kategorija, opis: null });
    }
  }

  return { predavanja, imami: imamiOut, kategorije, serije, upozorenja };
}

/** Provjera tipova i referenci; vraća listu grešaka. */
export function provjeri({ predavanja, imami, kategorije, serije }) {
  const greske = [];
  const im = new Set(imami.map((i) => i.slug));
  const ka = new Set(kategorije.map((k) => k.slug));
  const se = new Set(serije.map((s) => s.slug));
  const ids = new Set();
  for (const p of predavanja) {
    const g = (msg) => greske.push(`${p.id}: ${msg}`);
    if (ids.has(p.id)) g('duplikat');
    ids.add(p.id);
    if (typeof p.naslov !== 'string' || !p.naslov) g('naslov');
    if (typeof p.naslovCist !== 'string' || !p.naslovCist) g('naslovCist');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(p.datum || '')) g('datum');
    if (!Number.isInteger(p.trajanje) || p.trajanje < 0) g('trajanje');
    if (typeof p.thumbnail !== 'string') g('thumbnail');
    if (p.imam !== null && !im.has(p.imam)) g(`imam ${p.imam} ne postoji`);
    if (typeof p.imamPotvrdjen !== 'boolean') g('imamPotvrdjen');
    if (p.imam === null && p.imamPotvrdjen) g('imamPotvrdjen bez imama');
    if (!ka.has(p.kategorija)) g(`kategorija ${p.kategorija} ne postoji`);
    if (p.serija !== null && !se.has(p.serija)) g(`serija ${p.serija} ne postoji`);
    if (p.serijaDio !== null && !Number.isInteger(p.serijaDio)) g('serijaDio');
    if (p.opis !== null && typeof p.opis !== 'string') g('opis');
    if (p.pregledi !== null && !Number.isInteger(p.pregledi)) g('pregledi');
  }
  for (const i of imami) if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(i.slug) || !i.punoIme || !Array.isArray(i.aliasi)) greske.push(`imam ${i.slug}: neispravan`);
  return greske;
}
