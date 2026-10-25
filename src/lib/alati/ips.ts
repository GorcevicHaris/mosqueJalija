/**
 * NBS IPS QR kod (Odluka NBS o opštim pravilima za izvršavanje instant transfera odobrenja, Prilog 1).
 * Format: polja "TAG:vrijednost" razdvojena znakom "|", bez "|" na kraju. Za račun (K:PR) obavezni su
 * K, V, C, R, N, I, SF; opcioni P, S, RO (ili RL). Pravila su provjerena NBS validatorom
 * (https://nbs.rs/QRcode/api/qr/v1/validate) — vidi docs/alati.md:
 *  - R: tačno 18 cifara, kontrolni broj po modelu 97 (ISO 7064, mod 97-10);
 *  - N: 1–70 znakova, najviše 3 reda (novi red = "\n");
 *  - I: "RSD" + iznos sa decimalnim ZAREZOM (npr. RSD1000,00), ukupno 5–18 znakova, bez separatora hiljada;
 *  - SF: tri cifre, prva 1 (gotovinsko) ili 2 (bezgotovinsko), npr. 289, 221;
 *  - S: 0–35 znakova; RO: do 25 znakova, prva dva su cifre (model), za model 97 važi kontrola mod 97.
 *  - Znak "|", "\" i tipografske crtice (–, —) i "€" validator odbija.
 */

export interface IpsPodaci {
  racun: string;
  primalac: string;
  iznos: number | null;
  sifraPlacanja?: string;
  svrha?: string | null;
  pozivNaBroj?: string | null;
}

export type IpsRezultat = { ok: true; tekst: string } | { ok: false; greske: string[] };

/** Ostatak dijeljenja dugog niza cifara sa 97. */
function mod97(cifre: string): number {
  let r = 0;
  for (const c of cifre) r = (r * 10 + Number(c)) % 97;
  return r;
}

/**
 * Normalizuje broj računa ("160-123456-54", "160 0000000123456 54") u 18 cifara:
 * prve 3 = banka, zadnje 2 = kontrolni broj, sredina se dopunjava nulama sleva do 13 cifara.
 */
export function normalizujRacun(unos: string): string | null {
  const s = unos.trim();
  let banka: string;
  let broj: string;
  let kontrola: string;
  const dijelovi = s.split(/[-\s]+/).filter(Boolean);
  if (dijelovi.length === 3) {
    [banka, broj, kontrola] = dijelovi;
  } else {
    const c = s.replace(/\D/g, '');
    if (c.length < 6 || c.length > 18) return null;
    banka = c.slice(0, 3);
    broj = c.slice(3, -2);
    kontrola = c.slice(-2);
  }
  if (!/^\d{3}$/.test(banka) || !/^\d{1,13}$/.test(broj) || !/^\d{2}$/.test(kontrola)) return null;
  return banka + broj.padStart(13, '0') + kontrola;
}

/** Kontrolni broj po modelu 97 za 18-cifreni račun. */
export function racunIspravan(r18: string): boolean {
  return /^\d{18}$/.test(r18) && 98 - mod97(r18.slice(0, 16) + '00') === Number(r18.slice(16));
}

/** "160000000012345654" → "160-0000000123456-54" */
export const formatirajRacun = (r18: string) => `${r18.slice(0, 3)}-${r18.slice(3, 16)}-${r18.slice(16)}`;

/** Zamjenjuje tipografske znakove i uklanja one koje IPS validator ne prihvata. */
export function ocistiTekst(s: string, dozvoliNoviRed = false): string {
  const t = s
    .replace(/[–—−]/g, '-')
    .replace(/[“”„«»]/g, '"')
    .replace(/[‘’‚]/g, "'")
    .replace(/€/g, 'EUR')
    .replace(/\r\n?/g, '\n');
  let out = '';
  for (const ch of t) {
    if (ch === '\n' && dozvoliNoviRed) out += ch;
    else if (/[\x20-\x7EÀ-ſЀ-ӿ]/.test(ch) && ch !== '|' && ch !== '\\') out += ch;
    else if (/\s/.test(ch)) out += ' ';
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

/** 1234.5 → "RSD1234,50" */
export function formatirajIznos(iznos: number): string {
  return 'RSD' + iznos.toFixed(2).replace('.', ',');
}

export const IPS_MAX_IZNOS = 999_999_999_999.99; // "I" najviše 18 znakova

/** Mod-97 kontrola poziva na broj za model 97 (cifre; slova se pretvaraju A=10 … Z=35). */
function pozivModel97Ispravan(ro: string): boolean {
  const kontrola = ro.slice(2, 4);
  const ostatak = ro.slice(4).toUpperCase();
  if (!/^\d{2}$/.test(kontrola) || !ostatak) return false;
  const cifre = [...ostatak.replace(/-/g, '')].map((c) => (/\d/.test(c) ? c : String(c.charCodeAt(0) - 55))).join('');
  if (!/^\d+$/.test(cifre)) return false;
  return 98 - mod97(cifre + '00') === Number(kontrola);
}

export function napraviIpsTekst(p: IpsPodaci): IpsRezultat {
  const greske: string[] = [];
  const r = normalizujRacun(p.racun);
  if (!r) greske.push('Broj računa mora imati 18 cifara (banka-broj-kontrolni broj).');
  else if (!racunIspravan(r)) greske.push('Kontrolni broj računa nije ispravan (model 97).');

  const n = ocistiTekst(p.primalac, true)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n');
  if (!n) greske.push('Naziv primaoca je obavezan.');
  else if (n.length > 70) greske.push('Naziv i adresa primaoca mogu imati najviše 70 znakova.');

  if (p.iznos === null || !Number.isFinite(p.iznos) || p.iznos < 0.01) greske.push('Unesite iznos (najmanje 0,01 RSD).');
  else if (p.iznos > IPS_MAX_IZNOS) greske.push('Iznos je prevelik.');

  const sf = p.sifraPlacanja ?? '289';
  if (!/^[12]\d{2}$/.test(sf)) greske.push('Šifra plaćanja mora imati tri cifre, a prva je 1 ili 2.');

  const s = p.svrha ? ocistiTekst(p.svrha).slice(0, 35).trim() : '';

  let ro = p.pozivNaBroj ? p.pozivNaBroj.replace(/\s+/g, '') : '';
  if (ro) {
    if (ro.length > 25 || !/^\d{2}[0-9A-Za-z-]*$/.test(ro)) greske.push('Poziv na broj: prve dvije cifre su model, najviše 25 znakova.');
    else if (ro.startsWith('97') && !pozivModel97Ispravan(ro)) greske.push('Poziv na broj po modelu 97 nema ispravan kontrolni broj.');
  }

  if (greske.length) return { ok: false, greske };
  const polja = [
    'K:PR',
    'V:01',
    'C:1',
    `R:${r}`,
    `N:${n}`,
    `I:${formatirajIznos(Math.round((p.iznos as number) * 100) / 100)}`,
    `SF:${sf}`,
  ];
  if (s) polja.push(`S:${s}`);
  if (ro) polja.push(`RO:${ro}`);
  return { ok: true, tekst: polja.join('|') };
}
