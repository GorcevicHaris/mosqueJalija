// Preuzimanje podataka sa YouTube-a: yt-dlp (primarno) i RSS feed (rezerva).
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const YTDLP = process.env.YTDLP || 'yt-dlp';

function ytdlp(args, { timeoutMs = 15 * 60 * 1000 } = {}) {
  const r = spawnSync(YTDLP, ['--no-warnings', '--ignore-config', ...args], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    timeout: timeoutMs,
  });
  if (r.error) throw new Error(`yt-dlp se ne može pokrenuti (${YTDLP}): ${r.error.message}`);
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

export function ytdlpVerzija() {
  try {
    const r = ytdlp(['--version'], { timeoutMs: 60_000 });
    return r.status === 0 ? r.stdout.trim() : null;
  } catch {
    return null;
  }
}

function datumIzYmd(ymd) {
  if (!ymd || !/^\d{8}$/.test(ymd)) return null;
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`;
}

/** Lista videa jednog taba kanala (videos | shorts) — brzo, bez opisa. */
export function listaTaba(kanalUrl, tab) {
  const r = ytdlp(['--flat-playlist', '-J', `${kanalUrl}/${tab}`]);
  if (r.status !== 0 || !r.stdout.trim()) {
    // kanal bez taba (npr. nema Shorts) nije greška
    if (/does not have a .* tab/i.test(r.stderr)) return [];
    throw new Error(`yt-dlp (${tab}) nije uspio: ${r.stderr.trim().split('\n').slice(-1)[0]}`);
  }
  const d = JSON.parse(r.stdout);
  return (d.entries || [])
    .filter((e) => e && e.id)
    .map((e, i) => ({
      id: e.id,
      naslov: e.title ?? null,
      trajanje: typeof e.duration === 'number' ? Math.round(e.duration) : null,
      pregledi: typeof e.view_count === 'number' ? e.view_count : null,
      timestamp: typeof e.timestamp === 'number' ? e.timestamp : null,
      tip: tab === 'shorts' ? 'short' : 'video',
      redoslijed: i,
    }));
}

/** Playliste kanala sa članovima: [{id, naslov, opis, videi: [id]}] */
export function playlisteKanala(kanalUrl) {
  const r = ytdlp(['--flat-playlist', '-J', `${kanalUrl}/playlists`]);
  if (r.status !== 0 || !r.stdout.trim()) {
    if (/does not have a .* tab/i.test(r.stderr)) return [];
    throw new Error(`yt-dlp (playlists) nije uspio: ${r.stderr.trim().split('\n').slice(-1)[0]}`);
  }
  const lista = (JSON.parse(r.stdout).entries || []).filter((e) => e && e.id);
  const out = [];
  for (const p of lista) {
    const rp = ytdlp(['--flat-playlist', '-J', `https://www.youtube.com/playlist?list=${p.id}`]);
    if (rp.status !== 0 || !rp.stdout.trim()) {
      console.warn(`  ! playlista ${p.id} se ne može učitati — preskačem`);
      continue;
    }
    const d = JSON.parse(rp.stdout);
    out.push({
      id: p.id,
      naslov: d.title || p.title || p.id,
      opis: d.description || null,
      videi: (d.entries || []).filter((e) => e && e.id).map((e) => e.id),
    });
  }
  return out;
}

/** Puni metapodaci za listu ID-eva (opis, tačan datum, trajanje, pregledi). */
export function detaljiVidea(ids) {
  if (ids.length === 0) return { rezultati: [], neuspjeli: [] };
  const dir = mkdtempSync(join(tmpdir(), 'yt-'));
  const fajl = join(dir, 'ids.txt');
  writeFileSync(fajl, ids.map((id) => `https://www.youtube.com/watch?v=${id}`).join('\n'));
  try {
    const r = ytdlp(['--skip-download', '-j', '--ignore-errors', '-a', fajl], { timeoutMs: 60 * 60 * 1000 });
    const rezultati = [];
    for (const linija of r.stdout.split('\n')) {
      if (!linija.trim()) continue;
      try {
        const d = JSON.parse(linija);
        rezultati.push({
          id: d.id,
          naslov: d.title ?? null,
          opis: typeof d.description === 'string' ? d.description : '',
          datum: datumIzYmd(d.upload_date),
          timestamp: typeof d.timestamp === 'number' ? d.timestamp : null,
          trajanje: typeof d.duration === 'number' ? Math.round(d.duration) : null,
          pregledi: typeof d.view_count === 'number' ? d.view_count : null,
          tip: d.media_type === 'short' || /\/shorts\//.test(d.webpage_url || '') ? 'short' : 'video',
        });
      } catch {
        /* nevalidna linija — ignoriši */
      }
    }
    const dobijeni = new Set(rezultati.map((x) => x.id));
    return { rezultati, neuspjeli: ids.filter((id) => !dobijeni.has(id)) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function xmlDecode(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&');
}

/** Rezerva: RSS feed kanala (zadnjih 15 videa). Trajanje nije poznato. */
export async function rssKanala(channelId) {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`RSS ${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const [, entry] of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const tag = (re) => {
      const m = entry.match(re);
      return m ? xmlDecode(m[1]) : null;
    };
    const id = tag(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (!id) continue;
    const published = tag(/<published>([^<]+)<\/published>/);
    const link = tag(/<link rel="alternate" href="([^"]+)"/) || '';
    const views = tag(/<media:statistics views="(\d+)"/);
    const ts = published ? Math.floor(Date.parse(published) / 1000) : null;
    out.push({
      id,
      naslov: tag(/<title>([\s\S]*?)<\/title>/),
      opis: tag(/<media:description>([\s\S]*?)<\/media:description>/) ?? '',
      datum: published ? published.slice(0, 10) : null,
      timestamp: ts,
      trajanje: null,
      pregledi: views ? Number(views) : null,
      tip: /\/shorts\//.test(link) ? 'short' : 'video',
    });
  }
  return out;
}

/** Da li postoji maxresdefault sličica (HEAD zahtjev). */
export async function imaMaxres(id) {
  try {
    const res = await fetch(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(15_000),
    });
    return res.status === 200;
  } catch {
    return null; // nepoznato — provjeri sljedeći put
  }
}
