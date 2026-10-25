#!/usr/bin/env node
// Generiše supabase/seed.sql iz data/*.json (početni sadržaj baze).
// Idempotentno: INSERT ... ON CONFLICT DO NOTHING — postojeći redovi u bazi se NE prepisuju.
// Tekst se upisuje dollar-quoting-om sa oznakom koja se garantovano ne pojavljuje u tekstu.
// Urednici se NE seeduju (dodaju se ručno, vidi docs/supabase.md).
//
// Pokretanje: node scripts/supabase-seed.mjs   (opciono: --out putanja)

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : join(ROOT, 'supabase/seed.sql');

const citaj = (rel, def) => {
  const f = join(ROOT, rel);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : def;
};

/**
 * Dollar-quoted literal: $s$tekst$s$. Oznaka se mijenja ($s1$, $s2$…) dok prvo pojavljivanje
 * zatvarajuće oznake u "tekst + oznaka" nije tačno na kraju (pokriva i tekst koji završava sa "$s").
 */
function lit(v) {
  if (v === null || v === undefined) return 'null';
  const s = String(v);
  let tag = 's';
  for (let i = 1; `${s}$${tag}$`.indexOf(`$${tag}$`) !== s.length; i++) tag = `s${i}`;
  return `$${tag}$${s}$${tag}$`;
}
const bool = (b) => (b ? 'true' : 'false');
const jsonb = (o) => `${lit(JSON.stringify(o))}::jsonb`;
const textArr = (a) =>
  Array.isArray(a) && a.length ? `array[${a.map((x) => lit(x)).join(', ')}]::text[]` : `'{}'::text[]`;
const datum = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d ?? '') ? `'${d}'::date` : 'current_date');

const obavjestenja = citaj('data/obavjestenja.json', []);
const galerija = citaj('data/galerija.json', []);
const imamiBio = citaj('data/imami-bio.json', {});
const dzamija = citaj('data/dzamija.json', null);
const ispravke = citaj('data/predavanja-ispravke.json', {});
const imami = citaj('data/imami.json', []);
const kategorije = citaj('data/kategorije.json', []);
const serije = citaj('data/serije.json', []);
const dove = citaj('data/dove.json', []);
const ajetiHadisi = citaj('data/ajeti-hadisi.json', []);

// Sedmični raspored — prepisan iz stvarnih obavještenja džemata (data/obavjestenja.json,
// objave sa Instagrama od 11. 10. 2026.). Ništa nije izmišljeno; urednik ga mijenja u adminu.
const RASPORED = [
  { dan: 2, vrijeme: 'između akšama i jacije', naziv: 'Hifz Amme džuza metodom telkina uz tefsir', opis: 'Profesor: hafiz Admir Jašarević. Besplatno, od 20. 10. 2026.', za_koga: 'muškarci' },
  { dan: 4, vrijeme: 'sa akšama', naziv: 'Učenje arapskog pisma (sufara)', opis: 'Profesor: Seid Stupljanin. Besplatno, od 22. 10. 2026.', za_koga: 'muškarci' },
  { dan: 1, vrijeme: 'sa jacije', naziv: 'Škola Kur\'ana: hifz', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 4, vrijeme: 'sa jacije', naziv: 'Škola Kur\'ana: hifz', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 3, vrijeme: '17:00', naziv: 'Škola Kur\'ana: hifz Amme džuza / hatma', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 6, vrijeme: '17:00', naziv: 'Škola Kur\'ana: hifz Amme džuza / hatma', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 3, vrijeme: '18:30', naziv: 'Škola Kur\'ana: tedžvid', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 6, vrijeme: '18:30', naziv: 'Škola Kur\'ana: tedžvid', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'žene' },
  { dan: 6, vrijeme: '12:00', naziv: 'Hifz Amme džuza i tilavet za djecu', opis: 'Profesorica: Alma Uluč. Besplatno.', za_koga: 'djeca' },
];

// Stranice čiji uvodni tekst urednik može zamijeniti (prazno = stranica koristi svoj ugrađeni tekst).
const STRANICE = [
  { kljuc: 'mekteb', naslov: 'Mekteb i halke' },
  { kljuc: 'donacije', naslov: 'Donacije' },
  { kljuc: 'pravila-ponasanja', naslov: 'Pravila ponašanja u džamiji' },
  { kljuc: 'ucenje-kurana', naslov: 'Učenje Kur\'ana' },
];

const out = [];
out.push('-- =====================================================================');
out.push('-- seed.sql — početni sadržaj iz data/*.json');
out.push('-- GENERISANO skriptom scripts/supabase-seed.mjs — ne mijenjati ručno.');
out.push(`-- Generisano: ${new Date().toISOString()}`);
out.push('-- Pokrenuti POSLIJE migracija 0001–0003. Idempotentno (ON CONFLICT DO NOTHING).');
out.push('-- =====================================================================');
out.push('begin;');
out.push('');

// ---------- obavjestenja ----------
out.push(`-- obavjestenja (${obavjestenja.length})`);
for (const o of obavjestenja) {
  out.push(
    'insert into public.obavjestenja (slug, tip, naslov, datum, kategorija, sazetak, sadrzaj, slika, objavljeno, placeholder) values (' +
      [
        lit(o.slug),
        lit(o.tip === 'objava' ? 'objava' : 'obavjestenje'),
        lit(o.naslov),
        datum(o.datum),
        lit(o.kategorija || 'Ostalo'),
        lit(o.sazetak ?? ''),
        textArr(o.sadrzaj),
        lit(o.slika ?? null),
        'true',
        bool(o.placeholder),
      ].join(', ') +
      ') on conflict (slug) do nothing;',
  );
}
out.push('');

// ---------- galerija ----------
out.push(`-- galerija (${galerija.length})`);
galerija.forEach((g, i) => {
  // galerija nema prirodan ključ: preskoči ako isti src već postoji
  out.push(
    'insert into public.galerija (src, alt, opis, izvor, licenca, redoslijed) select ' +
      [lit(g.src), lit(g.alt ?? ''), lit(g.opis ?? null), lit(g.izvor ?? null), lit(g.licenca ?? null), String(i * 10)].join(', ') +
      ` where not exists (select 1 from public.galerija where src = ${lit(g.src)});`,
  );
});
out.push('');

// ---------- imami_bio ----------
const bioUnosi = Object.entries(imamiBio).filter(([k]) => !k.startsWith('_'));
out.push(`-- imami_bio (${bioUnosi.length})`);
for (const [slug, b] of bioUnosi) {
  out.push(
    'insert into public.imami_bio (slug, uloga, bio, slika, potvrdjeno, izvori) values (' +
      [lit(slug), lit(b.uloga ?? null), lit(b.bio ?? null), lit(b.slika ?? null), bool(b.potvrdjeno), jsonb(Array.isArray(b.izvori) ? b.izvori : [])].join(', ') +
      ') on conflict (slug) do nothing;',
  );
}
out.push('');

// ---------- postavke ----------
out.push('-- postavke');
if (dzamija) {
  out.push(`insert into public.postavke (kljuc, vrijednost) values ('dzamija', ${jsonb(dzamija)}) on conflict (kljuc) do nothing;`);
}
out.push('');

// ---------- predavanja_ispravke ----------
const ispUnosi = Object.entries(ispravke).filter(([k, v]) => !k.startsWith('_') && v && typeof v === 'object');
out.push(`-- predavanja_ispravke (${ispUnosi.length})`);
for (const [id, podaci] of ispUnosi) {
  out.push(`insert into public.predavanja_ispravke (video_id, podaci) values (${lit(id)}, ${jsonb(podaci)}) on conflict (video_id) do nothing;`);
}
out.push('');

// ---------- imami ----------
out.push(`-- imami (${imami.length})`);
imami.forEach((im, i) => {
  out.push(
    `insert into public.imami (slug, puno_ime, aliasi, redoslijed) values (${lit(im.slug)}, ${lit(im.punoIme)}, ${textArr(im.aliasi)}, ${i * 10}) on conflict (slug) do nothing;`,
  );
});
out.push('');

// ---------- kategorije i serije ----------
out.push(`-- kategorije (${kategorije.length})`);
kategorije.forEach((k, i) => {
  out.push(`insert into public.kategorije (slug, naziv, opis, redoslijed) values (${lit(k.slug)}, ${lit(k.naziv)}, ${lit(k.opis ?? null)}, ${i * 10}) on conflict (slug) do nothing;`);
});
out.push(`-- serije (${serije.length})`);
serije.forEach((k, i) => {
  out.push(`insert into public.serije (slug, naziv, opis, redoslijed) values (${lit(k.slug)}, ${lit(k.naziv)}, ${lit(k.opis ?? null)}, ${i * 10}) on conflict (slug) do nothing;`);
});
out.push('');

// ---------- dove ----------
out.push(`-- dove (${dove.length})`);
dove.forEach((d, i) => {
  out.push(
    'insert into public.dove (slug, naslov, kategorija, arapski, transliteracija, prevod, izvor, redoslijed) values (' +
      [lit(d.slug), lit(d.naslov), lit(d.kategorija || 'Ostalo'), lit(d.arapski ?? null), lit(d.transliteracija ?? null), lit(d.prevod), lit(d.izvor ?? ''), String(i * 10)].join(', ') +
      ') on conflict (slug) do nothing;',
  );
});
out.push('');

// ---------- ajeti_hadisi ----------
out.push(`-- ajeti_hadisi (${ajetiHadisi.length})`);
ajetiHadisi.forEach((a, i) => {
  out.push(
    'insert into public.ajeti_hadisi (tip, arapski, tekst, izvor, redoslijed) select ' +
      [lit(a.tip === 'hadis' ? 'hadis' : 'ajet'), lit(a.arapski ?? null), lit(a.tekst), lit(a.izvor), String(i * 10)].join(', ') +
      ` where not exists (select 1 from public.ajeti_hadisi where tekst = ${lit(a.tekst)} and izvor = ${lit(a.izvor)});`,
  );
});
out.push('');

// ---------- raspored ----------
out.push(`-- raspored (${RASPORED.length})`);
RASPORED.forEach((r, i) => {
  out.push(
    'insert into public.raspored (dan, vrijeme, naziv, opis, za_koga, aktivno, redoslijed) select ' +
      [String(r.dan), lit(r.vrijeme), lit(r.naziv), lit(r.opis), lit(r.za_koga), 'true', String(i * 10)].join(', ') +
      ` where not exists (select 1 from public.raspored where dan = ${r.dan} and vrijeme = ${lit(r.vrijeme)} and naziv = ${lit(r.naziv)});`,
  );
});
out.push('');

// ---------- stranice_tekstovi ----------
out.push(`-- stranice_tekstovi (${STRANICE.length})`);
for (const st of STRANICE) {
  out.push(`insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values (${lit(st.kljuc)}, ${lit(st.naslov)}, null) on conflict (kljuc) do nothing;`);
}
out.push('');
out.push('commit;');
out.push('');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.join('\n'));
console.log(
  `seed.sql: ${obavjestenja.length} obavještenja, ${galerija.length} slika, ${bioUnosi.length} biografija, ` +
    `${dzamija ? 1 : 0} postavki, ${ispUnosi.length} ispravki, ${imami.length} imama, ${kategorije.length} kategorija, ` +
    `${serije.length} serija, ${dove.length} dova, ${ajetiHadisi.length} ajeta/hadisa, ${RASPORED.length} termina rasporeda, ` +
    `${STRANICE.length} tekstova stranica → ${OUT}`,
);
