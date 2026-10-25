// Zajedničke šeme podataka. Fajlovi u /data moraju poštovati ove tipove.
// Konvencija: `null` znači "podatak nije poznat" — UI tada prikazuje vidljiv placeholder.

export interface Izvor {
  naziv: string;
  url: string | null;
}

export interface Dzamija {
  naziv: string;
  nazivArapski: string | null;
  grad: string | null;
  drzava: string | null;
  adresa: string | null;
  koordinate: { lat: number; lng: number; potvrdjeno: boolean };
  kratakOpis: string | null;
  /** Naslovna fotografija (početna, O džamiji). Lokalna putanja ili URL iz admina; null = bez fotografije. */
  naslovnaSlika?: string | null;
  /** Potpis naslovne fotografije, npr. "Foto: Mešihat Islamske zajednice u Srbiji". */
  naslovnaSlikaIzvor?: string | null;
  historija: { naslov: string; tekst: string; izvor: string | null }[];
  cinjenice: { oznaka: string; vrijednost: string; izvor: string | null }[];
  kontakt: { email: string | null; telefon: string | null; napomena: string | null };
  drustveneMreze: { youtube: string; facebook: string | null; instagram: string | null };
  donacije: {
    primalac: string | null;
    banka: string | null;
    racun: string | null;
    iban: string | null;
    swift: string | null;
    svrha: string | null;
    napomena: string | null;
  };
  dzuma: { vrijeme: string | null; napomena: string | null };
  izvori: Izvor[];
}

/** Iz data/imami.json — generiše ga YouTube/podaci skripta (ko se pojavljuje u naslovima). */
export interface ImamOsnovno {
  slug: string; // npr. "admir-jasarevic" (ascii, ime-prezime)
  punoIme: string; // za prikaz, npr. "Hfz. Admir ef. Jašarević"
  aliasi: string[]; // varijante imena u naslovima (za prepoznavanje)
}

/** Iz data/imami-bio.json — piše ga istraživač, ključ je slug. */
export interface ImamBio {
  uloga: string | null; // npr. "Imam džamije", "Gost predavač"
  bio: string | null;
  slika: string | null;
  potvrdjeno: boolean;
  izvori: Izvor[];
}

export type Imam = ImamOsnovno & ImamBio & { brojPredavanja: number };

export interface Predavanje {
  id: string; // YouTube ID
  naslov: string; // originalni naslov sa YouTube-a
  naslovCist: string; // naslov bez imena imama i "| Džamija na Jaliji"
  datum: string; // YYYY-MM-DD
  trajanje: number; // sekunde
  thumbnail: string;
  imam: string | null; // slug iz imami.json
  imamPotvrdjen: boolean; // false = pogođeno heuristikom, treba provjeru
  kategorija: string; // slug iz kategorije.json
  serija: string | null; // slug iz serije.json
  serijaDio: number | null;
  opis: string | null;
  pregledi: number | null;
}

export interface Kategorija {
  slug: string;
  naziv: string;
  opis: string | null;
}

export interface Serija {
  slug: string;
  naziv: string;
  opis: string | null;
}

export interface Obavjestenje {
  slug: string;
  tip: 'obavjestenje' | 'objava';
  naslov: string;
  datum: string; // YYYY-MM-DD
  kategorija: string; // npr. "Predavanje", "Halke", "Mekteb", "Ostalo"
  sazetak: string;
  sadrzaj: string[]; // paragrafi
  slika: string | null;
  placeholder: boolean; // true = primjer sadržaja, zamijeniti stvarnim
}

export interface Dova {
  slug: string;
  naslov: string;
  kategorija: string;
  arapski: string | null;
  transliteracija: string | null;
  prevod: string;
  izvor: string; // npr. "El-Bekare, 255" ili "Buhari"
}

export interface AjetHadis {
  tip: 'ajet' | 'hadis';
  arapski: string | null;
  tekst: string;
  izvor: string;
}

export interface GalerijaSlika {
  src: string; // lokalna putanja (/images/...) ili URL
  alt: string;
  opis: string | null;
  izvor: string | null;
  licenca: string | null;
}
