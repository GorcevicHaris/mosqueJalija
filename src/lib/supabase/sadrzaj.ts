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
import type { IspravkaPredavanja, JavnoPitanje, StranicaTekst, TerminRasporeda, ZaKoga } from './tipovi';

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
}

const TIMEOUT_MS = 8000;

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
      dohvati<Red>(`${TABELE.postavke}?select=kljuc,vrijednost&kljuc=eq.dzamija`),
      dohvati<Red>(`${TABELE.ispravke}?select=video_id,podaci`),
    ]);
    // pitanja su iz kasnije migracije (0004) — njihov izostanak ne obara ostatak sadržaja
    const pitRed = await dohvati<Red>(`${TABELE.pitanjaJavna}?select=id,pitanje,odgovor,odgovorio,odgovoreno_at,created_at&order=odgovoreno_at.desc.nullslast`).catch(
      (e: unknown) => {
        console.warn(`[supabase] pitanja nisu učitana: ${(e as Error).message}`);
        return [] as Red[];
      },
    );

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
      dzamija: postRed[0]?.vrijednost && typeof postRed[0].vrijednost === 'object' ? (postRed[0].vrijednost as Partial<Dzamija>) : null,
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
    };
    console.info(
      `[supabase] sadržaj iz baze: ${rez.obavjestenja.length} obavještenja, ${rez.galerija.length} slika, ${rez.dove.length} dova, ` +
        `${rez.ajetiHadisi.length} ajeta/hadisa, ${rez.raspored.length} termina, ${Object.keys(rez.ispravke).length} ispravki`,
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
