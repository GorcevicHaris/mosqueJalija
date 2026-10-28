// Admin: Aktivnosti (objave sa tekstom i/ili slikama) i Citati i pouke — generički uređivač (crud.ts).
// Tabele iz migracije 0006. Stranice /aktivnosti i /citati (i blokovi na početnoj) čitaju bazu u
// pregledaču, pa se sačuvana objava vidi odmah, bez čekanja na build.
import { PoljeGreska, type DefTabele, type Red } from './crud';
import type { Opcija } from './polja';
import { datumVrijeme } from './util';

const DA_NE: Opcija[] = [{ v: 'da', t: 'Da' }, { v: 'ne', t: 'Ne' }];
const kratko = (s: unknown, max = 90): string => {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};
const poruka = (p: Red) =>
  p.objavljeno ? 'Objavljeno — vidi se odmah na sajtu.' : 'Sačuvano kao skica — na sajtu se ne vidi dok ne uključite "Objavljeno".';
const tekstIliNull = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

// ---------------------------------------------------------------------------------------------
// Aktivnosti
// ---------------------------------------------------------------------------------------------
export const aktivnosti: DefTabele = {
  id: 'aktivnosti',
  tabela: 'aktivnosti',
  pk: 'id',
  naslov: 'Aktivnosti',
  opis: 'Kratke objave o aktivnostima džemata — tekst, fotografije ili oboje (kao na društvenim mrežama). Prikazuju se na stranici Aktivnosti i na početnoj, odmah poslije čuvanja.',
  novoTekst: 'Nova objava',
  select: 'id,naslov,tekst,slike,datum,objavljeno,created_at,updated_at',
  red: [['datum', false], ['created_at', false]],
  polja: [
    {
      k: 'tekst',
      l: 'Tekst objave',
      t: 'textarea',
      redovi: 5,
      max: 5000,
      rastuci: true,
      placeholder: 'Šta se desilo ili šta organizujemo? Npr. "Danas je održano takmičenje mektebske djece…"',
      pomoc: 'Novi red = novi red; prazan red = novi pasus. Linkovi (https://…) postaju klikabilni. Tekst nije obavezan ako dodate slike.',
    },
    { k: 'slike', l: 'Fotografije', t: 'slike', max: 10, folder: 'aktivnosti' },
    { k: 'naslov', l: 'Naslov (nije obavezan)', t: 'text', max: 200, placeholder: 'npr. Iftar za djecu mekteba' },
    { k: 'objavljeno', l: 'Objavljeno na sajtu', t: 'checkbox', pomoc: 'Isključeno = skica, vidljiva samo urednicima.' },
  ],
  novi: () => ({ objavljeno: true, slike: [] }),
  prijeSnimanja(p) {
    const tekst = tekstIliNull(p.tekst);
    const slike = Array.isArray(p.slike) ? (p.slike as string[]).filter(Boolean).slice(0, 10) : [];
    if (!tekst && !slike.length) throw new PoljeGreska('tekst', 'Napišite tekst ili dodajte bar jednu fotografiju.');
    return { naslov: tekstIliNull(p.naslov), tekst, slike, objavljeno: p.objavljeno === true };
  },
  porukaSacuvano: poruka,
  prikaz: (r) => {
    const slike = Array.isArray(r.slike) ? (r.slike as string[]) : [];
    return {
      naslov: String(r.naslov || kratko(r.tekst) || (slike.length ? 'Objava sa fotografijama' : '(prazno)')),
      meta: `${datumVrijeme(r.datum as string)}${slike.length ? ` · ${slike.length} ${slike.length === 1 ? 'slika' : slike.length < 5 ? 'slike' : 'slika'}` : ''}`,
      slika: slike[0] ?? null,
      znacke: r.objavljeno ? [] : [{ t: 'Skica', v: 'warn' }],
    };
  },
  pretraga: (r) => `${r.naslov ?? ''} ${r.tekst ?? ''}`,
  filteri: [{ k: 'objavljeno', l: 'Objavljeno', opcije: DA_NE, test: (r, v) => (v === 'da') === (r.objavljeno === true) }],
  slikaPolja: ['slike'],
  potvrdaBrisanja: (r) => `Obrisati objavu "${String(r.naslov || kratko(r.tekst, 60) || 'sa fotografijama')}"? Fotografije se brišu i iz skladišta. Ovo se ne može poništiti.`,
};

// ---------------------------------------------------------------------------------------------
// Citati i pouke
// ---------------------------------------------------------------------------------------------
const VRSTE: Opcija[] = [
  { v: 'citat', t: 'Citat (mudra riječ)' },
  { v: 'hadis', t: 'Hadis' },
  { v: 'ajet', t: 'Ajet' },
  { v: 'pouka', t: 'Pouka' },
];
const nazivVrste = (v: unknown) => VRSTE.find((x) => x.v === v)?.t.replace(/ \(.*\)$/, '') ?? 'Citat';

export const citati: DefTabele = {
  id: 'citati',
  tabela: 'citati',
  pk: 'id',
  naslov: 'Citati i pouke',
  opis: 'Hadisi, ajeti, mudre riječi i pouke za stranicu Citati i pouke. Najnoviji objavljeni se prikazuje na početnoj. Unosite samo provjerene prevode sa izvorom.',
  novoTekst: 'Novi citat ili pouka',
  select: 'id,tekst,izvor,vrsta,arapski,slika,datum,objavljeno,created_at,updated_at',
  red: [['datum', false], ['created_at', false]],
  polja: [
    { k: 'vrsta', l: 'Vrsta', t: 'select', obavezno: true, pola: true, opcije: VRSTE },
    { k: 'izvor', l: 'Izvor', t: 'text', max: 300, pola: true, placeholder: 'npr. Buhari · El-Bekare, 286 · autor', pomoc: 'Za hadis zbirka (i broj), za ajet sura i ajet, za citat autor.' },
    { k: 'tekst', l: 'Tekst (prevod)', t: 'textarea', obavezno: true, redovi: 5, max: 3000, rastuci: true },
    { k: 'arapski', l: 'Arapski tekst (nije obavezan)', t: 'textarea', redovi: 3, max: 3000, rtl: true },
    { k: 'slika', l: 'Slika (nije obavezna)', t: 'slika', folder: 'citati', pomoc: 'Ilustracija iznad teksta. Smanjuje se automatski (najviše 1600 px, WebP).' },
    { k: 'objavljeno', l: 'Objavljeno na sajtu', t: 'checkbox', pomoc: 'Isključeno = skica, vidljiva samo urednicima.' },
  ],
  novi: () => ({ vrsta: 'citat', objavljeno: true }),
  prijeSnimanja: (p) => ({
    vrsta: VRSTE.some((x) => x.v === p.vrsta) ? p.vrsta : 'citat',
    tekst: String(p.tekst ?? '').trim(),
    izvor: tekstIliNull(p.izvor),
    arapski: tekstIliNull(p.arapski),
    slika: tekstIliNull(p.slika),
    objavljeno: p.objavljeno === true,
  }),
  porukaSacuvano: poruka,
  prikaz: (r) => ({
    naslov: kratko(r.tekst, 110),
    meta: `${r.izvor ? `${r.izvor} · ` : ''}${datumVrijeme(r.datum as string)}`,
    slika: (r.slika as string) || null,
    znacke: [{ t: nazivVrste(r.vrsta), v: 'muted' }, ...(r.objavljeno ? [] : [{ t: 'Skica', v: 'warn' as const }])],
  }),
  pretraga: (r) => `${r.tekst ?? ''} ${r.izvor ?? ''} ${r.arapski ?? ''} ${nazivVrste(r.vrsta)}`,
  filteri: [
    { k: 'vrsta', l: 'Vrsta', opcije: VRSTE },
    { k: 'objavljeno', l: 'Objavljeno', opcije: DA_NE, test: (r, v) => (v === 'da') === (r.objavljeno === true) },
  ],
  slikaPolja: ['slika'],
};
