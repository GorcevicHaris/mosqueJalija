// Pregledač: programi za upis direktno iz baze (tabela programi), da se novi/izmijenjen program vidi
// odmah, bez čekanja na build. null = baza nije podešena, tabela ne postoji, nema redova ili mreža
// ne radi → stranica ostaje sa listom iz builda. Jedan zahtjev po učitavanju stranice (dijele ga
// lista na /upis i obrazac).
import { restUrl, supabaseUkljucen, TABELE, zaglavlja } from '../supabase/config';
import { PROGRAMI_SELECT, programIzReda, type Program } from './programi';

let zahtjev: Promise<Program[] | null> | null = null;

export function ucitajProgrameUzivo(): Promise<Program[] | null> {
  if (!supabaseUkljucen) return Promise.resolve(null);
  zahtjev ??= (async () => {
    try {
      const res = await fetch(restUrl(`${TABELE.programi}?select=${PROGRAMI_SELECT}&order=redoslijed.asc,slug.asc`), {
        headers: zaglavlja(),
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) return null;
      const redovi = (await res.json()) as unknown;
      if (!Array.isArray(redovi) || !redovi.length) return null;
      return redovi
        .map((r) => programIzReda(r as Record<string, unknown>))
        .filter((p): p is Program & { aktivno: boolean } => !!p && p.aktivno)
        .map(({ aktivno: _a, ...p }) => p);
    } catch {
      return null;
    }
  })();
  return zahtjev;
}
