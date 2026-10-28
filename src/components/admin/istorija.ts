// Istorija pregledača u admin panelu: dugme "Nazad" (telefon: sistemsko dugme / pokret) zatvara
// otvorenu formu i vraća na prethodni odjeljak — umjesto da napusti /admin/ i odvede na javnu
// stranicu sa koje je urednik došao (npr. /galerija/).
// Svaki odjeljak je jedan unos u istoriji (?odjeljak=…); otvorena forma je još jedan unos iznad njega.
interface Stanje {
  adm: true;
  odjeljak: string;
  forma: boolean;
}

const zatvaraci = new Map<string, () => boolean>();
let trenutni = '';
let preskoci = 0;

const urlZa = (id: string): string => {
  const u = new URL(location.href);
  u.searchParams.set('odjeljak', id);
  return u.pathname + u.search; // bez #hash-a (npr. ostaci linka za prijavu)
};
const stanjeIz = (s: unknown): Stanje | null => (s && typeof s === 'object' && (s as Stanje).adm ? (s as Stanje) : null);

/** Odjeljak koji je sad prikazan (main.ts). `push` = novi unos u istoriji, `replace` = zamijeni, `ne` = bez promjene (popstate). */
export function zapamtiOdjeljak(id: string, nacin: 'push' | 'replace' | 'ne') {
  const bio = trenutni;
  trenutni = id;
  if (nacin === 'ne') return;
  const st: Stanje = { adm: true, odjeljak: id, forma: false };
  if (nacin === 'push' && bio && bio !== id) history.pushState(st, '', urlZa(id));
  else history.replaceState(st, '', urlZa(id));
}

/**
 * Forma je otvorena u trenutnom odjeljku. `pokusajZatvori` zatvara formu (uz pitanje za nesačuvane
 * izmjene) i vraća false ako je urednik odustao od zatvaranja.
 */
export function formaOtvorena(pokusajZatvori: () => boolean) {
  const id = trenutni;
  const vec = zatvaraci.has(id);
  zatvaraci.set(id, pokusajZatvori);
  if (!vec) history.pushState({ adm: true, odjeljak: id, forma: true } satisfies Stanje, '', urlZa(id));
}

/** Forma je zatvorena dugmetom (Odustani / Sačuvaj / Zatvori): ukloni njen unos iz istorije. */
export function formaZatvorena() {
  const id = trenutni;
  if (!zatvaraci.delete(id)) return;
  const s = stanjeIz(history.state);
  if (s?.forma && s.odjeljak === id) {
    preskoci++;
    history.back();
  }
}

/** Dugme "Nazad"/"Naprijed": zatvori formu ili prebaci odjeljak (otvori = main.ts otvoriOdjeljak bez novog unosa). */
export function pratiIstoriju(otvori: (id: string) => void) {
  window.addEventListener('popstate', (e) => {
    if (preskoci) {
      preskoci--;
      return;
    }
    const s = stanjeIz(e.state);
    const cilj = s?.odjeljak ?? new URLSearchParams(location.search).get('odjeljak') ?? 'obavjestenja';
    const z = zatvaraci.get(trenutni);
    if (z && (cilj !== trenutni || !s?.forma)) {
      zatvaraci.delete(trenutni);
      if (!z()) {
        // urednik je odustao (nesačuvane izmjene) — vrati unos forme
        zatvaraci.set(trenutni, z);
        history.pushState({ adm: true, odjeljak: trenutni, forma: true } satisfies Stanje, '', urlZa(trenutni));
        return;
      }
    }
    if (cilj !== trenutni) otvori(cilj);
  });
}
