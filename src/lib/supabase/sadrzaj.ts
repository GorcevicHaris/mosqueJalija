// Čitanje sadržaja iz Supabase baze PRI BUILDU (PostgREST + fetch, bez npm paketa).
// Vraća null na bilo kakvu grešku (nema varijabli, nema mreže, tabela ne postoji, timeout) —
// tada data.ts koristi data/*.json kao i ranije. Vidi docs/supabase.md → "Povezivanje sa data.ts".

import type {
  AjetHadis,
  Dova,
  Dzamija,
  GalerijaSlika,
  ImamBio,
  ImamOsnovno,
  Izvor,
  Kategorija,
  Obavjestenje,
  Predavanje,
  Serija,
} from '../types';
import { restUrl, supabaseUkljucen, TABELE, zaglavlja } from './config';
import { aktivnostIz, AKTIVNOSTI_SELECT, citatIz, CITATI_SELECT, trakaIz } from './tipovi';
import type { Aktivnost, Citat, IspravkaPredavanja, JavnoPitanje, KarticaIzBaze, StranicaTekst, TerminRasporeda, Traka, TranskriptIspravke, ZaKoga } from './tipovi';
import { PROGRAMI_SELECT, programIzReda, type Program } from '../obrasci/programi';

export interface SadrzajIzBaze {
  obavjestenja: Obavjestenje[]; // samo objavljena, najnovija prva
  galerija: GalerijaSlika[];
  imami: ImamOsnovno[]; // dopuna/zamjena za data/imami.json (po slugu)
  imamiBio: Record<string, ImamBio>;
  kategorije: Kategorija[];
  serije: Serija[];
  dove: Dova[];
  ajetiHadisi: AjetHadis[];
  raspored: TerminRasporeda[]; // samo aktivni termini, po danu
  stranice: Record<string, StranicaTekst>;
  dzamija: Partial<Dzamija> | null; // red 'dzamija' iz tabele postavke
  ispravke: Record<string, IspravkaPredavanja>;
  pitanja: JavnoPitanje[]; // objavljena pitanja sa odgovorom
  traka: Traka | null; // red 'traka' iz tabele postavke
  // ---- migracija 0005: null = tabela ne postoji / nije dostupna → ugrađeni sadržaj ----
  programi: (Program & { aktivno: boolean })[] | null; // svi redovi (i neaktivni), po redoslijedu
  kartice: KarticaIzBaze[] | null; // samo aktivne, po stranici i redoslijedu
  transkriptIspravke: TranskriptIspravke | null;
  predavanjaRucna: PredavanjeRucno[] | null;
  // ---- migracija 0006: null = tabela ne postoji / nije dostupna → prazno stanje ----
  aktivnosti: Aktivnost[] | null; // samo objavljene, najnovije prve
  citati: Citat[] | null; // samo objavljeni, najnoviji prvi
}

/** Red tabele predavanja_rucna (ručno dodan YouTube video). */
export interface PredavanjeRucno {
  id: string;
  naslov: string;
  naslovCist: string | null;
  datum: string;
  trajanje: number;
  imam: string | null;
  kategorija: string;
  serija: string | null;
  serijaDio: number | null;
  opis: string | null;
}

const TIMEOUT_MS = 8000;
const STRANA = 1000; // PostgREST max-rows (podrazumijevano 1000)

async function dohvati<T>(putanja: string): Promise<T[]> {
  const res = await fetch(restUrl(putanja), {
    headers: zaglavlja(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const tekst = await res.text().catch(() => '');
    throw new Error(`${res.status} ${putanja.split('?')[0]}: ${tekst.slice(0, 200)}`);
  }
  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) throw new Error(`Neočekivan odgovor za ${putanja.split('?')[0]}`);
  return data as T[];
}

/** Svi redovi u stranama od STRANA (za tabele koje mogu biti veće od 1000 redova). */
async function dohvatiSve<T>(putanja: string): Promise<T[]> {
  const rez: T[] = [];
  for (let od = 0; ; od += STRANA) {
    const dio = await dohvati<T>(`${putanja}&limit=${STRANA}&offset=${od}`);
    rez.push(...dio);
    if (dio.length < STRANA) return rez;
  }
}

/** Tabela iz kasnije migracije: greška (npr. tabela još ne postoji) → null, bez obaranja ostatka. */
async function opciono<T>(naziv: string, p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    console.warn(`[supabase] ${naziv} nisu učitani (koristi se ugrađeni sadržaj): ${(e as Error).message}`);
    return null;
  }
}

type Red = Record<string, unknown>;
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() !== '' ? v : null);
const strObavezno = (v: unknown, def = ''): string => (typeof v === 'string' ? v : def);
const izvori = (v: unknown): Izvor[] =>
  Array.isArray(v)
    ? v
        .filter((x): x is Red => !!x && typeof x === 'object')
        .map((x) => ({ naziv: strObavezno(x.naziv), url: str(x.url) }))
        .filter((x) => x.naziv)
    : [];
/** "par 1\n\npar 2" → ['par 1', 'par 2'] */
export const uParagrafe = (tekst: string | null | undefined): string[] =>
  (tekst ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

const mapObavjestenje = (r: Red): Obavjestenje => ({
  slug: strObavezno(r.slug),
  tip: r.tip === 'objava' ? 'objava' : 'obavjestenje',
  naslov: strObavezno(r.naslov),
  datum: strObavezno(r.datum).slice(0, 10),
  kategorija: strObavezno(r.kategorija, 'Ostalo'),
  sazetak: strObavezno(r.sazetak),
  sadrzaj: Array.isArray(r.sadrzaj) ? (r.sadrzaj as unknown[]).filter((p): p is string => typeof p === 'string') : [],
  slika: str(r.slika),
  placeholder: r.placeholder === true,
});

const ZA_KOGA: ZaKoga[] = ['muškarci', 'žene', 'djeca', 'svi'];

function mapIspravkeTranskripata(redovi: Red[]): TranskriptIspravke {
  const rez: TranskriptIspravke = {};
  for (const r of redovi) {
    const id = strObavezno(r.video_id);
    const jezik = r.jezik === 'en' ? 'en' : r.jezik === 'bs' ? 'bs' : null;
    const seg = Number(r.segment);
    const tekst = str(r.tekst);
    if (!id || !jezik || !Number.isInteger(seg) || seg < 0 || !tekst) continue;
    ((rez[id] ??= {})[jezik] ??= {})[seg] = tekst.trim();
  }
  return rez;
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
function mapRucno(r: Red): PredavanjeRucno | null {
  const id = strObavezno(r.id);
  const naslov = str(r.naslov);
  const datum = strObavezno(r.datum).slice(0, 10);
  if (!YT_ID.test(id) || !naslov || !/^\d{4}-\d{2}-\d{2}$/.test(datum)) return null;
  const dio = Number(r.serija_dio);
  return {
    id,
    naslov: naslov.trim(),
    naslovCist: str(r.naslov_cist)?.trim() ?? null,
    datum,
    trajanje: Math.max(0, Math.floor(Number(r.trajanje) || 0)),
    imam: str(r.imam),
    kategorija: str(r.kategorija) ?? 'predavanje',
    serija: str(r.serija),
    serijaDio: Number.isInteger(dio) && dio > 0 ? dio : null,
    opis: str(r.opis),
  };
}

/** Učitava sav javni sadržaj iz baze. null = koristiti JSON rezervu. */
export async function ucitajIzBaze(): Promise<SadrzajIzBaze | null> {
  if (!supabaseUkljucen) return null;
  try {
    const [obav, gal, imRed, bioRed, katRed, serRed, doveRed, ahRed, rasRed, strRed, postRed, ispRed] = await Promise.all([
      dohvati<Red>(`${TABELE.obavjestenja}?select=slug,tip,naslov,datum,kategorija,sazetak,sadrzaj,slika,placeholder&objavljeno=eq.true&order=datum.desc,created_at.desc`),
      dohvati<Red>(`${TABELE.galerija}?select=src,alt,opis,izvor,licenca&order=redoslijed.asc,created_at.asc`),
      dohvati<Red>(`${TABELE.imami}?select=slug,puno_ime,aliasi&order=redoslijed.asc,slug.asc`),
      dohvati<Red>(`${TABELE.imamiBio}?select=slug,uloga,bio,slika,potvrdjeno,izvori`),
      dohvati<Red>(`${TABELE.kategorije}?select=slug,naziv,opis&order=redoslijed.asc,slug.asc`),
      dohvati<Red>(`${TABELE.serije}?select=slug,naziv,opis&order=redoslijed.asc,slug.asc`),
      dohvati<Red>(`${TABELE.dove}?select=slug,naslov,kategorija,arapski,transliteracija,prevod,izvor&order=redoslijed.asc,created_at.asc`),
      dohvati<Red>(`${TABELE.ajetiHadisi}?select=tip,arapski,tekst,izvor&order=redoslijed.asc,created_at.asc`),
      dohvati<Red>(`${TABELE.raspored}?select=id,dan,vrijeme,naziv,opis,za_koga,aktivno,redoslijed&aktivno=eq.true&order=dan.asc,redoslijed.asc`),
      dohvati<Red>(`${TABELE.stranice}?select=kljuc,naslov,sadrzaj`),
      dohvati<Red>(`${TABELE.postavke}?select=kljuc,vrijednost&kljuc=in.(dzamija,traka)`),
      dohvati<Red>(`${TABELE.ispravke}?select=video_id,podaci`),
    ]);
    // pitanja su iz kasnije migracije (0004) — njihov izostanak ne obara ostatak sadržaja
    const pitRed = await dohvati<Red>(`${TABELE.pitanjaJavna}?select=id,pitanje,odgovor,odgovorio,odgovoreno_at,created_at&order=odgovoreno_at.desc.nullslast`).catch(
      (e: unknown) => {
        console.warn(`[supabase] pitanja nisu učitana: ${(e as Error).message}`);
        return [] as Red[];
      },
    );
    // migracija 0005 — svaka tabela posebno; bez nje (ili kad ne odgovori) ugrađeni sadržaj
    const [progRed, kartRed, trIspRed, rucRed, aktRed, citRed] = await Promise.all([
      opciono('programi', dohvati<Red>(`${TABELE.programi}?select=${PROGRAMI_SELECT}&order=redoslijed.asc,slug.asc`)),
      opciono('kartice stranica', dohvati<Red>(`${TABELE.kartice}?select=stranica,naslov,tekst,ikona,link&aktivno=eq.true&order=stranica.asc,redoslijed.asc,created_at.asc`)),
      opciono('ispravke transkripata', dohvatiSve<Red>(`${TABELE.transkriptIspravke}?select=video_id,jezik,segment,tekst&order=video_id.asc,jezik.asc,segment.asc`)),
      opciono('ručno dodana predavanja', dohvati<Red>(`${TABELE.predavanjaRucna}?select=id,naslov,naslov_cist,datum,trajanje,imam,kategorija,serija,serija_dio,opis&order=datum.desc`)),
      // migracija 0006
      opciono('aktivnosti', dohvati<Red>(`${TABELE.aktivnosti}?select=${AKTIVNOSTI_SELECT}&objavljeno=eq.true&order=datum.desc,id.desc`)),
      opciono('citati', dohvati<Red>(`${TABELE.citati}?select=${CITATI_SELECT}&objavljeno=eq.true&order=datum.desc,id.desc`)),
    ]);
    const postavka = (kljuc: string) => postRed.find((r) => r.kljuc === kljuc)?.vrijednost;
    const dzamijaRed = postavka('dzamija');

    const rez: SadrzajIzBaze = {
      obavjestenja: obav.map(mapObavjestenje).filter((o) => o.slug && o.naslov && o.datum),
      galerija: gal
        .map((r) => ({ src: strObavezno(r.src), alt: strObavezno(r.alt), opis: str(r.opis), izvor: str(r.izvor), licenca: str(r.licenca) }))
        .filter((g) => g.src),
      imami: imRed
        .map((r) => ({
          slug: strObavezno(r.slug),
          punoIme: strObavezno(r.puno_ime),
          aliasi: Array.isArray(r.aliasi) ? (r.aliasi as unknown[]).filter((a): a is string => typeof a === 'string') : [],
        }))
        .filter((i) => i.slug && i.punoIme),
      imamiBio: Object.fromEntries(
        bioRed.map((r) => [
          strObavezno(r.slug),
          { uloga: str(r.uloga), bio: str(r.bio), slika: str(r.slika), potvrdjeno: r.potvrdjeno === true, izvori: izvori(r.izvori) },
        ]),
      ),
      kategorije: katRed.map((r) => ({ slug: strObavezno(r.slug), naziv: strObavezno(r.naziv), opis: str(r.opis) })),
      serije: serRed.map((r) => ({ slug: strObavezno(r.slug), naziv: strObavezno(r.naziv), opis: str(r.opis) })),
      dove: doveRed.map((r) => ({
        slug: strObavezno(r.slug),
        naslov: strObavezno(r.naslov),
        kategorija: strObavezno(r.kategorija, 'Ostalo'),
        arapski: str(r.arapski),
        transliteracija: str(r.transliteracija),
        prevod: strObavezno(r.prevod),
        izvor: strObavezno(r.izvor),
      })),
      ajetiHadisi: ahRed.map((r) => ({
        tip: r.tip === 'hadis' ? 'hadis' : 'ajet',
        arapski: str(r.arapski),
        tekst: strObavezno(r.tekst),
        izvor: strObavezno(r.izvor),
      })),
      raspored: rasRed.map((r) => ({
        id: strObavezno(r.id),
        dan: Number(r.dan) || 1,
        vrijeme: strObavezno(r.vrijeme),
        naziv: strObavezno(r.naziv),
        opis: str(r.opis),
        zaKoga: ZA_KOGA.includes(r.za_koga as ZaKoga) ? (r.za_koga as ZaKoga) : 'svi',
        aktivno: r.aktivno !== false,
        redoslijed: Number(r.redoslijed) || 0,
      })),
      stranice: Object.fromEntries(
        strRed.map((r) => [strObavezno(r.kljuc), { kljuc: strObavezno(r.kljuc), naslov: str(r.naslov), paragrafi: uParagrafe(str(r.sadrzaj)) }]),
      ),
      dzamija: dzamijaRed && typeof dzamijaRed === 'object' ? (dzamijaRed as Partial<Dzamija>) : null,
      traka: trakaIz(postavka('traka')),
      ispravke: Object.fromEntries(
        ispRed
          .filter((r) => r.podaci && typeof r.podaci === 'object')
          .map((r) => [strObavezno(r.video_id), r.podaci as IspravkaPredavanja]),
      ),
      pitanja: pitRed.map((r) => ({
        id: strObavezno(r.id),
        pitanje: strObavezno(r.pitanje),
        odgovor: strObavezno(r.odgovor),
        odgovorio: str(r.odgovorio),
        odgovorenoAt: str(r.odgovoreno_at),
        createdAt: strObavezno(r.created_at),
      })),
      programi: progRed ? progRed.map(programIzReda).filter((p): p is Program & { aktivno: boolean } => p !== null) : null,
      kartice: kartRed
        ? kartRed
            .map((r) => ({ stranica: strObavezno(r.stranica), naslov: strObavezno(r.naslov), tekst: strObavezno(r.tekst), ikona: str(r.ikona), link: str(r.link) }))
            .filter((k) => k.stranica && k.naslov)
        : null,
      transkriptIspravke: trIspRed ? mapIspravkeTranskripata(trIspRed) : null,
      predavanjaRucna: rucRed ? rucRed.map(mapRucno).filter((p): p is PredavanjeRucno => p !== null) : null,
      aktivnosti: aktRed ? aktRed.map(aktivnostIz).filter((a): a is Aktivnost => a !== null) : null,
      citati: citRed ? citRed.map(citatIz).filter((c): c is Citat => c !== null) : null,
    };
    console.info(
      `[supabase] sadržaj iz baze: ${rez.obavjestenja.length} obavještenja, ${rez.galerija.length} slika, ${rez.dove.length} dova, ` +
        `${rez.ajetiHadisi.length} ajeta/hadisa, ${rez.raspored.length} termina, ${Object.keys(rez.ispravke).length} ispravki` +
        (rez.programi ? `, ${rez.programi.length} programa` : '') +
        (rez.kartice ? `, ${rez.kartice.length} kartica` : '') +
        (rez.transkriptIspravke ? `, ${Object.keys(rez.transkriptIspravke).length} transkripata sa ispravkama` : '') +
        (rez.predavanjaRucna ? `, ${rez.predavanjaRucna.length} ručno dodanih predavanja` : '') +
        (rez.aktivnosti ? `, ${rez.aktivnosti.length} aktivnosti` : '') +
        (rez.citati ? `, ${rez.citati.length} citata` : ''),
    );
    return rez;
  } catch (e) {
    console.warn(`[supabase] baza nije dostupna, koristim data/*.json — ${(e as Error).message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------------------------
// Pomoćne funkcije za spajanje baze sa JSON rezervom (koristi ih data.ts)
// ---------------------------------------------------------------------------------------------

const jeObjekat = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Dzamija iz baze preko JSON-a: polja kojih nema u bazi ostaju iz JSON-a, ugniježđeni objekti
 * (kontakt, donacije, dzuma, drustveneMreze, koordinate) se spajaju po ključu, nizovi se zamjenjuju.
 */
export function spojiDzamiju(osnova: Dzamija, izBaze: Partial<Dzamija> | null | undefined): Dzamija {
  if (!jeObjekat(izBaze)) return osnova;
  const rez: Record<string, unknown> = { ...osnova };
  for (const [k, v] of Object.entries(izBaze)) {
    if (v === undefined) continue;
    const staro = (osnova as unknown as Record<string, unknown>)[k];
    rez[k] = jeObjekat(staro) && jeObjekat(v) ? { ...staro, ...v } : v;
  }
  return rez as unknown as Dzamija;
}

/** Spaja dvije liste po slugu: stavke iz baze zamjenjuju JSON stavke istog sluga, nove se dodaju na kraj. */
export function spojiPoSlugu<T extends { slug: string }>(json: T[], baza: T[]): T[] {
  const mapa = new Map(baza.map((x) => [x.slug, x]));
  const rez = json.map((x) => mapa.get(x.slug) ?? x);
  const postojeci = new Set(json.map((x) => x.slug));
  for (const x of baza) if (!postojeci.has(x.slug)) rez.push(x);
  return rez;
}

/**
 * Dodaje ručno unesena predavanja (predavanja_rucna) na listu sa YouTube kanala. Video koji već postoji
 * u JSON-u se preskače (verzija sa kanala ima prednost). Nepoznat imam/serija → bez, nepoznata
 * kategorija → "predavanje" (uz upozorenje), da greška ne obori build.
 */
export function dodajRucnaPredavanja(
  predavanja: Predavanje[],
  rucna: PredavanjeRucno[],
  poznato: { imami: Set<string>; kategorije: Set<string>; serije: Set<string> },
): Predavanje[] {
  if (!rucna.length) return predavanja;
  const postojeci = new Set(predavanja.map((p) => p.id));
  const nova: Predavanje[] = [];
  for (const r of rucna) {
    if (postojeci.has(r.id)) continue;
    postojeci.add(r.id);
    const imam = r.imam && poznato.imami.has(r.imam) ? r.imam : null;
    if (r.imam && !imam) console.warn(`[supabase] ručno predavanje ${r.id}: nepoznat imam "${r.imam}"`);
    const kategorija = poznato.kategorije.has(r.kategorija) ? r.kategorija : 'predavanje';
    if (kategorija !== r.kategorija) console.warn(`[supabase] ručno predavanje ${r.id}: nepoznata kategorija "${r.kategorija}"`);
    const serija = r.serija && poznato.serije.has(r.serija) ? r.serija : null;
    nova.push({
      id: r.id,
      naslov: r.naslov,
      naslovCist: r.naslovCist || r.naslov,
      datum: r.datum,
      trajanje: r.trajanje,
      thumbnail: `https://i.ytimg.com/vi/${r.id}/hqdefault.jpg`,
      imam,
      imamPotvrdjen: imam !== null,
      kategorija,
      serija,
      serijaDio: serija ? r.serijaDio : null,
      opis: r.opis,
      pregledi: null,
    });
  }
  return predavanja.concat(nova);
}

/**
 * Primjenjuje ispravke iz baze na predavanja (iste semantike kao scripts/update-videos.mjs):
 * postavljen `imam` je potvrđen osim ako je `imamPotvrdjen: false`. Nepoznati slugovi se preskaču
 * (uz upozorenje), da greška urednika ne obori build ili ne napravi mrtav link.
 */
export function primijeniIspravke(
  predavanja: Predavanje[],
  ispravke: Record<string, IspravkaPredavanja>,
  poznato: { imami: Set<string>; kategorije: Set<string>; serije: Set<string> },
): Predavanje[] {
  if (!ispravke || !Object.keys(ispravke).length) return predavanja;
  return predavanja.map((p) => {
    const isp = ispravke[p.id];
    if (!isp) return p;
    const n: Predavanje = { ...p };
    if ('imam' in isp) {
      if (isp.imam === null || (typeof isp.imam === 'string' && poznato.imami.has(isp.imam))) {
        n.imam = isp.imam;
        n.imamPotvrdjen = isp.imam === null ? false : isp.imamPotvrdjen !== false;
      } else console.warn(`[supabase] ispravka ${p.id}: nepoznat imam "${isp.imam}"`);
    } else if (typeof isp.imamPotvrdjen === 'boolean') n.imamPotvrdjen = isp.imamPotvrdjen;
    if (typeof isp.kategorija === 'string') {
      if (poznato.kategorije.has(isp.kategorija)) n.kategorija = isp.kategorija;
      else console.warn(`[supabase] ispravka ${p.id}: nepoznata kategorija "${isp.kategorija}"`);
    }
    if ('serija' in isp) {
      if (isp.serija === null || (typeof isp.serija === 'string' && poznato.serije.has(isp.serija))) n.serija = isp.serija ?? null;
      else console.warn(`[supabase] ispravka ${p.id}: nepoznata serija "${isp.serija}"`);
    }
    if ('serijaDio' in isp && (isp.serijaDio === null || Number.isInteger(isp.serijaDio))) n.serijaDio = isp.serijaDio ?? null;
    if (typeof isp.naslovCist === 'string' && isp.naslovCist.trim()) n.naslovCist = isp.naslovCist.trim();
    if ('opis' in isp && (isp.opis === null || typeof isp.opis === 'string')) n.opis = isp.opis ?? null;
    return n;
  });
}
