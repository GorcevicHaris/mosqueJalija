#!/usr/bin/env node
// Automatska transkripcija predavanja (whisper.cpp, lokalno, bez npm zavisnosti).
//
//   node scripts/transkripcija/transkribuj.mjs                 # svi videi bez transkripta (najnoviji prvo)
//   node scripts/transkripcija/transkribuj.mjs --id tb5geb6Gxcg  # samo jedan (može više puta --id)
//   node scripts/transkripcija/transkribuj.mjs --limit 5         # najviše 5 videa
//   node scripts/transkripcija/transkribuj.mjs --force --id X     # ponovo, i kad transkript postoji
//   node scripts/transkripcija/transkribuj.mjs --samo-obrada      # samo ponovna obrada sačuvanih sirovih izlaza
//   node scripts/transkripcija/transkribuj.mjs --bez-arapskog     # bez drugog koraka (arapski prolaz, arapski.mjs)
//
// Poslije bosanske transkripcije automatski se pokreće drugi korak — arapski.mjs (whisper -l ar na
// dijelovima koje bosanski prolaz nije prepoznao: uvod/završetak hutbe, ajeti, dove); uz --samo-obrada
// se ponovo upisuje sačuvani arapski prolaz (arapski.mjs --samo-spajanje).
//
// Potrebno: ffmpeg, whisper-cli (brew install ffmpeg whisper-cpp), yt-dlp, model u radnom folderu.
// Radni folder (audio, modeli, sirovi izlaz) je VAN projekta: ~/Library/Caches/jalija-transkripcija
// (promjenljivo preko JALIJA_TRANSKRIPCIJA_DIR). Ništa iz njega se ne commit-uje.
//
// Ručno ispravljeni transkripti: ako u data/transkripti/<id>.json stoji "automatski": false,
// skripta taj fajl nikad ne prepisuje (ni sa --force ni sa --samo-obrada).
// Lektorisane verzije su u data/transkripti-lektura/<id>.json — skripta ih nikad ne dira
// (sajt ih koristi umjesto sirovog automatskog transkripta).

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { homedir, cpus } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { obradi } from './obrada.mjs';

const KORIJEN = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const IZLAZ = join(KORIJEN, 'data/transkripti');
const RAD = process.env.JALIJA_TRANSKRIPCIJA_DIR || join(homedir(), 'Library/Caches/jalija-transkripcija');
const MODELI = join(RAD, 'models');
const AUDIO = join(RAD, 'audio');
const WAV = join(RAD, 'wav');
const SIROVO = join(RAD, 'raw');

const MODEL = process.env.WHISPER_MODEL || 'ggml-large-v3-turbo.bin';
const VAD_MODEL = 'ggml-silero-v5.1.2.bin';
const JEZIK = process.env.WHISPER_JEZIK || 'bs';
// Početni prompt usmjerava rječnik i pravopis (ijekavica, latinica, islamski izrazi).
const PROMPT =
  process.env.WHISPER_PROMPT ||
  "Bismillah. Hutba i predavanje u Džamiji na Jaliji, Novi Pazar. Allah, dželle šanuhu, Poslanik, sallallahu alejhi ve sellem, Kur'an, ajet, sura, hadis, džennet, džehennem, iman, namaz, sabur, dova, ummet, džemat, hfz., ef.";

// ---------- argumenti ----------
const argv = process.argv.slice(2);
const opt = { ids: [], limit: Infinity, force: false, samoObrada: false, zadrziAudio: false, bezArapskog: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--id') opt.ids.push(argv[++i]);
  else if (a === '--limit') opt.limit = Number(argv[++i]);
  else if (a === '--force') opt.force = true;
  else if (a === '--samo-obrada') opt.samoObrada = true;
  else if (a === '--zadrzi-audio') opt.zadrziAudio = true;
  else if (a === '--bez-arapskog') opt.bezArapskog = true;
  else if (a === '-h' || a === '--help') {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 22).join('\n'));
    process.exit(0);
  } else {
    console.error(`Nepoznat argument: ${a}`);
    process.exit(2);
  }
}

// ---------- alati ----------
function nadji(ime, ...kandidati) {
  for (const k of kandidati.filter(Boolean)) if (existsSync(k)) return k;
  const r = spawnSync('/usr/bin/which', [ime], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
const FFMPEG = nadji('ffmpeg', process.env.FFMPEG, '/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg');
const WHISPER = nadji('whisper-cli', process.env.WHISPER_CLI, '/opt/homebrew/bin/whisper-cli', '/usr/local/bin/whisper-cli');
const YTDLP = nadji('yt-dlp', process.env.YTDLP, '/opt/homebrew/bin/yt-dlp', '/usr/local/bin/yt-dlp');

const modelPut = join(MODELI, MODEL);
const vadPut = join(MODELI, VAD_MODEL);

function provjeriAlate() {
  const nema = [];
  if (!FFMPEG) nema.push('ffmpeg (brew install ffmpeg)');
  if (!WHISPER) nema.push('whisper-cli (brew install whisper-cpp)');
  if (!YTDLP) nema.push('yt-dlp (brew install yt-dlp, ili YTDLP=/putanja/do/yt-dlp)');
  if (!existsSync(modelPut))
    nema.push(`model ${modelPut}\n    curl -L -o "${modelPut}" https://huggingface.co/ggerganov/whisper.cpp/resolve/main/${MODEL}`);
  if (nema.length) {
    console.error('Nedostaje:\n  - ' + nema.join('\n  - '));
    process.exit(1);
  }
  if (!existsSync(vadPut))
    console.warn(`(Upozorenje) Nema VAD modela ${vadPut} — radi i bez njega, ali uz više halucinacija u tišini.\n    curl -L -o "${vadPut}" https://huggingface.co/ggml-org/whisper-vad/resolve/main/${VAD_MODEL}`);
}

function pokreni(cmd, args, opis) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) {
    throw new Error(`${opis} nije uspjelo (kod ${r.status}):\n${(r.stderr || r.stdout || '').slice(-2000)}`);
  }
  return r;
}

// ---------- koraci ----------
function preuzmiAudio(id) {
  const postojeci = existsSync(AUDIO) && readdirSync(AUDIO).find((f) => f.startsWith(id + '.') && !f.endsWith('.part'));
  if (postojeci) return join(AUDIO, postojeci);
  const args = [
    '-f', 'bestaudio[ext=m4a]/bestaudio',
    '-o', join(AUDIO, '%(id)s.%(ext)s'),
    '--no-playlist', '-q', '--no-warnings', '--no-progress',
  ];
  // novije verzije yt-dlp traže JS runtime; node je sigurno tu
  const pomoc = spawnSync(YTDLP, ['--help'], { encoding: 'utf8' });
  if (/--js-runtimes/.test(pomoc.stdout || '')) args.push('--js-runtimes', 'node');
  args.push(`https://www.youtube.com/watch?v=${id}`);
  pokreni(YTDLP, args, 'Preuzimanje zvuka');
  const f = readdirSync(AUDIO).find((x) => x.startsWith(id + '.') && !x.endsWith('.part'));
  if (!f) throw new Error('yt-dlp nije napravio fajl');
  return join(AUDIO, f);
}

function uWav(id, audio) {
  const wav = join(WAV, `${id}.wav`);
  if (existsSync(wav) && statSync(wav).size > 1000) return wav;
  pokreni(FFMPEG, ['-nostdin', '-loglevel', 'error', '-y', '-i', audio, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', wav], 'ffmpeg');
  return wav;
}

function transkribuj(id, wav) {
  const of = join(SIROVO, id);
  const args = [
    '-m', modelPut,
    '-f', wav,
    '-l', JEZIK,
    '-t', String(Math.min(8, Math.max(4, cpus().length - 2))),
    '-bs', '5', '-bo', '5',
    '-mc', '0', // bez prenosa konteksta: sprječava "petlje" ponavljanja (testirano: bolje od -mc 64)
    '--prompt', PROMPT,
    '-sns',
    '-oj', '-of', of, '-np',
  ];
  if (existsSync(vadPut)) args.push('--vad', '-vm', vadPut, '-vt', '0.45', '-vsd', '500', '-vp', '200', '-vmsd', '28');
  pokreni(WHISPER, args, 'whisper-cli');
  return of + '.json';
}

function snimi(id, sirovoPut, video) {
  const cilj = join(IZLAZ, `${id}.json`);
  if (existsSync(cilj)) {
    try {
      if (JSON.parse(readFileSync(cilj, 'utf8')).automatski === false) {
        console.log(`  ${id}: ručno ispravljen transkript — ne prepisujem`);
        return false;
      }
    } catch { /* prepiši neispravan fajl */ }
  }
  const sirovo = JSON.parse(readFileSync(sirovoPut, 'utf8'));
  const gen = statSync(sirovoPut).mtime.toISOString();
  const t = obradi(sirovo, { id, model: MODEL.replace(/^ggml-|\.bin$/g, ''), jezik: JEZIK, trajanje: video?.trajanje, generisano: gen });
  // atomski upis (drugi alati, npr. lektura, čitaju gotove fajlove dok skripta radi)
  writeFileSync(cilj + '.tmp', JSON.stringify(t, null, 1) + '\n');
  renameSync(cilj + '.tmp', cilj);
  return t;
}

/** Drugi korak: arapski prolaz (arapski.mjs) za navedene videe. */
function arapskiKorak(ids, dodatno = []) {
  if (opt.bezArapskog || !ids.length) return 0;
  console.log(`\nDrugi korak — arapski dijelovi (${ids.length} videa):`);
  const r = spawnSync(process.execPath, [join(dirname(fileURLToPath(import.meta.url)), 'arapski.mjs'), ...dodatno, ...ids.flatMap((id) => ['--id', id])], {
    stdio: 'inherit',
  });
  return r.status ?? 1;
}

// ---------- glavni tok ----------
const predavanja = JSON.parse(readFileSync(join(KORIJEN, 'data/predavanja.json'), 'utf8'))
  .slice()
  .sort((a, b) => b.datum.localeCompare(a.datum));
const poId = new Map(predavanja.map((p) => [p.id, p]));

for (const d of [IZLAZ, MODELI, AUDIO, WAV, SIROVO]) mkdirSync(d, { recursive: true });

if (opt.samoObrada) {
  let n = 0;
  const obradjeni = [];
  for (const f of readdirSync(SIROVO).filter((x) => x.endsWith('.json'))) {
    const id = f.replace(/\.json$/, '');
    if (opt.ids.length && !opt.ids.includes(id)) continue;
    if (!poId.has(id)) continue;
    if (snimi(id, join(SIROVO, f), poId.get(id))) {
      n++;
      obradjeni.push(id);
    }
  }
  console.log(`Ponovo obrađeno: ${n}`);
  // obrada piše samo bosanske segmente → ponovo upiši sačuvani arapski prolaz (bez ponovnog prepoznavanja)
  const saArapskim = obradjeni.filter((id) => existsSync(join(RAD, 'arapski', `${id}.json`)));
  process.exit(arapskiKorak(saArapskim, ['--samo-spajanje']) ? 1 : 0);
}

provjeriAlate();

let lista = opt.ids.length ? opt.ids.map((id) => poId.get(id) ?? { id, trajanje: 0, datum: '' }) : predavanja;
if (!opt.force) lista = lista.filter((p) => !existsSync(join(IZLAZ, `${p.id}.json`)));
lista = lista.slice(0, opt.limit);

const ukupnoSek = lista.reduce((s, p) => s + (p.trajanje || 0), 0);
console.log(`Za transkripciju: ${lista.length} videa, ${(ukupnoSek / 3600).toFixed(1)} h snimka. Model: ${MODEL}, jezik: ${JEZIK}`);

const start = Date.now();
let gotovo = 0;
let greske = 0;
const zaArapski = [];
for (const p of lista) {
  const t0 = Date.now();
  process.stdout.write(`[${gotovo + greske + 1}/${lista.length}] ${p.id} (${Math.round((p.trajanje || 0) / 60)} min) … `);
  try {
    const sirovoPut = join(SIROVO, `${p.id}.json`);
    if (opt.force || !existsSync(sirovoPut)) {
      const audio = preuzmiAudio(p.id);
      const wav = uWav(p.id, audio);
      transkribuj(p.id, wav);
      if (!opt.zadrziAudio) rmSync(wav, { force: true });
    }
    const t = snimi(p.id, sirovoPut, p);
    gotovo++;
    if (t && t.segmenti.length) zaArapski.push(p.id);
    const sek = (Date.now() - t0) / 1000;
    console.log(`ok, ${t ? t.segmenti.length : 0} pasusa, ${sek.toFixed(0)} s${p.trajanje ? ` (${(p.trajanje / sek).toFixed(1)}× brže od stvarnog vremena)` : ''}`);
  } catch (e) {
    greske++;
    console.log('GREŠKA');
    console.error(String(e.message || e));
  }
}
console.log(`Gotovo: ${gotovo}, greške: ${greske}, ukupno ${((Date.now() - start) / 60000).toFixed(1)} min.`);
const arGreske = arapskiKorak(zaArapski, ['--force']);
process.exit(greske || arGreske ? 1 : 0);
