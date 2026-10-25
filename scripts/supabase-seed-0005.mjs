#!/usr/bin/env node
// Generiše supabase/seed-0005.sql: početni sadržaj tabela iz migracije 0005 iz TRENUTNIH ugrađenih
// lista u kodu, da prelazak na bazu ništa ne promijeni na sajtu:
//   * programi          ← src/lib/obrasci/programi.ts (PROGRAMI)
//   * kartice_stranica  ← src/lib/kartice.ts (UGRADJENE_KARTICE)
//   * stranice_tekstovi ← src/lib/tekstovi-stranica.ts (novi ključevi; postojeća 4 su u seed.sql)
//   * postavke 'traka'  ← isključena traka na vrhu sajta
// Ispravke transkripata i ručno dodana predavanja se ne seeduju.
// Idempotentno: programi/tekstovi ON CONFLICT DO NOTHING; kartice se upisuju samo za stranicu koja
// u bazi još nema nijednu karticu (obrisane kartice se ne vraćaju ponovnim pokretanjem).
//
// Pokretanje (Node 22.18+ / 23.6+, čita .ts fajlove direktno): node scripts/supabase-seed-0005.mjs [--out putanja]

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > -1 ? process.argv[outArg + 1] : join(ROOT, 'supabase/seed-0005.sql');

const uvezi = (rel) => import(pathToFileURL(join(ROOT, rel)).href);
const { PROGRAMI } = await uvezi('src/lib/obrasci/programi.ts');
const { UGRADJENE_KARTICE } = await uvezi('src/lib/kartice.ts');
const { TEKSTOVI_STRANICA } = await uvezi('src/lib/tekstovi-stranica.ts');

/** Dollar-quoted literal (isto kao scripts/supabase-seed.mjs). */
function lit(v) {
  if (v === null || v === undefined) return 'null';
  const s = String(v);
  let tag = 's';
  for (let i = 1; `${s}$${tag}$`.indexOf(`$${tag}$`) !== s.length; i++) tag = `s${i}`;
  return `$${tag}$${s}$${tag}$`;
}

const ZA_KOGA = ['muškarci', 'žene', 'djeca', 'svi'];
/** "Žene" → { za_koga: 'žene', tekst: null }; "Žene i djeca" → { za_koga: 'žene', tekst: 'Žene i djeca' } */
function zaKoga(oznaka) {
  const cijelo = oznaka.trim().toLowerCase();
  if (ZA_KOGA.includes(cijelo)) return { za_koga: cijelo, tekst: null };
  const prva = cijelo.split(/\s+/)[0];
  return { za_koga: ZA_KOGA.includes(prva) ? prva : 'svi', tekst: oznaka };
}

const out = [];
out.push('-- =====================================================================');
out.push('-- seed-0005.sql — početni sadržaj za migraciju 0005 (programi, kartice, tekstovi, traka)');
out.push('-- GENERISANO skriptom scripts/supabase-seed-0005.mjs — ne mijenjati ručno.');
out.push(`-- Generisano: ${new Date().toISOString()}`);
out.push('-- Pokrenuti POSLIJE migracije 0005 (i seed.sql). Idempotentno.');
out.push('-- =====================================================================');
out.push('begin;');
out.push('');

// ---------- programi ----------
out.push(`-- programi (${PROGRAMI.length})`);
PROGRAMI.forEach((p, i) => {
  const z = zaKoga(p.zaKoga);
  if (Boolean(p.zaDjecu) !== (z.za_koga === 'djeca')) {
    throw new Error(`Program ${p.id}: zaDjecu (${p.zaDjecu}) se ne poklapa sa za_koga "${z.za_koga}" — baza izvodi zaDjecu iz za_koga.`);
  }
  out.push(
    'insert into public.programi (slug, naziv, opis, grupa, za_koga, za_koga_tekst, termin, predavac, napomena, obavjestenje, aktivno, redoslijed) values (' +
      [lit(p.id), lit(p.naziv), 'null', lit(p.grupa), lit(z.za_koga), lit(z.tekst), lit(p.termin), lit(p.predavac), lit(p.napomena ?? null), lit(p.izvor), 'true', String(i * 10)].join(', ') +
      ') on conflict (slug) do nothing;',
  );
});
out.push('');

// ---------- kartice_stranica ----------
let brojKartica = 0;
for (const [stranica, kartice] of Object.entries(UGRADJENE_KARTICE)) {
  out.push(`-- kartice_stranica: ${stranica} (${kartice.length})`);
  const redovi = kartice.map((k, i) => `  (${[lit(k.naslov), lit(k.tekst), lit(k.ikona), lit(k.link), String(i * 10)].join(', ')})`);
  out.push('insert into public.kartice_stranica (stranica, naslov, tekst, ikona, link, aktivno, redoslijed)');
  out.push(`select ${lit(stranica)}, v.naslov, v.tekst, v.ikona, v.link, true, v.redoslijed from (values`);
  out.push(redovi.join(',\n'));
  out.push(') as v (naslov, tekst, ikona, link, redoslijed)');
  out.push(`where not exists (select 1 from public.kartice_stranica where stranica = ${lit(stranica)});`);
  out.push('');
  brojKartica += kartice.length;
}

// ---------- stranice_tekstovi (novi ključevi) ----------
const POSTOJECI = new Set(['mekteb', 'donacije', 'pravila-ponasanja', 'ucenje-kurana']); // već u seed.sql
const noviTekstovi = TEKSTOVI_STRANICA.filter((t) => !POSTOJECI.has(t.kljuc));
out.push(`-- stranice_tekstovi (${noviTekstovi.length} novih ključeva)`);
for (const t of noviTekstovi) {
  out.push(`insert into public.stranice_tekstovi (kljuc, naslov, sadrzaj) values (${lit(t.kljuc)}, ${lit(t.naslov)}, ${lit(t.sadrzaj)}) on conflict (kljuc) do nothing;`);
}
out.push('');

// ---------- postavke: traka na vrhu sajta (isključena) ----------
const traka = { aktivno: false, tekst: '', link: null, vrsta: 'info', do: null };
out.push('-- postavke: traka na vrhu sajta (isključena)');
out.push(`insert into public.postavke (kljuc, vrijednost) values ('traka', ${lit(JSON.stringify(traka))}::jsonb) on conflict (kljuc) do nothing;`);
out.push('');
out.push('commit;');
out.push('');

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, out.join('\n'));
console.log(`seed-0005.sql: ${PROGRAMI.length} programa, ${brojKartica} kartica, ${noviTekstovi.length} tekstova stranica, 1 postavka (traka) → ${OUT}`);
