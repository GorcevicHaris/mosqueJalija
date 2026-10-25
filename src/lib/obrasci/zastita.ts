// Anti-spam na klijentu (prva linija odbrane; prava zaštita je okidač u bazi — 0004_javni_unosi.sql):
//  1) honeypot polje (ljudi ga ne vide),
//  2) minimalno vrijeme popunjavanja (botovi šalju odmah),
//  3) ograničenje po pregledniku (localStorage; ako nije dostupan, preskače se).

export const MIN_VRIJEME_MS = 3000;
const PAUZA_MS = 30_000; // između dva slanja istog obrasca
const PROZOR_MS = 60 * 60 * 1000; // 1 h
const MAX_U_PROZORU = 5;

function kljuc(obrazac: string) {
  return `dnj-obrazac-${obrazac}`;
}

function citaj(obrazac: string): number[] {
  try {
    const raw = localStorage.getItem(kljuc(obrazac));
    const arr = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(arr) ? arr.filter((x): x is number => typeof x === 'number') : [];
  } catch {
    return [];
  }
}

/** Vraća poruku ako slanje treba odbiti, inače null. */
export function provjeriOgranicenje(obrazac: string, sada = Date.now()): string | null {
  const t = citaj(obrazac).filter((x) => sada - x < PROZOR_MS);
  const zadnje = t.length ? Math.max(...t) : 0;
  if (zadnje && sada - zadnje < PAUZA_MS) {
    const s = Math.ceil((PAUZA_MS - (sada - zadnje)) / 1000);
    return `Upravo ste poslali obrazac. Sačekajte još ${s} s prije novog slanja.`;
  }
  if (t.length >= MAX_U_PROZORU) return 'Iz ovog preglednika je poslano previše obrazaca u posljednjih sat vremena. Pokušajte kasnije.';
  return null;
}

export function zabiljeziSlanje(obrazac: string, sada = Date.now()) {
  try {
    const t = citaj(obrazac).filter((x) => sada - x < PROZOR_MS);
    t.push(sada);
    localStorage.setItem(kljuc(obrazac), JSON.stringify(t.slice(-MAX_U_PROZORU)));
  } catch {
    /* privatni prozor / blokirano skladište — preskačemo */
  }
}

/** Mjeri vrijeme od prikaza obrasca. */
export function startMjerenja(): () => number {
  const start = performance.now();
  return () => performance.now() - start;
}

export function jeBot(form: HTMLFormElement): boolean {
  const hp = form.querySelector<HTMLInputElement>('[data-ob-hp] input');
  return Boolean(hp && hp.value);
}
