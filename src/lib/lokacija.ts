// Lokacija džamije: sve mape i navigacija vode na Google Maps (ugrađena mapa, "Otvori", navigacija).
import { dzamija, punaAdresa } from './data';

const { lat, lng, potvrdjeno } = dzamija.koordinate;

export const lokacija = {
  lat,
  lng,
  potvrdjeno,
  /** "Jalija 69, 36300 Novi Pazar, Srbija" ('' = nepoznato) */
  adresa: punaAdresa(),
  /** Ugrađena Google mapa (iframe). */
  embed: (zoom = 17) => `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=sr&output=embed`,
  /** Otvori lokaciju u Google Maps. */
  otvori: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
  /** Navigacija (uputstva za put) do džamije u Google Maps. */
  navigacija: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
};
