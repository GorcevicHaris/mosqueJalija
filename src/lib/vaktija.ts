/**
 * Računanje vaktije u pregledaču (i na serveru) pomoću biblioteke `adhan`.
 * Ne uvozi data.ts — koordinate se prosljeđuju kao argument.
 */
import { CalculationParameters, Coordinates, Madhab, PrayerTimes, Rounding } from 'adhan';
import { VAKTIJA_CONFIG, VAKTI, type VakatKljuc } from './vaktija-config.ts';

export interface Koordinate {
  lat: number;
  lng: number;
}

export interface Vakat {
  kljuc: VakatKljuc;
  naziv: string;
  namaz: boolean;
  /** Apsolutni trenutak (UTC instant). */
  vrijeme: Date;
  /** "HH:MM" u zoni Europe/Belgrade. */
  hhmm: string;
}

export interface DanVaktije {
  /** YYYY-MM-DD (kalendarski dan u zoni džamije) */
  datum: string;
  god: number;
  mj: number; // 1-12
  dan: number;
  danUSedmici: number; // 0 = nedjelja
  vakti: Vakat[];
}

const TZ = VAKTIJA_CONFIG.timeZone;
const MINUT = 60_000;

const fmtHM = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const fmtYMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "HH:MM" za instant, u zoni džamije. */
export function formatHHMM(d: Date): string {
  return fmtHM.format(d);
}

/** Današnji (ili za dati trenutak) kalendarski dan u zoni džamije. */
export function danUZoni(now: Date = new Date()): { god: number; mj: number; dan: number } {
  const [god, mj, dan] = fmtYMD.format(now).split('-').map(Number);
  return { god, mj, dan };
}

export function brojDanaUMjesecu(god: number, mj: number): number {
  return new Date(Date.UTC(god, mj, 0)).getUTCDate();
}

function udaljenostKm(a: Koordinate, b: Koordinate): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 'tabela' = zvanični način (Sarajevo + mjesečne razlike), 'direktno' = računanje za koordinate džamije. */
export function metodaZa(k: Koordinate): 'tabela' | 'direktno' {
  const t = VAKTIJA_CONFIG.tabela;
  return udaljenostKm(k, { lat: t.lat, lng: t.lng }) <= t.radiusKm ? 'tabela' : 'direktno';
}

function parametri(): CalculationParameters {
  const p = new CalculationParameters('Other', VAKTIJA_CONFIG.fajrAngle, VAKTIJA_CONFIG.ishaAngle);
  p.madhab = VAKTIJA_CONFIG.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.None;
  return p;
}

const zaokruzi = (ms: number) => Math.round(ms / MINUT) * MINUT;

/** Vaktija za kalendarski dan (god, mj 1-12, dan) u zoni džamije. */
export function izracunajDan(
  god: number,
  mj: number,
  dan: number,
  k: Koordinate,
  metoda: 'tabela' | 'direktno' = metodaZa(k),
): DanVaktije {
  const tacka = metoda === 'tabela' ? VAKTIJA_CONFIG.referenca : k;
  // adhan čita getFullYear/getMonth/getDate (lokalne komponente) — zato lokalni Date sa tim komponentama,
  // a rezultat su apsolutni UTC trenuci. Radi ispravno bez obzira na zonu posjetioca.
  const lokalni = new Date(god, mj - 1, dan, 12);
  const pt = new PrayerTimes(new Coordinates(tacka.lat, tacka.lng), lokalni, parametri());
  const sirovo = [pt.fajr, pt.sunrise, pt.dhuhr, pt.asr, pt.maghrib, pt.isha];
  const razlike = metoda === 'tabela' ? VAKTIJA_CONFIG.tabela.razlike[mj - 1] : [0, 0, 0, 0, 0, 0];
  const doy = Math.round((Date.UTC(god, mj - 1, dan) - Date.UTC(god, 0, 1)) / 86_400_000) + 1;
  const w = (2 * Math.PI * (doy - 1)) / 365.25;
  const vakti: Vakat[] = VAKTI.map((v, i) => {
    const [c0 = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0] = VAKTIJA_CONFIG.korekcije[i] ?? [];
    const korekcija = c0 + a1 * Math.cos(w) + b1 * Math.sin(w) + a2 * Math.cos(2 * w) + b2 * Math.sin(2 * w);
    const t = zaokruzi(sirovo[i].getTime() + korekcija * MINUT) + razlike[i] * MINUT;
    const vrijeme = new Date(t);
    return { ...v, vrijeme, hhmm: formatHHMM(vrijeme) };
  });
  return {
    datum: `${god}-${pad2(mj)}-${pad2(dan)}`,
    god,
    mj,
    dan,
    danUSedmici: new Date(Date.UTC(god, mj - 1, dan)).getUTCDay(),
    vakti,
  };
}

export function izracunajMjesec(god: number, mj: number, k: Koordinate): DanVaktije[] {
  const n = brojDanaUMjesecu(god, mj);
  return Array.from({ length: n }, (_, i) => izracunajDan(god, mj, i + 1, k));
}

/** Pomjeri kalendarski dan za `delta` dana. */
export function pomjeriDan(god: number, mj: number, dan: number, delta: number) {
  const d = new Date(Date.UTC(god, mj - 1, dan + delta));
  return { god: d.getUTCFullYear(), mj: d.getUTCMonth() + 1, dan: d.getUTCDate() };
}

export interface Stanje {
  /** indeks trenutnog vakta u danasnjem nizu (-1 = nema: prije zore ili između izlaska i podne) */
  trenutni: number;
  /** naredni vakat (može biti sutrašnja zora) */
  naredni: Vakat;
  naredniSutra: boolean;
}

export function stanje(now: Date, danas: DanVaktije, sutra: DanVaktije): Stanje {
  const t = now.getTime();
  let trenutni = -1;
  danas.vakti.forEach((v, i) => {
    if (v.vrijeme.getTime() <= t) trenutni = i;
  });
  // između izlaska sunca i podne nema namaskog vakta
  if (trenutni === 1) trenutni = -1;
  const idx = danas.vakti.findIndex((v) => v.vrijeme.getTime() > t);
  if (idx === -1) return { trenutni, naredni: sutra.vakti[0], naredniSutra: true };
  return { trenutni, naredni: danas.vakti[idx], naredniSutra: false };
}

/** 3725000 ms -> "1:02:05" */
export function formatOdbrojavanje(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h ? `${h}:${pad2(m)}:${pad2(sec)}` : `${m}:${pad2(sec)}`;
}

export const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];
export const MJESECI_GEN = [
  'januara', 'februara', 'marta', 'aprila', 'maja', 'juna',
  'jula', 'avgusta', 'septembra', 'oktobra', 'novembra', 'decembra',
];
export const DANI = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
export const DANI_KRATKO = ['ned', 'pon', 'uto', 'sri', 'čet', 'pet', 'sub'];

const HIDZRI_MJESECI = [
  'muharrem', 'safer', 'rebiul-evvel', 'rebiul-ahir', 'džumadel-ula', 'džumadel-uhra',
  'redžeb', "ša'ban", 'ramazan', 'ševval', "zul-ka'de", 'zul-hidždže',
];

/** "nedjelja, 25. oktobar 2026." */
export function formatGregorijanski(god: number, mj: number, dan: number): string {
  const dow = new Date(Date.UTC(god, mj - 1, dan)).getUTCDay();
  return `${DANI[dow]}, ${dan}. ${MJESECI[mj - 1]} ${god}.`;
}

/** Hidžretski datum (Umm al-Qura) za kalendarski dan, npr. "4. džumade-l-ula 1448. h." ili null ako pregledač ne podržava. */
export function formatHidzretski(god: number, mj: number, dan: number): string | null {
  try {
    const f = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
      timeZone: 'UTC',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = f.formatToParts(new Date(Date.UTC(god, mj - 1, dan, 12)));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, ''));
    const d = get('day');
    const m = get('month');
    const y = get('year');
    if (!d || !m || !y || m > 12) return null;
    return `${d}. ${HIDZRI_MJESECI[m - 1]} ${y}. h.`;
  } catch {
    return null;
  }
}
