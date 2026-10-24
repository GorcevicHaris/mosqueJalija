#!/usr/bin/env node
// Osvježava data/predavanja.json, data/imami.json, data/kategorije.json, data/serije.json
// sa YouTube kanala džamije. Bez npm zavisnosti; treba yt-dlp (env YTDLP ili na PATH-u).
//
// Upotreba:
//   node scripts/update-videos.mjs            # nova videa + osvježi preglede/naslove
//   node scripts/update-videos.mjs --sve      # ponovo preuzmi detalje SVIH videa
//   node scripts/update-videos.mjs --dry-run  # samo prikaži šta bi se promijenilo, ništa ne piši
//   node scripts/update-videos.mjs --offline  # bez mreže: samo ponovo primijeni pravila na keš
//   node scripts/update-videos.mjs --rss      # preskoči yt-dlp, koristi samo RSS (test rezerve)
//
// Detalji: docs/predavanja-podaci.md
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ytdlpVerzija, listaTaba, playlisteKanala, detaljiVidea, rssKanala, imaMaxres } from './lib/youtube.mjs';
import { izgradi, provjeri } from './lib/heuristike.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = {
  config: join(ROOT, 'scripts/podaci-config.json'),
  kes: join(ROOT, 'scripts/cache/youtube-sirovo.json'),
  ispravke: join(ROOT, 'data/predavanja-ispravke.json'),
  predavanja: join(ROOT, 'data/predavanja.json'),
  imami: join(ROOT, 'data/imami.json'),
  kategorije: join(ROOT, 'data/kategorije.json'),
  serije: join(ROOT, 'data/serije.json'),
};

const args = new Set(process.argv.slice(2));
const POZNATE = new Set(['--sve', '--dry-run', '--offline', '--rss']);
const nepoznate = [...args].filter((a) => !POZNATE.has(a));
if (nepoznate.length || args.has('--help')) {
  const uputstvo = readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(4, 11).join('\n');
  if (nepoznate.length && !args.has('--help')) console.error(`Nepoznata opcija: ${nepoznate.join(' ')}\n`);
  console.log(uputstvo.replace(/^\/\/ ?/gm, ''));
  process.exit(args.has('--help') ? 0 : 1);
}
const DRY = args.has('--dry-run');
const SVE = args.has('--sve');
const OFFLINE = args.has('--offline');
const SAMO_RSS = args.has('--rss');

const citaj = (f, def) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : def);
const pisi = (f, data) => {
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
};
const log = (...a) => console.log(...a);

async function main() {
  const config = citaj(P.config);
  const ispravkeSve = citaj(P.ispravke, {});
  const ispravke = Object.fromEntries(Object.entries(ispravkeSve).filter(([k]) => !k.startsWith('_')));
  const kes = citaj(P.kes, { azurirano: null, playliste: [], videi: {} });
  const prethodna = citaj(P.predavanja, []).filter((p) => !/^PRIMJER/.test(p.naslov));
  const prethodniIds = new Set(prethodna.map((p) => p.id));
  const kanalUrl = config.kanal.url;

  let izvor = 'keš';
  let listaPotpuna = false; // true = imamo autoritativnu listu svih videa kanala
  const uklonjeni = [];
  const preskoceni = [];

  if (!OFFLINE) {
    let ytOk = false;
    if (!SAMO_RSS) {
      const ver = ytdlpVerzija();
      if (!ver) log('! yt-dlp nije dostupan — prelazim na RSS');
      else {
        log(`yt-dlp ${ver}`);
        try {
          log('Lista videa (Videos + Shorts)...');
          const flat = [...listaTaba(kanalUrl, 'videos'), ...listaTaba(kanalUrl, 'shorts')];
          if (flat.length === 0) throw new Error('prazna lista videa');
          log(`  ${flat.length} videa na kanalu`);
          try {
            log('Playliste...');
            kes.playliste = playlisteKanala(kanalUrl);
            log(`  ${kes.playliste.length} playlista`);
          } catch (e) {
            log(`  ! playliste nisu učitane (${e.message}) — koristim keš`);
          }
          const naKanalu = new Set(flat.map((f) => f.id));
          for (const f of flat) {
            const r = (kes.videi[f.id] ||= { id: f.id, detaljno: false });
            if (f.naslov) r.naslov = f.naslov;
            if (f.pregledi != null) r.pregledi = f.pregledi;
            if (f.trajanje != null && !r.detaljno) r.trajanje = f.trajanje;
            if (f.timestamp && !r.timestamp) r.timestamp = f.timestamp;
            r.tip = f.tip;
          }
          const zaDetalje = flat.filter((f) => SVE || !kes.videi[f.id].detaljno || !kes.videi[f.id].datum).map((f) => f.id);
          log(`Detalji za ${zaDetalje.length} videa...`);
          const { rezultati, neuspjeli } = detaljiVidea(zaDetalje);
          for (const d of rezultati) {
            const r = kes.videi[d.id] || (kes.videi[d.id] = { id: d.id });
            Object.assign(r, {
              naslov: d.naslov ?? r.naslov,
              opis: d.opis,
              datum: d.datum ?? r.datum,
              timestamp: d.timestamp ?? r.timestamp ?? null,
              trajanje: d.trajanje ?? r.trajanje ?? null,
              pregledi: d.pregledi ?? r.pregledi ?? null,
              tip: r.tip === 'short' || d.tip === 'short' ? 'short' : 'video',
              detaljno: true,
              izvor: 'yt-dlp',
            });
          }
          for (const id of neuspjeli) log(`  ! detalji nisu preuzeti za ${id} — zadržavam postojeće podatke`);
          // uklonjena videa (obrisana/privatna)
          const kandidati = Object.keys(kes.videi).filter((id) => !naKanalu.has(id));
          if (kandidati.length && kandidati.length <= Math.max(3, Object.keys(kes.videi).length * 0.2)) {
            for (const id of kandidati) {
              uklonjeni.push(`${id} ${kes.videi[id].naslov || ''}`);
              delete kes.videi[id];
            }
          } else if (kandidati.length) {
            log(`  ! ${kandidati.length} videa iz keša nema na listi — previše za sigurno brisanje, zadržavam ih`);
          }
          listaPotpuna = true;
          ytOk = true;
          izvor = 'yt-dlp';
        } catch (e) {
          log(`! yt-dlp nije uspio: ${e.message}`);
        }
      }
    }
    if (!ytOk) {
      try {
        log('RSS feed kanala (zadnjih 15 videa)...');
        const rss = await rssKanala(config.kanal.channelId);
        let novih = 0;
        for (const d of rss) {
          const r = kes.videi[d.id];
          if (r) {
            if (d.naslov) r.naslov = d.naslov;
            if (d.pregledi != null) r.pregledi = d.pregledi;
            if (!r.detaljno && d.opis) r.opis = d.opis;
          } else {
            // trajanje iz ranijeg data/predavanja.json ako postoji, inače nepoznato (0)
            const stari = prethodna.find((p) => p.id === d.id);
            kes.videi[d.id] = { ...d, trajanje: stari?.trajanje || null, detaljno: false, izvor: 'rss' };
            if (!stari) novih++;
          }
        }
        log(`  ${rss.length} u feedu, ${novih} novih (trajanje nepoznato = 0)`);
        izvor = 'rss';
      } catch (e) {
        log(`! RSS nije uspio: ${e.message} — koristim samo keš`);
      }
    }

    // sličice: maxresdefault samo ako postoji
    const zaSlicice = Object.values(kes.videi).filter((r) => r.tip !== 'short' && r.maxres == null);
    if (zaSlicice.length) {
      log(`Provjera maxres sličica (${zaSlicice.length})...`);
      for (let i = 0; i < zaSlicice.length; i += 8) {
        await Promise.all(zaSlicice.slice(i, i + 8).map(async (r) => (r.maxres = await imaMaxres(r.id))));
      }
    }
  }

  // sirovi zapisi bez datuma se ne mogu prikazati
  const sirovi = {};
  for (const [id, r] of Object.entries(kes.videi)) {
    if (!r.datum && r.timestamp) r.datum = new Date(r.timestamp * 1000).toISOString().slice(0, 10);
    if (!r.datum) {
      preskoceni.push(`${id} ${r.naslov || ''} (nema datuma)`);
      continue;
    }
    sirovi[id] = r;
  }

  const rez = izgradi(sirovi, kes.playliste, config, ispravke);

  // zadrži stare zapise koje nismo mogli ponovo preuzeti (samo kad lista nije potpuna)
  if (!listaPotpuna) {
    const ima = new Set(rez.predavanja.map((p) => p.id));
    const imami = new Set(rez.imami.map((i) => i.slug));
    const kat = new Set(rez.kategorije.map((k) => k.slug));
    const ser = new Set(rez.serije.map((s) => s.slug));
    const stariImami = citaj(P.imami, []);
    const stareSerije = citaj(P.serije, []);
    for (const p of prethodna) {
      if (ima.has(p.id)) continue;
      if (p.imam && !imami.has(p.imam)) {
        const s = stariImami.find((i) => i.slug === p.imam);
        if (s) (rez.imami.push(s), imami.add(s.slug));
        else p.imam = null;
      }
      if (p.serija && !ser.has(p.serija)) {
        const s = stareSerije.find((x) => x.slug === p.serija);
        if (s) (rez.serije.push(s), ser.add(s.slug));
        else (p.serija = null), (p.serijaDio = null);
      }
      if (!kat.has(p.kategorija)) p.kategorija = config.podrazumijevanaKategorija;
      rez.predavanja.push(p);
    }
    rez.predavanja.sort((a, b) => b.datum.localeCompare(a.datum));
  }

  const greske = provjeri(rez);
  // ---- sažetak
  const brojPo = (kljuc) => {
    const m = new Map();
    for (const p of rez.predavanja) m.set(p[kljuc] ?? '(nema)', (m.get(p[kljuc] ?? '(nema)') || 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}: ${n}`).join(', ');
  };
  const nova = rez.predavanja.filter((p) => !prethodniIds.has(p.id));
  log('\n=== Sažetak ===');
  log(`Izvor: ${izvor}${DRY ? ' (dry-run, ništa nije zapisano)' : ''}`);
  log(`Predavanja: ${rez.predavanja.length} | imami: ${rez.imami.length} | kategorije: ${rez.kategorije.length} | serije: ${rez.serije.length}`);
  log(`Po imamu: ${brojPo('imam')}`);
  log(`Po kategoriji: ${brojPo('kategorija')}`);
  log(`Po seriji: ${brojPo('serija')}`);
  log(`Novih videa: ${nova.length}`);
  for (const p of nova.slice(0, 50)) log(`  + ${p.datum} ${p.id} ${p.naslovCist} [${p.kategorija}${p.imam ? ', ' + p.imam : ''}]`);
  const nepotvrdjeni = rez.predavanja.filter((p) => p.imam && !p.imamPotvrdjen);
  const bezImama = rez.predavanja.filter((p) => !p.imam);
  log(`Imam pogođen (nepotvrđen): ${nepotvrdjeni.length}`);
  for (const p of nepotvrdjeni) log(`  ? ${p.id} ${p.naslovCist} -> ${p.imam}`);
  log(`Bez imama: ${bezImama.length}`);
  for (const p of bezImama) log(`  - ${p.id} ${p.naslov}`);
  if (uklonjeni.length) log(`Uklonjeno sa kanala: ${uklonjeni.length}\n  ${uklonjeni.join('\n  ')}`);
  if (preskoceni.length) log(`Preskočeno: ${preskoceni.length}\n  ${preskoceni.join('\n  ')}`);
  if (rez.upozorenja.length) log(`Upozorenja:\n  ${[...new Set(rez.upozorenja)].join('\n  ')}`);
  if (greske.length) {
    console.error(`\nGREŠKE u podacima (ništa nije zapisano):\n  ${greske.join('\n  ')}`);
    process.exit(1);
  }
  if (DRY) return;

  kes.azurirano = new Date().toISOString();
  pisi(P.kes, kes);
  pisi(P.predavanja, rez.predavanja);
  pisi(P.imami, rez.imami);
  pisi(P.kategorije, rez.kategorije);
  pisi(P.serije, rez.serije);
  if (!existsSync(P.ispravke)) pisi(P.ispravke, { _uputstvo: 'Vidi docs/predavanja-podaci.md' });
  log('\nZapisano: data/predavanja.json, data/imami.json, data/kategorije.json, data/serije.json, scripts/cache/youtube-sirovo.json');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
