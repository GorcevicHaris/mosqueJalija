/**
 * Podesivi parametri vaktije. Kalibrisano prema zvaničnoj vaktiji Islamske zajednice
 * (vaktija.ba, api.vaktija.ba) — detalji i poređenje u docs/vaktija.md.
 *
 * VAŽNO: ovaj fajl se koristi i u pregledaču, zato NE smije uvoziti src/lib/data.ts.
 * Koordinate džamije se uvijek čitaju iz data/dzamija.json (prosljeđuju se kroz data-* atribute).
 */

export type VakatKljuc = 'zora' | 'izlazak' | 'podne' | 'ikindija' | 'aksam' | 'jacija';

/** Redoslijed u svim nizovima: zora, izlazak sunca, podne, ikindija, akšam, jacija. */
export type SestVrijednosti = [number, number, number, number, number, number];

export const VAKTIJA_CONFIG = {
  /** Vremenska zona za prikaz i računanje "današnjeg" dana (nezavisno od zone posjetioca, DST uključen). */
  timeZone: 'Europe/Belgrade',

  /** Astronomski parametri (adhan). Zora i jacija po uglu Sunca ispod horizonta, ikindija po šafijskom mezhebu (sjena = 1×). */
  fajrAngle: 18,
  ishaAngle: 16.1,
  madhab: 'shafi' as 'shafi' | 'hanafi',

  /**
   * Korekcija u minutama koja se dodaje astronomskom vremenu PRIJE zaokruživanja na minut:
   *   k = c0 + a1·cos(w) + b1·sin(w) + a2·cos(2w) + b2·sin(2w),  w = 2π·(danUGodini − 1) / 365.25
   * c0 je stalni pomak (zvanična vaktija koristi "ihtijat": izlazak sunca ~6 min ranije, akšam ~6 min
   * kasnije, podne ~1 min kasnije od astronomskog), a sezonski članovi upijaju razliku između
   * algoritma zvanične tabele i adhan-a. Koeficijenti su dobijeni metodom najmanjih kvadrata
   * na cijeloj 2026. godini (vidi docs/vaktija.md). Za jednostavan stalni pomak ostaviti samo c0.
   * Redoslijed: zora, izlazak, podne, ikindija, akšam, jacija; svaki red [c0, a1, b1, a2, b2].
   */
  korekcije: [
    [0.048, -0.018, -0.21, 0.082, 0.083],
    [-6.151, 0.78, 0.786, -0.145, 0.048],
    [0.957, 0.135, 0.055, -0.141, 0.069],
    [-0.097, -0.217, -1.046, -0.381, -0.199],
    [5.988, -0.225, -0.77, -0.178, 0.16],
    [-0.654, -0.047, -1.017, -0.148, 0.367],
  ] as number[][],

  /**
   * Zvanična vaktija za gradove izvan Sarajeva NIJE posebno astronomski računata: dobija se kao
   * sarajevsko vrijeme + fiksna razlika u minutama za svaki mjesec. Da bismo se poklopili sa
   * zvaničnom vaktijom, radimo isto: računamo za referentnu tačku (Sarajevo) i dodajemo razlike.
   */
  referenca: { naziv: 'Sarajevo', lat: 43.8563, lng: 18.4131 },

  /**
   * Tabela mjesečnih razlika (u minutama, u odnosu na Sarajevo) za grad džamije.
   * Primjenjuje se samo ako su koordinate džamije unutar `radiusKm` od grada; inače se
   * vaktija računa direktno za koordinate džamije (iste postavke uglova i pomaka).
   * Izvor: api.vaktija.ba/vaktija/v1/110/2026 (Novi Pazar) minus /77/2026 (Sarajevo).
   */
  tabela: {
    grad: 'Novi Pazar',
    lat: 43.1367,
    lng: 20.5122,
    radiusKm: 30,
    // [zora, izlazak, podne, ikindija, akšam, jacija] za januar … decembar
    razlike: [
      [-7, -7, -8, -10, -10, -10],
      [-7, -7, -8, -9, -9, -9],
      [-8, -8, -8, -8, -8, -8],
      [-9, -9, -8, -8, -8, -8],
      [-10, -10, -8, -7, -7, -7],
      [-11, -11, -8, -4, -4, -4],
      [-10, -10, -8, -4, -4, -4],
      [-10, -10, -8, -7, -7, -7],
      [-9, -9, -8, -8, -8, -8],
      [-8, -8, -8, -9, -9, -9],
      [-7, -7, -8, -10, -10, -10],
      [-6, -6, -8, -10, -10, -10],
    ] as SestVrijednosti[],
  },

  /** Zvanični izvor za poređenje (link u napomeni na stranici). */
  zvanicniIzvor: { naziv: 'vaktija.ba', url: 'https://vaktija.ba/novi-pazar' },

  /**
   * Napomena o klanjanju sabah-namaza u džamiji (npr. "Sabah se klanja 20 minuta prije izlaska sunca").
   * null = nepoznato → stranica prikazuje placeholder. Ako je postavljeno `sabahMinutaPrijeIzlaska`,
   * u tabeli se prikazuje i izračunato vrijeme sabaha u džamiji.
   */
  sabahNapomena: null as string | null,
  sabahMinutaPrijeIzlaska: null as number | null,
};

export const VAKTI: { kljuc: VakatKljuc; naziv: string; namaz: boolean }[] = [
  { kljuc: 'zora', naziv: 'Zora', namaz: true },
  { kljuc: 'izlazak', naziv: 'Izlazak sunca', namaz: false },
  { kljuc: 'podne', naziv: 'Podne', namaz: true },
  { kljuc: 'ikindija', naziv: 'Ikindija', namaz: true },
  { kljuc: 'aksam', naziv: 'Akšam', namaz: true },
  { kljuc: 'jacija', naziv: 'Jacija', namaz: true },
];
