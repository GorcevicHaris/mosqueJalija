// Struktura glavne navigacije (vlasnik: dizajner). Putanje su BEZ base-a; prolaze kroz url() pri renderu.
export interface NavLink { label: string; href: string; opis?: string }
export interface NavGroup { label: string; children: NavLink[] }
export type NavItem = NavLink | NavGroup;

export const glavniMeni: NavItem[] = [
  { label: 'Početna', href: '/' },
  {
    label: 'O džamiji',
    children: [
      { label: 'Historija', href: '/o-dzamiji', opis: 'Historija, činjenice i lokacija' },
      { label: 'Galerija', href: '/galerija', opis: 'Fotografije džamije i džemata' },
      { label: 'Pravila ponašanja', href: '/pravila-ponasanja', opis: 'Adab u džamiji' },
    ],
  },
  {
    label: 'Predavanja',
    children: [
      { label: 'Sva predavanja', href: '/predavanja', opis: 'Video predavanja sa YouTube kanala' },
      { label: 'Hutbe', href: '/hutbe', opis: 'Džuma-hutbe' },
      { label: 'Imami', href: '/imami', opis: 'Imami i predavači' },
    ],
  },
  { label: 'Vaktija', href: '/vaktija' },
  {
    label: 'Obavještenja',
    children: [
      { label: 'Obavještenja', href: '/obavjestenja', opis: 'Najave i vijesti džemata' },
      { label: 'Objave', href: '/objave', opis: 'Zapisi i fotografije iz džemata' },
    ],
  },
  {
    label: 'Korisno',
    children: [
      { label: 'Dove', href: '/dove', opis: 'Dove sa arapskim tekstom i prevodom' },
      { label: "Kur'an i hadisi", href: '/kuran-hadisi', opis: 'Ajet i hadis dana' },
      { label: "Učenje Kur'ana", href: '/ucenje-kurana', opis: 'Izvori za učenje i tedžvid' },
      { label: 'Mekteb i halke', href: '/mekteb', opis: 'Vjerska pouka za djecu i odrasle' },
      { label: 'Mediji', href: '/mediji', opis: 'YouTube kanal i društvene mreže' },
      { label: 'Islamski kalendar', href: '/kalendar', opis: 'Hidžretski datumi i važni dani' },
    ],
  },
  { label: 'Kontakt', href: '/kontakt' },
];

export const isGroup = (i: NavItem): i is NavGroup => 'children' in i;

/** Normalizovana putanja bez base-a i bez završne kose crte ("/predavanja"). */
export function stripBase(pathname: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let p = pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
  p = p.replace(/\/index\.html$/, '').replace(/\/$/, '');
  return p || '/';
}

export function isActive(href: string, current: string): boolean {
  if (href === '/') return current === '/';
  return current === href || current.startsWith(href + '/');
}
