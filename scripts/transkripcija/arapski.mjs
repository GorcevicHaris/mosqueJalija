#!/usr/bin/env node
// Drugi korak transkripcije: arapski dijelovi (uvod i završetak hutbe, ajeti, hadisi, dove).
// Pokreće se poslije bosanske transkripcije (transkribuj.mjs to radi sam, osim uz --bez-arapskog).
//
//   node scripts/transkripcija/arapski.mjs --id tb5geb6Gxcg   # jedan video (može više puta --id)
//   node scripts/transkripcija/arapski.mjs                    # svi videi bez arapskog prolaza
//   node scripts/transkripcija/arapski.mjs --force --id X     # ponovi arapski prolaz
//   node scripts/transkripcija/arapski.mjs --samo-prolaz      # samo whisper -l ar (bez upisa u data/)
//   node scripts/transkripcija/arapski.mjs --samo-spajanje    # samo ponovo upiši sačuvani prolaz u data/transkripti/
//
// 1. kandidatski dijelovi (početak ~3 min, kraj ~2 min, oznake, arapsko pismo, transliteracija,
//    rupe ≥ 3 s) iz bosanskog transkripta → isječci 16 kHz mono wav (±1 s);
// 2. whisper-cli -l ar na svim isječcima (jedno učitavanje modela);
// 3. filtriranje: poznate halucinacije, provjera jezika (whisper -dl): ako je govor sigurno
//    bosanski, arapski tekst se odbacuje (-l ar bi ga „preveo“ ili izmislio);
// 4. upis u data/transkripti/<id>.json: arapski dijelovi postaju segmenti
//    { od, do, tekst, jezik: "ar", prevod?, izvor?, provjeriti? }; poznati tekstovi (uvod hutbe,
//    završne dove, česti ajeti — arapski-tekstovi.mjs) dobijaju tačan tekst sa harakatima i prevod.
//
// Rezultat prolaza (sirovo) je u radnom folderu: <RAD>/arapski/<id>.json. Lektorisane verzije
// (data/transkripti-lektura/, data/transkripti-en/) skripta NE dira — vidi docs/transkripcija.md.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { homedir, cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { kandidati, jeSmeceAr, jeArapskiGovor, sirovISegmenti } from './arapski-obrada.mjs';
import { spojiArapski } from './arapski-spajanje.mjs';

const KORIJEN = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IZLAZ = join(KORIJEN, 'data/transkripti');
const RAD = process.env.JALIJA_TRANSKRIPCIJA_DIR || join(homedir(), 'Library/Caches/jalija-transkripcija');
const MODELI = join(RAD, 'models');
const AUDIO = join(RAD, 'audio');
const WAV = join(RAD, 'wav');
const SIROVO = join(RAD, 'raw');
const ARAPSKI = join(RAD, 'arapski');

// Benchmark (docs/transkripcija.md): large-v3 je na arapskom uvodu hutbe tačniji od turbo modela.
const MODEL = process.env.WHISPER_MODEL_AR || 'ggml-large-v3.bin';
const VAD_MODEL = 'ggml-silero-v5.1.2.bin';
const LID_MODEL = process.env.WHISPER_MODEL_LID || 'ggml-large-v3-turbo.bin';

// ---------- argumenti ----------
const argv = process.argv.slice(2);
const opt = { ids: [], limit: Infinity, force: false, samoProlaz: false, samoSpajanje: false, osnova: 'automatski' };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--id') opt.ids.push(argv[++i]);
  else if (a === '--limit') opt.limit = Number(argv[++i]);
  else if (a === '--force') opt.force = true;
  else if (a === '--samo-prolaz') opt.samoProlaz = true;
  else if (a === '--samo-spajanje') opt.samoSpajanje = true;
  else if (a === '--osnova') opt.osnova = argv[++i]; // automatski | lektura (odakle se traže kandidati)
  else if (a === '-h' || a === '--help') {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).join('\n'));
    process.exit(0);
  } else {
    console.error(`Nepoznat argument: ${a}`);
    process.exit(2);
  }
}

// ---------- alati ----------
function nadji(ime, ...kandidatiPut) {
  for (const k of kandidatiPut.filter(Boolean)) if (existsSync(k)) return k;
  const r = spawnSync('/usr/bin/which', [ime], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
const FFMPEG = nadji('ffmpeg', process.env.FFMPEG, '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg');
const WHISPER = nadji('whisper-cli', process.env.WHISPER_CLI, '/opt/homebrew/bin/whisper-cli', '/usr/local/bin/whisper-cli');
const YTDLP = nadji('yt-dlp', process.env.YTDLP, '/opt/homebrew/bin/yt-dlp', '/usr/local/bin/yt-dlp');
const modelPut = join(MODELI, MODEL);
const lidPut = existsSync(join(MODELI, LID_MODEL)) ? join(MODELI, LID_MODEL) : modelPut;
const vadPut = join(MODELI, VAD_MODEL);
const NITI = String(Math.min(8, Math.max(4, cpus().length - 2)));

function pokreni(cmd, args, opis) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${opis} nije uspjelo (kod ${r.status}):\n${(r.stderr || r.stdout || '').slice(-2000)}`);
  return r;
}

function provjeriAlate() {
  const nema = [];
  if (!FFMPEG) nema.push('ffmpeg (brew install ffmpeg)');
  if (!WHISPER) nema.push('whisper-cli (brew install whisper-cpp)');
  if (!existsSync(modelPut))
    nema.push(`model ${modelPut}\n    curl -L -o "${modelPut}" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL}`);
  if (nema.length) {
    console.error('Nedostaje:\n  - ' + nema.join('\n  - '));
    process.exit(1);
  }
}

// ---------- zvuk ----------
function audioZa(id) {
  const f = existsSync(AUDIO) && readdirSync(AUDIO).find((x) => x.startsWith(id + '.') && !x.endsWith('.part'));
  if (f) return join(AUDIO, f);
  if (!YTDLP) throw new Error('nema zvuka u kešu i nema yt-dlp');
  const args = ['-f', 'bestaudio[ext=m4a]/bestaudio', '-o', join(AUDIO, '%(id)s.%(ext)s'), '--no-playlist', '-q', '--no-warnings', '--no-progress'];
  if (/--js-runtimes/.test(spawnSync(YTDLP, ['--help'], { encoding: 'utf8' }).stdout || '')) args.push('--js-runtimes', 'node');
  args.push(`https://www.youtube.com/watch?v=${id}`);
  pokreni(YTDLP, args, 'Preuzimanje zvuka');
  const g = readdirSync(AUDIO).find((x) => x.startsWith(id + '.') && !x.endsWith('.part'));
  if (!g) throw new Error('yt-dlp nije napravio fajl');
  return join(AUDIO, g);
}

/** Cijeli snimak kao 16 kHz mono PCM (Int16Array). */
function ucitajPcm(id) {
  const wav = join(WAV, `${id}.ar.wav`);
  if (!(existsSync(wav) && statSync(wav).size > 1000)) {
    pokreni(FFMPEG, ['-nostdin', '-loglevel', 'error', '-y', '-i', audioZa(id), '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], 'ffmpeg');
  }
  const buf = readFileSync(wav);
  // potraži "data" chunk
  let p = 12;
  while (p < buf.length - 8) {
    const ime = buf.toString('ascii', p, p + 4);
    const vel = buf.readUInt32LE(p + 4);
    if (ime === 'data') return { pcm: new Int16Array(buf.buffer, buf.byteOffset + p + 8, Math.floor(Math.min(vel, buf.length - p - 8) / 2)), wav };
    p += 8 + vel + (vel % 2);
  }
  throw new Error('neispravan wav');
}

function pisiWav(put, pcm, odSek, doSek) {
  const a = Math.max(0, Math.floor(odSek * 16000));
  const b = Math.min(pcm.length, Math.ceil(doSek * 16000));
  const n = Math.max(0, b - a);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n * 2, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(16000, 24);
  h.writeUInt32LE(32000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(n * 2, 40);
  writeFileSync(put, Buffer.concat([h, Buffer.from(pcm.buffer, pcm.byteOffset + a * 2, n * 2)]));
}

// ---------- prolaz ----------
function osnovniSegmenti(id) {
  const lekt = join(KORIJEN, 'data/transkripti-lektura', `${id}.json`);
  const aut = join(IZLAZ, `${id}.json`);
  const put = opt.osnova === 'lektura' && existsSync(lekt) ? lekt : aut;
  if (!existsSync(put)) return null;
  // već spojeni arapski segmenti se ne računaju kao bosanski (ponovni prolaz)
  return JSON.parse(readFileSync(put, 'utf8')).segmenti.filter((s) => s.jezik !== 'ar');
}

function prolaz(id, video) {
  const segmenti = osnovniSegmenti(id);
  if (!segmenti) throw new Error('nema bosanskog transkripta (prvo transkribuj.mjs)');
  const { pcm } = ucitajPcm(id);
  const trajanje = pcm.length / 16000;
  const sirovoPut = join(SIROVO, `${id}.json`);
  const sirovi = existsSync(sirovoPut) ? sirovISegmenti(JSON.parse(readFileSync(sirovoPut, 'utf8'))) : [];
  const kand = kandidati(segmenti, Math.min(trajanje, video?.trajanje || trajanje), sirovi);
  // snimak bez govora (prazan bosanski transkript) → nema ni arapskih dijelova
  if (!segmenti.length || !kand.length) {
    const rez = { id, model: MODEL.replace(/^ggml-|\.bin$/g, ''), generisano: new Date().toISOString(), trajanje, kandidati: [], segmenti: [] };
    writeFileSync(join(ARAPSKI, `${id}.json`), JSON.stringify(rez, null, 1) + '\n');
    return rez;
  }
  const tmp = join(ARAPSKI, 'tmp', id);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  // 2) whisper -l ar na svim isječcima odjednom
  const fajlovi = kand.map((k, i) => {
    const f = join(tmp, `k${String(i).padStart(3, '0')}.wav`);
    pisiWav(f, pcm, k.od, k.do);
    return f;
  });
  const args = ['-m', modelPut, '-l', 'ar', '-t', NITI, '-bs', '5', '-bo', '5', '-mc', '0', '-sns', '-oj', '-np'];
  if (existsSync(vadPut)) args.push('--vad', '-vm', vadPut, '-vt', '0.45', '-vsd', '500', '-vp', '200', '-vmsd', '28');
  for (const f of fajlovi) args.push('-of', f.replace(/\.wav$/, ''));
  const tA = Date.now();
  pokreni(WHISPER, [...args, ...fajlovi], 'whisper-cli -l ar');
  if (process.env.DEBUG) console.error(`\n  whisper -l ar: ${(Date.now() - tA) / 1000} s za ${kand.reduce((x, k) => x + k.do - k.od, 0).toFixed(0)} s zvuka`);

  const ar = [];
  kand.forEach((k, i) => {
    const j = JSON.parse(readFileSync(fajlovi[i].replace(/\.wav$/, '.json'), 'utf8'));
    for (const s of j.transcription || []) {
      const tekst = String(s.text || '').replace(/\s+/g, ' ').trim();
      const od = Math.round((k.od + s.offsets.from / 1000) * 100) / 100;
      const d = Math.round((k.od + s.offsets.to / 1000) * 100) / 100;
      if (d <= od) continue;
      ar.push({ od, do: d, tekst, smece: jeSmeceAr(tekst) });
    }
  });
  // isti segment iz dva preklopljena isječka → zadrži prvi
  ar.sort((a, b) => a.od - b.od);
  const jedinstveni = ar.filter((s, i) => !(i && Math.abs(s.od - ar[i - 1].od) < 0.3 && s.tekst === ar[i - 1].tekst));

  // 3) provjera jezika (whisper -dl) za svaki segment koji nije smeće
  // kratki isječci (< 5 s) daju nasumičnu detekciju jezika — provjeravaju se samo duži
  const zaLid = jedinstveni.filter((s) => !s.smece && s.do - s.od >= 5);
  if (zaLid.length) {
    const lf = zaLid.map((s, i) => {
      const f = join(tmp, `l${String(i).padStart(4, '0')}.wav`);
      pisiWav(f, pcm, s.od - 0.2, Math.min(s.do + 0.2, s.od + 30));
      return f;
    });
    const tL = Date.now();
    const r = spawnSync(WHISPER, ['-m', lidPut, '-l', 'auto', '-dl', '-t', NITI, ...lf], { encoding: 'utf8', maxBuffer: 1 << 28 });
    if (process.env.DEBUG) console.error(`  provjera jezika: ${(Date.now() - tL) / 1000} s za ${lf.length} isječaka`);
    const izlaz = `${r.stderr || ''}\n${r.stdout || ''}`;
    let trenutni = null;
    const lid = new Map();
    for (const red of izlaz.split('\n')) {
      const m = /processing '([^']+)'/.exec(red);
      if (m) trenutni = m[1];
      const d = /auto-detected language: (\w+) \(p = ([\d.]+)\)/.exec(red);
      if (d && trenutni) lid.set(trenutni, { jezik: d[1], p: Number(d[2]) });
    }
    zaLid.forEach((s, i) => {
      s.lid = lid.get(lf[i]) ?? null;
    });
  }
  for (const s of jedinstveni) s.prihvacen = !s.smece && jeArapskiGovor(s.lid);
  rmSync(tmp, { recursive: true, force: true });
  const rez = { id, model: MODEL.replace(/^ggml-|\.bin$/g, ''), generisano: new Date().toISOString(), trajanje, kandidati: kand, segmenti: jedinstveni };
  writeFileSync(join(ARAPSKI, `${id}.json`), JSON.stringify(rez, null, 1) + '\n');
  return rez;
}

// ---------- upis u data/transkripti/<id>.json ----------
function spoji(id, prolazRez) {
  const cilj = join(IZLAZ, `${id}.json`);
  if (!existsSync(cilj)) return false;
  const t = JSON.parse(readFileSync(cilj, 'utf8'));
  if (t.automatski === false) {
    console.log(`  ${id}: ručno ispravljen transkript — ne prepisujem (arapski prolaz je u ${join(ARAPSKI, id + '.json')})`);
    return false;
  }
  const sirovoPut = join(SIROVO, `${id}.json`);
  const sirovo = existsSync(sirovoPut) ? JSON.parse(readFileSync(sirovoPut, 'utf8')) : null;
  const novi = spojiArapski(t, prolazRez, sirovo);
  writeFileSync(cilj + '.tmp', JSON.stringify(novi, null, 1) + '\n');
  renameSync(cilj + '.tmp', cilj);
  return novi;
}

// ---------- glavni tok ----------
const predavanja = JSON.parse(readFileSync(join(KORIJEN, 'data/predavanja.json'), 'utf8')).slice().sort((a, b) => b.datum.localeCompare(a.datum));
const poId = new Map(predavanja.map((p) => [p.id, p]));
for (const d of [ARAPSKI, WAV]) mkdirSync(d, { recursive: true });

let lista = opt.ids.length ? opt.ids.map((id) => poId.get(id) ?? { id, trajanje: 0 }) : predavanja;
lista = lista.filter((p) => existsSync(join(IZLAZ, `${p.id}.json`)) || existsSync(join(KORIJEN, 'data/transkripti-lektura', `${p.id}.json`)));
if (!opt.force && !opt.samoSpajanje && !opt.ids.length) lista = lista.filter((p) => !existsSync(join(ARAPSKI, `${p.id}.json`)));
lista = lista.slice(0, opt.limit);
if (!opt.samoSpajanje) provjeriAlate();

console.log(`Arapski prolaz: ${lista.length} videa. Model: ${MODEL}`);
const start = Date.now();
let greske = 0;
for (const [i, p] of lista.entries()) {
  const t0 = Date.now();
  process.stdout.write(`[${i + 1}/${lista.length}] ${p.id} … `);
  try {
    const sacuvano = join(ARAPSKI, `${p.id}.json`);
    const rez = opt.samoSpajanje || (!opt.force && existsSync(sacuvano)) ? JSON.parse(readFileSync(sacuvano, 'utf8')) : prolaz(p.id, p);
    const prih = rez.segmenti.filter((s) => s.prihvacen).length;
    let poruka = `${rez.kandidati.length} isječaka, ${prih} arapskih segmenata`;
    if (!opt.samoProlaz) {
      const t = spoji(p.id, rez);
      if (t) poruka += ` → ${t.segmenti.filter((s) => s.jezik === 'ar').length} u transkriptu`;
    }
    console.log(`${poruka}, ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (!process.env.ZADRZI_WAV) rmSync(join(WAV, `${p.id}.ar.wav`), { force: true });
  } catch (e) {
    greske++;
    console.log('GREŠKA');
    console.error(String(e.message || e));
  }
}
console.log(`Gotovo za ${((Date.now() - start) / 60000).toFixed(1)} min, greške: ${greske}.`);
process.exit(greske ? 1 : 0);
