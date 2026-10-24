// Ručno pisan RSS 2.0 (bez @astrojs/rss, koji nije instaliran).
import { dzamija, formatTrajanje, getImam, getKategorija, getSerija, obavjestenja, predavanja } from '../data';
import { url } from '../url';
import { obavjestenjeHref } from './stranice';

export const xmlEsc = (s: string): string =>
  s
    // Kontrolni znakovi nisu dozvoljeni u XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const DANI = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MJ = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-10-24" → "Sat, 24 Oct 2026 12:00:00 GMT" (RFC 822) */
export function rfc822(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12));
  return `${DANI[dt.getUTCDay()]}, ${String(dt.getUTCDate()).padStart(2, '0')} ${MJ[dt.getUTCMonth()]} ${dt.getUTCFullYear()} 12:00:00 GMT`;
}

/** Apsolutni URL (site + base). Putanje stranica dobijaju završnu kosu crtu (GitHub Pages bez preusmjeravanja). */
export function absUrl(site: URL | undefined, path: string, stranica = true): string {
  let p = url(path);
  if (stranica && !p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p += '/';
  return new URL(p, site ?? 'https://gorcevicharis.github.io').href;
}

interface Item {
  title: string;
  link: string;
  guid: string;
  guidPermaLink: boolean;
  pubDate: string;
  description: string;
  category?: string[];
  thumbnail?: string;
  contentHtml?: string;
}

interface Kanal {
  title: string;
  description: string;
  link: string;
  self: string;
  items: Item[];
}

export function rssXml(k: Kanal): string {
  const last = k.items[0]?.pubDate ?? rfc822(new Date().toISOString().slice(0, 10));
  const items = k.items
    .map(
      (i) =>
        `    <item>\n` +
        `      <title>${xmlEsc(i.title)}</title>\n` +
        `      <link>${xmlEsc(i.link)}</link>\n` +
        `      <guid isPermaLink="${i.guidPermaLink}">${xmlEsc(i.guid)}</guid>\n` +
        `      <pubDate>${i.pubDate}</pubDate>\n` +
        `      <description>${xmlEsc(i.description)}</description>\n` +
        (i.category ?? []).map((c) => `      <category>${xmlEsc(c)}</category>\n`).join('') +
        (i.contentHtml ? `      <content:encoded>${xmlEsc(i.contentHtml)}</content:encoded>\n` : '') +
        (i.thumbnail ? `      <media:thumbnail url="${xmlEsc(i.thumbnail)}" />\n` : '') +
        `    </item>\n`,
    )
    .join('');
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">\n` +
    `  <channel>\n` +
    `    <title>${xmlEsc(k.title)}</title>\n` +
    `    <link>${xmlEsc(k.link)}</link>\n` +
    `    <description>${xmlEsc(k.description)}</description>\n` +
    `    <language>sr-Latn</language>\n` +
    `    <lastBuildDate>${last}</lastBuildDate>\n` +
    `    <atom:link href="${xmlEsc(k.self)}" rel="self" type="application/rss+xml" />\n` +
    items +
    `  </channel>\n` +
    `</rss>\n`
  );
}

const naziv = () => dzamija.naziv || 'Džamija na Jaliji';

export function predavanjaFeed(site: URL | undefined): string {
  const items: Item[] = predavanja.slice(0, 50).map((p) => {
    const imam = getImam(p.imam);
    const kat = getKategorija(p.kategorija);
    const ser = getSerija(p.serija);
    const meta = [
      imam?.punoIme,
      kat?.naziv,
      ser ? `${ser.naziv}${p.serijaDio ? `, ${p.serijaDio}. dio` : ''}` : null,
      p.trajanje ? `Trajanje ${formatTrajanje(p.trajanje)}` : null,
    ].filter(Boolean);
    const opis = p.opis ? p.opis.replace(/\s+/g, ' ').trim().slice(0, 500) : '';
    return {
      title: p.naslovCist || p.naslov,
      link: absUrl(site, `/predavanja/${p.id}`),
      guid: `youtube:${p.id}`,
      guidPermaLink: false,
      pubDate: rfc822(p.datum),
      description: [meta.join(' · '), opis].filter(Boolean).join(' — '),
      category: [kat?.naziv, ser?.naziv].filter((x): x is string => !!x),
      thumbnail: p.thumbnail || undefined,
    };
  });
  return rssXml({
    title: `${naziv()} — predavanja`,
    description: `Najnovija predavanja i hutbe sa YouTube kanala ${naziv()}.`,
    link: absUrl(site, '/predavanja'),
    self: absUrl(site, '/predavanja.xml', false),
    items,
  });
}

const htmlEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function obavjestenjaFeed(site: URL | undefined): string {
  const items: Item[] = obavjestenja
    .filter((o) => !o.placeholder) // primjeri sadržaja ne idu u feed
    .slice(0, 50)
    .map((o) => {
      const link = absUrl(site, obavjestenjeHref(o.tip, o.slug));
      return {
        title: o.naslov,
        link,
        guid: link,
        guidPermaLink: true,
        pubDate: rfc822(o.datum),
        description: o.sazetak,
        category: [o.tip === 'objava' ? 'Objava' : 'Obavještenje', o.kategorija].filter(Boolean),
        contentHtml: o.sadrzaj?.length ? o.sadrzaj.map((p) => `<p>${htmlEsc(p)}</p>`).join('') : undefined,
      };
    });
  return rssXml({
    title: `${naziv()} — obavještenja`,
    description: `Obavještenja i objave džemata ${naziv()}.`,
    link: absUrl(site, '/obavjestenja'),
    self: absUrl(site, '/obavjestenja.xml', false),
    items,
  });
}
