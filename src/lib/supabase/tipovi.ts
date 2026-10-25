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
}

export const DANI = ['ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota', 'nedjelja'] as const;
export const nazivDana = (dan: number): string => DANI[(dan - 1 + 7) % 7] ?? '';
