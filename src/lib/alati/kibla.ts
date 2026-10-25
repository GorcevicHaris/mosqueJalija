/**
 * Pravac kible: početni azimut ortodrome (velikog kruga) od tačke posmatrača do Kabe.
 * θ = atan2( sin Δλ · cos φ2 , cos φ1 · sin φ2 − sin φ1 · cos φ2 · cos Δλ ), mjereno od geografskog
 * sjevera u smjeru kazaljke na satu. Za Džamiju na Jaliji (43,1480° N, 20,5245° E) ≈ 137,4° (provjera: London ≈ 119,0°, New York ≈ 58,5°, Sarajevo ≈ 134,8°).
 */
export const KABA = { lat: 21.422487, lng: 39.826206 } as const;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

export interface Tacka {
  lat: number;
  lng: number;
}

/** Azimut kible u stepenima (0–360, od geografskog sjevera, u smjeru kazaljke). */
export function azimutKible(t: Tacka): number {
  const φ1 = rad(t.lat);
  const φ2 = rad(KABA.lat);
  const Δλ = rad(KABA.lng - t.lng);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/** Udaljenost do Kabe po velikom krugu (km), haversinus. */
export function udaljenostDoKabe(t: Tacka): number {
  const R = 6371.0088;
  const dφ = rad(KABA.lat - t.lat);
  const dλ = rad(KABA.lng - t.lng);
  const h = Math.sin(dφ / 2) ** 2 + Math.cos(rad(t.lat)) * Math.cos(rad(KABA.lat)) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

const STRANE = ['S', 'SSI', 'SI', 'ISI', 'I', 'IJI', 'JI', 'JJI', 'J', 'JJZ', 'JZ', 'ZJZ', 'Z', 'ZSZ', 'SZ', 'SSZ'];
const STRANE_PUNO: Record<string, string> = {
  S: 'sjever', I: 'istok', J: 'jug', Z: 'zapad', SI: 'sjeveroistok', JI: 'jugoistok', JZ: 'jugozapad', SZ: 'sjeverozapad',
};

/** 137.4 → "JI" (16 strana svijeta: S, I, J, Z). */
export const stranaSvijeta = (az: number) => STRANE[Math.round(az / 22.5) % 16];
/** Puni naziv najbliže od 8 strana: "jugoistok". */
export const stranaSvijetaPuno = (az: number) =>
  STRANE_PUNO[['S', 'SI', 'I', 'JI', 'J', 'JZ', 'Z', 'SZ'][Math.round(az / 45) % 8]];

/** Najmanja ugaona razlika a − b u opsegu (−180, 180]. */
export function razlikaUgla(a: number, b: number): number {
  let d = (a - b) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** "136,6°" */
export const formatStepeni = (x: number, dec = 1) => `${x.toFixed(dec).replace('.', ',')}°`;
