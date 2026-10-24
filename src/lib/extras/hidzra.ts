// Hidžretski (islamski) kalendar — računanje preko Intl (kalendar Umm al-Qura).
// Radi i na serveru (build) i u pregledaču; nema zavisnosti.
// Datumi se interno predstavljaju kao "broj dana" (cijeli dani od 1. 1. 1970, UTC), što izbjegava
// probleme sa vremenskim zonama i ljetnim računanjem vremena.

export const HIDZRI_MJESECI = [
  'Muharrem',
  'Safer',
  'Rebiul-evvel',
  'Rebiul-ahir',
  'Džumadel-ula',
  'Džumadel-uhra',
  'Redžeb',
  "Ša'ban",
  'Ramazan',
  'Ševval',
  "Zul-ka'de",
  'Zul-hidždže',
] as const;

/** Genitiv, za "noć uoči 27. redžeba". */
export const HIDZRI_MJESECI_GEN = [
  'muharrema', 'safera', 'rebiul-evvela', 'rebiul-ahira', 'džumadel-ule', 'džumadel-uhre',
  'redžeba', "ša'bana", 'ramazana', 'ševvala', "zul-ka'deta", 'zul-hidždžeta',
] as const;

export const GREG_MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
] as const;

export const GREG_MJESECI_GEN = [
  'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
  'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
] as const;

/** Ponedjeljak = 0 … nedjelja = 6 */
export const DANI_KRATKO = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'] as const;
export const DANI = ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'] as const;

export interface GDatum { y: number; m: number; d: number }
export interface HDatum { y: number; m: number; d: number }

const DAN_MS = 86_400_000;

export const dayNum = (y: number, m: number, d: number): number => Math.round(Date.UTC(y, m - 1, d) / DAN_MS);

export function fromDayNum(n: number): GDatum {
  const dt = new Date(n * DAN_MS);
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** Današnji dan po LOKALNOM vremenu korisnika. */
export function danasDayNum(now: Date = new Date()): number {
  return dayNum(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Dan u sedmici, ponedjeljak = 0. */
export const danUSedmici = (n: number): number => (new Date(n * DAN_MS).getUTCDay() + 6) % 7;

let fmt: Intl.DateTimeFormat | null = null;
const cache = new Map<number, HDatum>();

/** Hidžretski datum za dati dan (Umm al-Qura). */
export function hijri(n: number): HDatum {
  const hit = cache.get(n);
  if (hit) return hit;
  fmt ??= new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  // Podne UTC, da granice dana ne prave probleme.
  const parts = fmt.formatToParts(new Date(n * DAN_MS + DAN_MS / 2));
  const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? '0', 10);
  const h = { y: get('year'), m: get('month'), d: get('day') };
  cache.set(n, h);
  return h;
}

// 1. muharrem 1. h. ≈ 19. jul 622. (proleptički gregorijanski) — služi samo za procjenu.
const EPOHA = dayNum(622, 7, 19);

/** Broj dana za hidžretski datum, ili null ako taj dan ne postoji (npr. 30. u mjesecu od 29 dana). */
export function hijriUDan(hy: number, hm: number, hd: number): number | null {
  const procjena = EPOHA + Math.floor((hy - 1) * 354.36667 + (hm - 1) * 29.5306 + (hd - 1));
  for (let o = 0; o <= 25; o++) {
    for (const n of o === 0 ? [procjena] : [procjena - o, procjena + o]) {
      const h = hijri(n);
      if (h.y === hy && h.m === hm && h.d === hd) return n;
    }
  }
  return null;
}

/** "Džumadel-ula 1448." */
export const hijriMjesecNaziv = (m: number) => HIDZRI_MJESECI[m - 1] ?? '';

/** "14. džumadel-ula 1448. h." */
export function formatHijri(h: HDatum, saGodinom = true): string {
  return `${h.d}. ${hijriMjesecNaziv(h.m)}${saGodinom ? ` ${h.y}. h.` : ''}`;
}

/** "noć uoči 27. redžeba" */
export const nocUoci = (h: HDatum): string => `noć uoči ${h.d}. ${HIDZRI_MJESECI_GEN[h.m - 1]}`;

/** "nedjelja, 25. oktobar 2026." */
export function formatGreg(n: number, saDanom = true): string {
  const g = fromDayNum(n);
  const dan = saDanom ? `${DANI[danUSedmici(n)]}, ` : '';
  return `${dan}${g.d}. ${GREG_MJESECI[g.m - 1]} ${g.y}.`;
}

export const isoDatum = (n: number): string => {
  const g = fromDayNum(n);
  return `${g.y}-${String(g.m).padStart(2, '0')}-${String(g.d).padStart(2, '0')}`;
};

/** Pravilan oblik: 1 dan, 21 dan, 2 dana, 11 dana, 5 dana… */
export const danaRijec = (n: number): string => (n % 10 === 1 && n % 100 !== 11 ? 'dan' : 'dana');

// ---------------------------------------------------------------------------------------------
// Važni datumi
// ---------------------------------------------------------------------------------------------

export interface VazanDatum {
  kljuc: string;
  naziv: string;
  /** Kratak naziv za odbrojavanje: "Do Ramazana". */
  doNaziv: string;
  /** Hidžretski datum na koji se odnosi (za noći: dan UOČI kojeg je noć). */
  h: HDatum;
  /** Gregorijanski dan koji se prikazuje (za noći: dan čije veče počinje noć). */
  dan: number;
  /** true = noć (lejle) — obilježava se uveče, uoči hidžretskog datuma. */
  noc: boolean;
  /** true = datum je dodatno približan (npr. Lejletul-regaib). */
  priblizno: boolean;
  napomena?: string;
}

interface Definicija {
  kljuc: string;
  naziv: string;
  doNaziv: string;
  m: number;
  d: number;
  noc?: boolean;
  napomena?: string;
}

const DEFINICIJE: Definicija[] = [
  { kljuc: 'nova-godina', naziv: 'Nova hidžretska godina', doNaziv: 'Do Nove hidžretske godine', m: 1, d: 1 },
  { kljuc: 'asura', naziv: 'Ašura', doNaziv: 'Do Ašure', m: 1, d: 10 },
  { kljuc: 'mevlud', naziv: 'Mevlud (rođenje Poslanika, a.s.)', doNaziv: 'Do Mevluda', m: 3, d: 12 },
  // Lejletul-regaib se računa posebno (prva noć petka u redžebu).
  { kljuc: 'miradz', naziv: "Lejletul-mi'radž", doNaziv: "Do Lejletul-mi'radža", m: 7, d: 27, noc: true },
  { kljuc: 'berat', naziv: 'Lejletul-berat', doNaziv: 'Do Lejletul-berata', m: 8, d: 15, noc: true },
  { kljuc: 'ramazan', naziv: 'Početak Ramazana (prvi dan posta)', doNaziv: 'Do Ramazana', m: 9, d: 1, napomena: 'Prva teravija se klanja noć ranije.' },
  { kljuc: 'kadr', naziv: 'Lejletul-kadr', doNaziv: 'Do Lejletul-kadra', m: 9, d: 27, noc: true },
  { kljuc: 'ramazanski-bajram', naziv: 'Ramazanski bajram', doNaziv: 'Do Ramazanskog bajrama', m: 10, d: 1 },
  { kljuc: 'arefat', naziv: 'Arefat (Arefatski dan)', doNaziv: 'Do Arefata', m: 12, d: 9 },
  { kljuc: 'kurban-bajram', naziv: 'Kurban-bajram', doNaziv: 'Do Kurban-bajrama', m: 12, d: 10 },
];

/** Svi važni datumi jedne hidžretske godine, poredani po datumu. */
export function vazniDatumi(hy: number): VazanDatum[] {
  const out: VazanDatum[] = [];
  for (const def of DEFINICIJE) {
    const n = hijriUDan(hy, def.m, def.d);
    if (n === null) continue;
    out.push({
      kljuc: def.kljuc,
      naziv: def.naziv,
      doNaziv: def.doNaziv,
      h: { y: hy, m: def.m, d: def.d },
      dan: def.noc ? n - 1 : n,
      noc: !!def.noc,
      priblizno: false,
      napomena: def.napomena,
    });
  }
  // Lejletul-regaib: noć uoči prvog petka u mjesecu redžebu (veče četvrtka).
  const prviRedzeb = hijriUDan(hy, 7, 1);
  if (prviRedzeb !== null) {
    let petak = prviRedzeb;
    while (danUSedmici(petak) !== 4) petak++;
    out.push({
      kljuc: 'regaib',
      naziv: 'Lejletul-regaib',
      doNaziv: 'Do Lejletul-regaiba',
      h: hijri(petak),
      dan: petak - 1,
      noc: true,
      priblizno: true,
      napomena: 'Noć uoči prvog petka u redžebu — zavisi od tačnog početka mjeseca, pa je datum posebno približan.',
    });
  }
  return out.sort((a, b) => a.dan - b.dan);
}

/** Važni datumi tekuće i sljedeće hidžretske godine + sljedeći (najbliži) događaj. */
export function pregledVaznihDatuma(danas: number) {
  const hy = hijri(danas).y;
  const godine = [hy, hy + 1].map((y) => ({ godina: y, datumi: vazniDatumi(y) }));
  const svi = [...godine[0].datumi, ...godine[1].datumi, ...vazniDatumi(hy + 2)];
  const sljedeci = svi.find((v) => v.dan >= danas) ?? null;
  const sljedeciPo = (kljuc: string) => svi.find((v) => v.kljuc === kljuc && v.dan >= danas) ?? null;
  return { godine, sljedeci, sljedeciPo };
}

/** Važni datumi koji padaju u dati gregorijanski mjesec. */
export function vazniUMjesecu(y: number, m: number): VazanDatum[] {
  const prvi = dayNum(y, m, 1);
  const zadnji = dayNum(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) - 1;
  const hy1 = hijri(prvi).y;
  const hy2 = hijri(zadnji).y;
  const set = hy1 === hy2 ? vazniDatumi(hy1) : [...vazniDatumi(hy1), ...vazniDatumi(hy2)];
  return set.filter((v) => v.dan >= prvi && v.dan <= zadnji);
}
