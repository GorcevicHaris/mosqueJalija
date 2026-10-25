// Tipovi za sadržaj koji postoji samo u bazi (nema ga u data/*.json ni u src/lib/types.ts).

export type ZaKoga = 'muškarci' | 'žene' | 'djeca' | 'svi';

/** Termin sedmičnog rasporeda (halke, mekteb, kursevi). dan: 1 = ponedjeljak … 7 = nedjelja. */
export interface TerminRasporeda {
  id: string;
  dan: number;
  vrijeme: string; // "17:00" ili opisno: "nakon akšama"
  naziv: string;
  opis: string | null;
  zaKoga: ZaKoga;
  aktivno: boolean;
  redoslijed: number;
}

/** Uvodni tekst statične stranice (mekteb, donacije, pravila-ponasanja, ucenje-kurana). */
export interface StranicaTekst {
  kljuc: string;
  naslov: string | null;
  /** Paragrafi (tekst iz baze podijeljen na prazne redove). Prazan niz = koristi ugrađeni tekst. */
  paragrafi: string[];
}

/** Objavljeno pitanje sa odgovorom ("Pitaj imama") — bez ličnih podataka. */
export interface JavnoPitanje {
  id: string;
  pitanje: string;
  odgovor: string;
  odgovorio: string | null;
  odgovorenoAt: string | null;
  createdAt: string;
}

/** Ručna ispravka predavanja (isti oblik kao vrijednosti u data/predavanja-ispravke.json). */
export interface IspravkaPredavanja {
  imam?: string | null;
  imamPotvrdjen?: boolean;
  kategorija?: string;
  serija?: string | null;
  serijaDio?: number | null;
  naslovCist?: string;
  opis?: string | null;
  /** true = predavanje se ne prikazuje nigdje na sajtu (lista, pretraga, RSS, sitemap; stranica se ne pravi) */
  skriveno?: boolean;
}

/** Kartica na statičnoj stranici (tabela kartice_stranica, migracija 0005). */
export interface KarticaIzBaze {
  stranica: string;
  naslov: string;
  tekst: string;
  ikona: string | null;
  link: string | null;
}

/** Ispravke transkripata: video_id → jezik → indeks segmenta → ispravljen tekst. */
export type TranskriptIspravke = Record<string, { bs?: Record<number, string>; en?: Record<number, string> }>;

/** Traka na vrhu sajta (postavke, red 'traka'). `do` = posljednji dan prikaza (YYYY-MM-DD) ili null. */
export interface Traka {
  aktivno: boolean;
  tekst: string;
  link: string | null;
  vrsta: 'info' | 'vazno' | 'dzenaza';
  do: string | null;
}

const VRSTE_TRAKE: Traka['vrsta'][] = ['info', 'vazno', 'dzenaza'];

/** Neprovjerena vrijednost iz baze → Traka (null = neispravno/prazno). */
export function trakaIz(v: unknown): Traka | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const tekst = typeof o.tekst === 'string' ? o.tekst.trim() : '';
  const link = typeof o.link === 'string' && /^(https?:\/\/|\/)/.test(o.link.trim()) ? o.link.trim() : null;
  const doDana = typeof o.do === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.do) ? o.do : null;
  return {
    aktivno: o.aktivno === true && tekst.length > 0,
    tekst,
    link,
    vrsta: VRSTE_TRAKE.includes(o.vrsta as Traka['vrsta']) ? (o.vrsta as Traka['vrsta']) : 'info',
    do: doDana,
  };
}

/** Datum "danas" u Novom Pazaru (Europe/Belgrade) kao YYYY-MM-DD. */
export const danasBeograd = (d = new Date()): string => d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Belgrade' });

/** true = traka treba da se vidi (aktivna, ima tekst, nije istekla). */
export const trakaVidljiva = (t: Traka | null, danas = danasBeograd()): t is Traka => !!t && t.aktivno && !!t.tekst && (!t.do || t.do >= danas);

export const DANI = ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'] as const;
export const nazivDana = (dan: number): string => DANI[(dan - 1 + 7) % 7] ?? '';
