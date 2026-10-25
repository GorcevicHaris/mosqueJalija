#!/usr/bin/env node
// Pretvara GitHub Pages build (dist/) u stranice koje preusmjeravaju na glavni sajt (Vercel).
// Svaka stara adresa https://gorcevicharis.github.io/mosqueJalija/<putanja> vodi na
// https://dzamija-na-jaliji.vercel.app/<putanja> — sa query stringom i #sidrom (npr. #t-123).
// Upotreba (u deploy.yml, poslije `npm run build`): node scripts/gh-preusmjeravanje.mjs
import { readdirSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const DIST = 'dist';
const CILJ = (process.env.GLAVNI_SAJT ?? 'https://dzamija-na-jaliji.vercel.app').replace(/\/+$/, '');
const BASE = '/mosqueJalija';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function stranica(cilj) {
  return `<!doctype html>
<html lang="sr-Latn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Džamija na Jaliji — preusmjeravanje</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${esc(cilj)}">
<meta http-equiv="refresh" content="0; url=${esc(cilj)}">
<script>
  (function () {
    var cilj = ${JSON.stringify(CILJ)};
    var base = ${JSON.stringify(BASE)};
    var put = location.pathname;
    if (put.indexOf(base) === 0) put = put.slice(base.length);
    if (!put) put = '/';
    location.replace(cilj + put + location.search + location.hash);
  })();
</script>
</head>
<body style="font-family:system-ui,sans-serif;padding:2rem">
<p>Sajt Džamije na Jaliji se preselio na <a href="${esc(cilj)}">${esc(CILJ.replace(/^https:\/\//, ''))}</a>.</p>
</body>
</html>
`;
}

let n = 0;
function obradi(dir) {
  for (const ime of readdirSync(dir)) {
    const p = join(dir, ime);
    if (statSync(p).isDirectory()) {
      obradi(p);
      continue;
    }
    const rel = relative(DIST, p).split(sep).join('/');
    if (rel.endsWith('.html')) {
      // index.html → /putanja/ ; 404.html → glavna stranica (JS ipak čuva traženu putanju)
      const put = rel === '404.html' ? '/' : '/' + rel.replace(/index\.html$/, '');
      writeFileSync(p, stranica(CILJ + put));
      n++;
    } else if (/\.(xml|webmanifest|txt|json)$/.test(rel)) {
      // sitemap, RSS, robots, manifest i JSON pripadaju glavnom sajtu — ovdje ih ne objavljujemo
      rmSync(p);
    }
  }
}

obradi(DIST);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nDisallow: /\n`);
console.log(`Preusmjereno ${n} stranica na ${CILJ}`);
