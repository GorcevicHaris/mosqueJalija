// Čiste funkcije za formatiranje — bez uvoza podataka, pa ih smiju koristiti i klijentske skripte.

const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'jun',
  'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar',
];

/** "2026-10-24" -> "24. oktobar 2026." (isto kao formatDatum iz data.ts) */
export function datumTekst(iso: string): string {
  const [g, m, d] = iso.split('-').map(Number);
  if (!g || !m || !d) return iso;
  return `${d}. ${MJESECI[m - 1]} ${g}.`;
}

/** 636 -> "10:36", 3725 -> "1:02:05"; 0/negativno -> '' (nepoznato) */
export function trajanjeTekst(sekunde: number | null | undefined): string {
  if (!sekunde || sekunde <= 0) return '';
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  const s = Math.floor(sekunde % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Čitljivo trajanje za čitače ekrana: "10 min 36 s", "1 h 2 min" */
export function trajanjeOpis(sekunde: number | null | undefined): string {
  if (!sekunde || sekunde <= 0) return '';
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  const s = Math.floor(sekunde % 60);
  if (h) return `${h} h ${m} min`;
  return m ? `${m} min${s ? ` ${s} s` : ''}` : `${s} s`;
}

/** ISO 8601 trajanje za schema.org: 636 -> "PT10M36S" */
export function trajanjeISO(sekunde: number): string {
  const h = Math.floor(sekunde / 3600);
  const m = Math.floor((sekunde % 3600) / 60);
  const s = Math.floor(sekunde % 60);
  return `PT${h ? `${h}H` : ''}${m ? `${m}M` : ''}${s || (!h && !m) ? `${s}S` : ''}`;
}

/** 1234 -> "1.234" */
export function brojTekst(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Oblik riječi uz broj: oblik(1,'predavanje','predavanja','predavanja') */
export function oblik(n: number, jedan: string, dva: string, pet: string): string {
  const d = n % 10;
  const s = n % 100;
  if (d === 1 && s !== 11) return jedan;
  if (d >= 2 && d <= 4 && (s < 12 || s > 14)) return dva;
  return pet;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
