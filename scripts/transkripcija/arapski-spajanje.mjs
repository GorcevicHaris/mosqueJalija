// Spajanje arapskog prolaza (whisper -l ar) sa bosanskim transkriptom.
//
// planArapski() pravi plan izmjena (koji bosanski segmenti se uklanjaju ili skraćuju, koji arapski
// segmenti se dodaju), a primijeni() ga primjenjuje na niz segmenata — isti plan se može primijeniti
// i na bosansku i na englesku verziju (iste granice segmenata), uz prevod na odgovarajućem jeziku.
//
// Pravila (konzervativno — ništa se ne izmišlja):
// - arapski red whispera se prihvata samo tamo gdje bosanski prolaz NIJE dao jasan bosanski govor
//   (oznaka, arapsko pismo, transliteracija, „progutan“ dio, rupa) i ako nije poznata halucinacija;
// - bosanski segment se uklanja samo ako je oznaka/arapski/transliteracija/progutan i arapski ga pokriva;
// - miješani segment (arapski pa bosanski, ili obrnuto) se dijeli na granici iz finih segmenata
//   sirovog izlaza; bosanski dio teksta ostaje nepromijenjen;
// - poznati tekstovi (arapski-tekstovi.mjs) dobijaju tačan tekst sa harakatima i prevod; ostalo
//   ostaje kako je whisper prepoznao, bez prevoda, sa "provjeriti": true.

import { prepoznaj, spojiPrevode } from './arapski-tekstovi.mjs';
import { jeArapskiGovor, jeBosanski, sirovISegmenti, vrstaTeksta } from './arapski-obrada.mjs';

const r1 = (x) => Math.round(x * 10) / 10;
const presjek = (a, b) => Math.max(0, Math.min(a.do, b.do) - Math.max(a.od, b.od));

// poslije ovih dijelova je prirodna granica segmenta (uvod hutbe se dijeli na 3–5 odlomaka)
const GRANICE = new Set([
  'hamd', 'hamd-b', 'hamd-t', 'hamd-jehikku', 'uputa', 'sehadet2', 'sehadet2-n', 'sehadet2-habib', 'sehadet2-sejjid', 'terekena',
  'salavat-teslim', 'kerihe-musrikun', 'men-sare', 'men-tebiahum', 'ridvan', 'emma-bad', 'fe-emma-bad', 'summe-emma-bad', '3:102',
  'nefeani', 'festagfiruhu', 'amin', 'sadaka', 'fatiha-2-5', 'fatiha-6-7', '3:18', '33:56', '2:201', '12:3',
]);

/** true = sve rečenice teksta su arapske (arapsko pismo ili transliteracija), bez bosanskog dijela. */
export function samoArapski(tekst) {
  const dijelovi = String(tekst).match(/[^.!?…]+[.!?…]*["“”»]?\s*/g) || [tekst];
  return dijelovi.every((d) => ['ar', 'translit', 'oznaka'].includes(vrstaTeksta(d)));
}

/** Ukloni arapski/transliterisani početak (strana 'pocetak') ili kraj ('kraj') teksta; ostatak se ne mijenja. */
export function odrezi(tekst, strana) {
  const t = String(tekst);
  // rečenice sa interpunkcijom koja ostaje uz rečenicu
  const dijelovi = t.match(/[^.!?…]+[.!?…]*["“”»]?\s*/g) || [t];
  // „Amin, ja Rabbel-alemin.“ je ustaljeno u bosanskom tekstu dove — ostaje uz bosanski dio
  // (miješana rečenica — arapski citat pa prevod — ne uklanja se cijela, samo arapski početak/kraj)
  const arapski = (d) => ['ar', 'translit', 'oznaka'].includes(vrstaTeksta(d)) && !/^\s*amin\b/i.test(d);
  if (strana === 'pocetak') {
    let i = 0;
    while (i < dijelovi.length - 1 && arapski(dijelovi[i])) i++;
    let ostatak = dijelovi.slice(i).join('');
    // arapsko pismo bez interpunkcije ispred latinice
    ostatak = ostatak.replace(/^\s*[„“"«]?\s*[\u0600-\u06FF][\s\u0600-\u06FF\u06DD،؛.:“”"»–-]*(?=[A-Za-zÀ-ž„"])/u, '');
    return ostatak.trim().replace(/^(\p{Ll})/u, (c) => c.toUpperCase());
  }
  let j = dijelovi.length;
  while (j > 1 && arapski(dijelovi[j - 1])) j--;
  let ostatak = dijelovi.slice(0, j).join('');
  ostatak = ostatak.replace(/\s+[„“"«]?\s*[\u0600-\u06FF][\s\u0600-\u06FF\u06DD،؛.:“”"»–-]*$/u, '');
  return ostatak.trim();
}

/**
 * @param {{od,do,tekst,jezik?}[]} segmenti  bosanski segmenti (bez arapskih)
 * @param {{segmenti: {od,do,tekst,smece,lid}[]}} prolaz  rezultat arapskog prolaza
 * @param {{od,do,tekst}[]} [sirovi]  fini segmenti bosanskog prolaza
 * @returns {{ ukloni: number[], skrati: {i:number, od?:number, do?:number, strana:'pocetak'|'kraj'}[], dodaj: object[] }}
 */
export function planArapski(segmenti, prolaz, sirovi = []) {
  // 1) dozvoljene zone: sve što nije jasan bosanski govor
  //    - rupe između segmenata;
  //    - cijeli segment koji je oznaka / arapsko pismo / transliteracija / „progutan“;
  //    - kod miješanog ili bosanskog segmenta samo arapski POČETAK ili KRAJ (fini segmenti sirovog
  //      izlaza), i to samo ako tekst zaista počinje/završava arapskim (odrezi mijenja tekst);
  //      arapski citat usred bosanske rečenice ostaje u tekstu kakav jeste.
  const zone = [];
  let prev = 0;
  const bosanskiDijelovi = []; // vremena jasnog bosanskog govora
  const cijeli = new Set(); // indeksi segmenata koji su u potpunosti „arapski“
  segmenti.forEach((s, i) => {
    if (s.od - prev > 0.3) zone.push({ od: prev, do: s.od, i: -1, rupa: true });
    prev = Math.max(prev, s.do);
    const v = vrstaTeksta(s.tekst);
    // „progutan“ segment (malo riječi na dugo vrijeme) se zamjenjuje samo ako je to par riječi
    // („Al-Fatiha.“, „Sallallahu alejhi ve sellem.“); duži bosanski tekst ostaje (dijeli se po finim segmentima)
    const progutan = v === 'bs' && !jeBosanski(s) && s.tekst.split(/\s+/).length <= 4;
    if (v === 'oznaka' || v === 'ar' || v === 'translit' || progutan || (v === 'mjesovito' && samoArapski(s.tekst))) {
      zone.push({ od: s.od, do: s.do, i });
      cijeli.add(i);
      return;
    }
    const unutra = sirovi.filter((x) => presjek(x, s) > 0.5 * (x.do - x.od));
    if (!unutra.length) {
      bosanskiDijelovi.push({ od: s.od, do: s.do, i });
      return;
    }
    const ne = (x) => !jeBosanski(x);
    let a = 0;
    while (a < unutra.length && ne(unutra[a])) a++;
    let b = unutra.length;
    while (b > a && ne(unutra[b - 1])) b--;
    const imaPocetak = a > 0 && odrezi(s.tekst, 'pocetak') !== s.tekst.trim();
    const imaKraj = b < unutra.length && odrezi(s.tekst, 'kraj') !== s.tekst.trim();
    unutra.forEach((x, k) => {
      if ((k < a && imaPocetak) || (k >= b && imaKraj)) zone.push({ od: Math.max(x.od, s.od - 0.5), do: Math.min(x.do, s.do + 0.5), i, unutar: true });
      else bosanskiDijelovi.push({ od: x.od, do: x.do, i });
    });
  });
  zone.push({ od: prev, do: Infinity, i: -1, rupa: true });

  // 2) prihvaćeni redovi, odsječeni na dozvoljenu zonu
  const redovi = [];
  for (const s of prolaz.segmenti || []) {
    if (s.smece || !jeArapskiGovor(s.lid)) continue;
    const z = zone.filter((x) => presjek(x, s) > 0).sort((a, b) => presjek(b, s) - presjek(a, s))[0];
    if (!z) continue;
    const pokriveno = zone.reduce((n, x) => n + presjek(x, s), 0);
    if (pokriveno < 0.5 * (s.do - s.od)) continue;
    // u rupi usred bosanskog govora -l ar često „čuje“ besmislice: tu samo duži redovi ili poznat tekst
    if (z.rupa && (s.do - s.od < 2.5 || s.tekst.split(/\s+/).length < 3) && !prepoznaj(s.tekst).sve) continue;
    let od = Math.max(s.od, ...bosanskiDijelovi.filter((b) => b.do <= s.do && b.do > s.od).map((b) => b.do));
    let d = Math.min(s.do, ...bosanskiDijelovi.filter((b) => b.od >= s.od && b.od < s.do).map((b) => b.od));
    if (d - od < 0.4) continue;
    redovi.push({ od, do: d, tekst: s.tekst });
  }
  // 2b) rezerva: dio koji je bosanski prolaz već napisao arapskim pismom, a arapski prolaz ga nije
  //     (pouzdano) prepoznao → koristi taj tekst (lektorisani segment ili fini segment sirovog izlaza)
  const pokrivenoRedovima = (z) => redovi.reduce((n, r) => n + presjek(r, z), 0);
  for (const z of zone) {
    if (z.rupa || z.i < 0) continue;
    if (pokrivenoRedovima(z) >= 0.5 * (z.do - z.od)) continue;
    const s = segmenti[z.i];
    if (!z.unutar && vrstaTeksta(s.tekst) === 'ar') {
      redovi.push({ od: s.od, do: s.do, tekst: s.tekst, rezerva: true });
      continue;
    }
    for (const x of sirovi.filter((x) => presjek(x, z) > 0.5 * (x.do - x.od) && vrstaTeksta(x.tekst) === 'ar')) {
      // zalutala latinična slova u arapskoj riječi („قولi“) i numeracija rečenica („1. …“) se brišu
      const tekst = x.tekst.replace(/[A-Za-z]+/g, '').replace(/(^|\s)\d{1,2}\.\s+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!pokrivenoRedovima(x)) redovi.push({ od: x.od, do: x.do, tekst, rezerva: true });
    }
  }
  redovi.sort((a, b) => a.od - b.od);

  // 3) nizovi uzastopnih redova (bez bosanskog govora između)
  const nizovi = [];
  for (const r of redovi) {
    const z = nizovi[nizovi.length - 1];
    const izmedju = z && bosanskiDijelovi.some((b) => b.od >= z[z.length - 1].do - 0.2 && b.do <= r.od + 0.2);
    if (z && r.od - z[z.length - 1].do < 4 && !izmedju) z.push(r);
    else nizovi.push([r]);
  }

  // 4) arapski segmenti: poznati dijelovi → tačan tekst + prevod; ostalo → whisper tekst, provjeriti
  const dodaj = [];
  for (const niz of nizovi) {
    const { dijelovi } = prepoznaj(niz);
    let tren = null;
    const zatvori = () => {
      if (tren) dodaj.push(tren);
      tren = null;
    };
    for (const d of dijelovi) {
      const poznat = !d.nepoznato;
      if (tren && tren.poznat !== poznat) zatvori();
      if (!tren) tren = { od: d.od, do: d.do, poznat, ar: [], bs: [], en: [], kljucevi: [] };
      tren.do = d.do;
      if (poznat) {
        tren.ar.push(d.ar);
        tren.bs.push(d.bs);
        tren.en.push(d.en);
        tren.kljucevi.push(d.kljuc);
        if ((GRANICE.has(d.kljuc) && tren.do - tren.od >= 8) || tren.do - tren.od >= 35) zatvori();
      } else {
        // nepoznati tekst: originalni redovi whispera (sa interpunkcijom) koji padaju u ovaj dio
        const ori = niz.filter((r) => r.do > d.od + 0.05 && r.od < d.do - 0.05).map((r) => r.tekst);
        tren.ar.push(ori.length ? ori.join(' ') : d.nepoznato);
        if (tren.do - tren.od >= 30) zatvori();
      }
    }
    zatvori();
  }
  // isti red ne smije biti dva puta (nepoznati dio uzima cijele redove)
  for (const s of dodaj) s.ar = s.ar.filter((x, i, a) => a.indexOf(x) === i);
  // kratak ostatak (< 4 s, npr. „أَمَّا بَعْدُ“) pripaja se prethodnom susjednom segmentu iste vrste
  for (let i = dodaj.length - 1; i > 0; i--) {
    const a = dodaj[i - 1];
    const b = dodaj[i];
    if (b.do - b.od < 4 && a.poznat === b.poznat && b.od - a.do < 1 && b.do - a.od <= 45) {
      a.do = b.do;
      a.ar.push(...b.ar);
      a.bs.push(...b.bs);
      a.en.push(...b.en);
      a.kljucevi.push(...b.kljucevi);
      dodaj.splice(i, 1);
    }
  }

  const arSeg = dodaj
    .map((s) => {
      const seg = { od: r1(s.od), do: r1(s.do), tekst: s.ar.join(' ').replace(/\s+/g, ' ').trim(), jezik: 'ar' };
      if (s.poznat) {
        seg.prevod = { bs: spojiPrevode(s.bs), en: spojiPrevode(s.en) };
        seg.kljucevi = s.kljucevi;
      } else seg.provjeriti = true;
      return seg;
    })
    .filter((s) => s.do > s.od);

  // 5) bosanski segmenti: ukloni pokrivene oznake/arapske/progutane; skrati miješane
  const ukloni = [];
  const skrati = [];
  segmenti.forEach((s, i) => {
    const pokr = arSeg.reduce((n, a) => n + presjek(a, s), 0);
    if (!pokr) return;
    if (cijeli.has(i)) {
      const v = vrstaTeksta(s.tekst);
      // arapsko pismo / oznaka / transliteracija / progutano: arapski prolaz preuzima to vrijeme
      if (pokr >= 0.3 * (s.do - s.od) || v === 'oznaka') ukloni.push(i);
      return;
    }
    const bos = bosanskiDijelovi.filter((b) => b.i === i);
    if (!bos.length) return;
    const bOd = Math.min(...bos.map((b) => b.od));
    const bDo = Math.max(...bos.map((b) => b.do));
    const prije = arSeg.filter((a) => presjek(a, s) > 0 && a.do <= bOd + 0.5);
    const poslije = arSeg.filter((a) => presjek(a, s) > 0 && a.od >= bDo - 0.5);
    if (prije.length) skrati.push({ i, od: r1(Math.max(s.od, bOd)), strana: 'pocetak' });
    if (poslije.length) skrati.push({ i, do: r1(Math.min(s.do, bDo)), strana: 'kraj' });
  });
  return { ukloni, skrati, dodaj: arSeg };
}

/**
 * Primijeni plan na segmente (bosanske ili engleske — isti indeksi i vremena).
 * @param {'bs'|'en'} jezikPrevoda  koji prevod arapskih segmenata upisati
 */
export function primijeni(segmenti, plan, jezikPrevoda = 'bs') {
  const ukloni = new Set(plan.ukloni);
  const out = [];
  segmenti.forEach((s, i) => {
    if (ukloni.has(i)) return;
    let n = { ...s };
    for (const k of plan.skrati.filter((x) => x.i === i)) {
      if (k.tekst && typeof k.tekst === 'object') n.tekst = k.tekst[jezikPrevoda] ?? n.tekst;
      else n.tekst = odrezi(n.tekst, k.strana);
      if (k.od != null) n.od = k.od;
      if (k.do != null) n.do = k.do;
    }
    if (n.tekst && n.do > n.od) out.push(n);
  });
  for (const a of plan.dodaj) {
    const seg = { od: a.od, do: a.do, tekst: a.tekst, jezik: 'ar' };
    const p = a.prevod && (typeof a.prevod === 'string' ? a.prevod : a.prevod[jezikPrevoda]);
    if (p) seg.prevod = p;
    if (a.provjeriti) seg.provjeriti = true;
    out.push(seg);
  }
  out.sort((a, b) => a.od - b.od || a.do - b.do);
  // bez preklapanja: arapski segment se skraćuje na granicu susjednog bosanskog
  for (let i = 1; i < out.length; i++) {
    const a = out[i - 1];
    const b = out[i];
    if (b.od < a.do) {
      if (a.jezik === 'ar' && b.jezik !== 'ar') a.do = b.od;
      else b.od = a.do;
    }
  }
  return out.filter((s) => s.do - s.od > 0.05);
}

/** Za transkribuj.mjs/arapski.mjs: upiši arapske segmente u automatski transkript. */
export function spojiArapski(t, prolaz, sirovo) {
  const bs = t.segmenti.filter((s) => s.jezik !== 'ar');
  const plan = planArapski(bs, prolaz, sirovISegmenti(sirovo));
  return { ...t, arapski: new Date().toISOString().slice(0, 10), segmenti: primijeni(bs, plan, 'bs') };
}
