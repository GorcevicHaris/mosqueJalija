// Indeks za pretragu sajta — pravi se pri buildu i ugrađuje u /pretraga kao JSON.
// Kompaktan oblik (nizovi umjesto objekata, nazivi imama/kategorija/serija kao indeksi u tabelama)
// da bi JSON ostao mali i sa hiljadama predavanja.
import { dove, imami, kategorije, obavjestenja, predavanja, serije } from '../data';
import { glavniMeni, isGroup, type NavLink } from '../../components/layout/nav';
import { postoji } from './stranice';

/** Predavanje: [id, naslov, datum, imamIdx|-1, kategorijaIdx|-1, serijaIdx|-1, serijaDio|0] */
export type PIndeks = [string, string, string, number, number, number, number];
/** Obavještenje/objava: [slug, naslov, datum, kategorija, sažetak, tip 'o'|'b'] */
export type OIndeks = [string, string, string, string, string, 'o' | 'b'];
/** Dova: [slug, naslov, kategorija, izvor, prevod (skraćen)] */
export type DIndeks = [string, string, string, string, string];
/** Imam: [slug, punoIme, aliasi (spojeni), uloga, brojPredavanja] */
export type MIndeks = [string, string, string, string, number];
/** Stranica: [putanja, naslov, opis, ključne riječi] */
export type SIndeks = [string, string, string, string];

export interface PretragaIndeks {
  /** Nazivi imama, kategorija, serija (tabele za predavanja) */
  im: string[];
  ka: string[];
  se: string[];
  p: PIndeks[];
  o: OIndeks[];
  d: DIndeks[];
  m: MIndeks[];
  s: SIndeks[];
  /** Putanja do detalja objave: '/objave/' ili '/obavjestenja/' */
  ob: string;
}

// Dodatne ključne riječi (sinonimi) za statičke stranice — pomažu kad korisnik ne zna tačan naziv.
const KLJUCNE: Record<string, string> = {
  '/': 'pocetna naslovna dzamija jalija',
  '/o-dzamiji': 'historija istorija historijat cinjenice lokacija adresa gradnja',
  '/galerija': 'slike fotografije foto',
  '/pravila-ponasanja': 'adab bonton ponasanje pravila odijevanje',
  '/predavanja': 'video youtube vaz vazovi tefsir hadis',
  '/hutbe': 'hutba dzuma petak',
  '/imami': 'imam hatib predavaci efendija hafiz',
  '/vaktija': 'namaz namaska vremena sabah izlazak sunca podne ikindija aksam jacija takvim',
  '/obavjestenja': 'vijesti najave obavijesti',
  '/objave': 'vijesti zapisi',
  '/dove': 'dua dova zikr',
  '/kuran-hadisi': 'kuran ajet hadis dana',
  '/ucenje-kurana': 'tedzvid hifz ucenje kurana sufara',
  '/mekteb': 'mekteb halka halke djeca vjeronauka upis',
  '/upis': 'upis prijava prijavnica mekteb halka skola kurana sufara hifz online',
  '/raspored': 'raspored termini sedmica dani halke mekteb kursevi kada',
  '/pitaj-imama': 'pitanje pitanja odgovor fetva imam savjet',
  '/mediji': 'youtube facebook instagram drustvene mreze kanal',
  '/kontakt': 'kontakt adresa telefon email mapa lokacija poruka',
  '/donacije': 'doniraj donacija uplata racun sadaka vakuf pomoc iban',
  '/kalendar': 'takvim hidzretski islamski kalendar ramazan bajram mevlud kadr lejle asura nova godina',
};

const DODATNE: NavLink[] = [
  { label: 'Donacije', href: '/donacije', opis: 'Podrška radu i održavanju džamije' },
  { label: 'Islamski kalendar', href: '/kalendar', opis: 'Hidžretski datumi, Ramazan, bajrami i mubarek noći' },
];

function stranice(): SIndeks[] {
  const linkovi: NavLink[] = [];
  for (const item of glavniMeni) {
    if (isGroup(item)) linkovi.push(...item.children);
    else linkovi.push(item);
  }
  linkovi.push(...DODATNE);
  const vidjeno = new Set<string>();
  const out: SIndeks[] = [];
  for (const l of linkovi) {
    if (vidjeno.has(l.href) || !postoji(l.href)) continue;
    vidjeno.add(l.href);
    out.push([l.href, l.label, l.opis ?? '', KLJUCNE[l.href] ?? '']);
  }
  return out;
}

const skrati = (s: string | null | undefined, max: number) => {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > max ? t.slice(0, max).replace(/\s+\S*$/, '') + '…' : t;
};

export function napraviIndeks(): PretragaIndeks {
  const imIdx = new Map(imami.map((i, n) => [i.slug, n]));
  const kaIdx = new Map(kategorije.map((k, n) => [k.slug, n]));
  const seIdx = new Map(serije.map((s, n) => [s.slug, n]));

  const imajuObjaveDetalj = postoji('/objave/[slug]');

  return {
    im: imami.map((i) => i.punoIme),
    ka: kategorije.map((k) => k.naziv),
    se: serije.map((s) => s.naziv),
    p: predavanja.map((p) => [
      p.id,
      p.naslovCist || p.naslov,
      p.datum,
      p.imam ? imIdx.get(p.imam) ?? -1 : -1,
      kaIdx.get(p.kategorija) ?? -1,
      p.serija ? seIdx.get(p.serija) ?? -1 : -1,
      p.serijaDio ?? 0,
    ]),
    o: obavjestenja.map((o) => [
      o.slug,
      o.naslov,
      o.datum,
      o.kategorija,
      skrati(o.sazetak, 180),
      o.tip === 'objava' ? 'b' : 'o',
    ]),
    d: dove.map((d) => [d.slug, d.naslov, d.kategorija, d.izvor, skrati(d.prevod, 160)]),
    m: imami.map((i) => [i.slug, i.punoIme, i.aliasi.join(' '), i.uloga ?? '', i.brojPredavanja]),
    s: stranice(),
    ob: imajuObjaveDetalj ? '/objave/' : '/obavjestenja/',
  };
}

/** JSON bezbjedan za <script type="application/json"> (bez "</script>" u sadržaju). */
export function indeksJson(): string {
  return JSON.stringify(napraviIndeks())
    .replace(/</g, '\\u003c');
}
