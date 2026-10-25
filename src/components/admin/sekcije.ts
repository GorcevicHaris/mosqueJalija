// Opisi sekcija admin panela koje koriste generički uređivač (crud.ts).
import { datumTekst } from '../../lib/format';
import { nazivDana } from '../../lib/supabase/tipovi';
import { PoljeGreska, type DefTabele, type Red, type SekcijaCrud } from './crud';
import type { Opcija, Polje } from './polja';
import { sb, type SB } from './sb';
import { otpremiSliku } from './slike';
import { osvjeziListe, stanje, ugradjeno } from './stanje';
import { danas, el, esc, jedinstven, porukaGreske, slugify, slugImama, toast, uToku } from './util';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const jedinstveno = (a: (string | null | undefined)[]) => Array.from(new Set(a.filter((x): x is string => !!x && !!x.trim())));
const uOpcije = (a: string[]): Opcija[] => a.map((x) => ({ v: x, t: x }));
const DA_NE: Opcija[] = [{ v: 'da', t: 'Da' }, { v: 'ne', t: 'Ne' }];

function provjeriSlug(podaci: Red, stari: Red | null, svi: Red[], pk = 'slug', rezervisani: string[] = []): Red {
  const s = String(podaci[pk] ?? '');
  if (!SLUG_RE.test(s)) throw new PoljeGreska(pk, 'Slug smije imati samo mala slova bez kvačica, brojeve i crtice (npr. "halka-hadisa").');
  if (rezervisani.includes(s)) throw new PoljeGreska(pk, `"${s}" je rezervisana riječ — izaberite drugi slug.`);
  if (!stari) {
    const zauzeti = new Set(svi.map((r) => String(r[pk])).concat(rezervisani));
    const novi = jedinstven(s, zauzeti);
    if (novi !== s) {
      podaci[pk] = novi;
      toast(`Slug "${s}" je zauzet — koristim "${novi}".`, 'info', 5000);
    }
  }
  return podaci;
}

// ---------------------------------------------------------------------------------------------
// Obavještenja i objave
// ---------------------------------------------------------------------------------------------
const OBAV_KATEGORIJE = ['Predavanje', 'Halke', 'Mekteb', 'Džuma', 'Ramazan', 'Bajram', 'Akcija', 'Ostalo'];
let obavKategorijeIzBaze: string[] = [];

function pregledObavjestenja(o: Red): string {
  const paragrafi = (Array.isArray(o.sadrzaj) ? (o.sadrzaj as string[]) : []).map((p) => `<p>${esc(p).replace(/\n/g, '<br />')}</p>`).join('');
  const slika = typeof o.slika === 'string' && o.slika ? `<img class="adm-pregled__slika" src="${esc(o.slika)}" alt="" />` : '';
  return `<article class="adm-pregled__clanak">
    <p class="adm-stavka__meta"><time>${esc(o.datum ? datumTekst(String(o.datum)) : '')}</time> <span class="badge">${esc(o.kategorija ?? 'Ostalo')}</span>${o.placeholder ? ' <span class="badge badge--warn">Primjer</span>' : ''}${o.objavljeno ? '' : ' <span class="badge badge--warn">Skica — nije javno</span>'}</p>
    <h4 class="adm-pregled__naslov">${esc(o.naslov ?? '')}</h4>
    <p class="lead">${esc(o.sazetak ?? '')}</p>
    ${slika}
    <div class="prose">${paragrafi || '<p class="muted">(nema teksta)</p>'}</div>
  </article>`;
}

export const obavjestenja: DefTabele = {
  id: 'obavjestenja',
  tabela: 'obavjestenja',
  pk: 'id',
  naslov: 'Obavještenja i objave',
  opis: 'Obavještenja (najave) se prikazuju na stranici Obavještenja i na početnoj; objave (vijesti iz džemata) na stranici Objave. Nova objava se na sajtu vidi odmah.',
  novoTekst: 'Novo obavještenje',
  select: 'id,slug,tip,naslov,datum,kategorija,sazetak,sadrzaj,slika,objavljeno,placeholder,created_at,updated_at',
  red: [['datum', false], ['created_at', false]],
  async ucitaj(k: SB) {
    const { data, error } = await k.from('obavjestenja').select(this.select).order('datum', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;
    obavKategorijeIzBaze = jedinstveno((data ?? []).map((r: Red) => r.kategorija as string));
    return data ?? [];
  },
  polja: () => [
    { k: 'tip', l: 'Vrsta', t: 'select', obavezno: true, pola: true, opcije: [{ v: 'obavjestenje', t: 'Obavještenje (najava)' }, { v: 'objava', t: 'Objava (vijest iz džemata)' }] },
    { k: 'datum', l: 'Datum', t: 'datum', obavezno: true, pola: true },
    { k: 'naslov', l: 'Naslov', t: 'text', obavezno: true, max: 300 },
    { k: 'slug', l: 'Adresa (slug)', t: 'text', obavezno: true, max: 120, zakljucanoPriIzmjeni: true, pomoc: 'Dio adrese stranice: /obavjestenja/<slug>/. Pravi se automatski iz naslova; poslije objave se ne mijenja (da stari linkovi rade).' },
    { k: 'kategorija', l: 'Kategorija', t: 'select', obavezno: true, slobodno: true, max: 60, pola: true, opcije: () => uOpcije(jedinstveno([...OBAV_KATEGORIJE, ...ugradjeno().obavKategorije, ...obavKategorijeIzBaze])) },
    { k: 'sazetak', l: 'Sažetak', t: 'textarea', redovi: 3, obavezno: true, max: 500, pomoc: 'Jedna do dvije rečenice — prikazuje se u listi i pri dijeljenju linka.' },
    { k: 'sadrzaj', l: 'Tekst', t: 'paragrafi', redovi: 10, pomoc: 'Paragrafe odvojite praznim redom. Linkovi (https://…) postaju klikabilni.' },
    { k: 'slika', l: 'Slika (nije obavezna)', t: 'slika', folder: 'obavjestenja' },
    { k: 'objavljeno', l: 'Objavljeno na sajtu', t: 'checkbox', pomoc: 'Isključeno = skica, vidljiva samo urednicima.' },
    { k: 'placeholder', l: 'Primjer sadržaja (nije stvarno obavještenje)', t: 'checkbox', pomoc: 'Označeno dobija bedž "Primjer" i ne pojavljuje se u pretraživačima.' },
  ],
  autoSlug: { izvor: 'naslov', cilj: 'slug', fn: (s) => slugify(s, 80) },
  novi: () => ({ tip: 'obavjestenje', datum: danas(), kategorija: 'Ostalo', objavljeno: true, placeholder: false, sadrzaj: [] }),
  prijeSnimanja(p, stari, svi) {
    p.kategorija = (p.kategorija as string) || 'Ostalo';
    p.sazetak = (p.sazetak as string) ?? '';
    p.sadrzaj = p.sadrzaj ?? [];
    return provjeriSlug(p, stari, svi, 'slug', ['prikaz']);
  },
  prikaz: (r) => ({
    naslov: String(r.naslov ?? ''),
    meta: `${r.datum ? datumTekst(String(r.datum)) : ''} · ${r.kategorija ?? ''}`,
    slika: (r.slika as string) || null,
    znacke: [
      { t: r.tip === 'objava' ? 'Objava' : 'Obavještenje', v: 'muted' },
      ...(!r.objavljeno ? [{ t: 'Skica', v: 'warn' as const }] : []),
      ...(r.placeholder ? [{ t: 'Primjer', v: 'warn' as const }] : []),
    ],
  }),
  pretraga: (r) => `${r.naslov} ${r.sazetak} ${r.kategorija} ${r.slug}`,
  filteri: [
    { k: 'tip', l: 'Vrsta', opcije: [{ v: 'obavjestenje', t: 'Obavještenja' }, { v: 'objava', t: 'Objave' }] },
    { k: 'objavljeno', l: 'Objavljeno', opcije: DA_NE, test: (r, v) => (v === 'da') === (r.objavljeno === true) },
  ],
  pregled: pregledObavjestenja,
  slikaPolja: ['slika'],
};

// ---------------------------------------------------------------------------------------------
// Sedmični raspored
// ---------------------------------------------------------------------------------------------
const DANI_OPCIJE: Opcija[] = [1, 2, 3, 4, 5, 6, 7].map((d) => ({ v: String(d), t: nazivDana(d).replace(/^./, (c) => c.toUpperCase()) }));
const ZA_KOGA: Opcija[] = [{ v: 'svi', t: 'Za sve' }, { v: 'muškarci', t: 'Muškarci' }, { v: 'žene', t: 'Žene' }, { v: 'djeca', t: 'Djeca' }];

export const raspored: DefTabele = {
  id: 'raspored',
  tabela: 'raspored',
  pk: 'id',
  naslov: 'Sedmični raspored',
  opis: 'Redovne aktivnosti (halke, mekteb, kursevi) po danima. Isključite "Aktivno" kad aktivnost privremeno ne radi.',
  novoTekst: 'Novi termin',
  red: [['dan', true], ['redoslijed', true], ['created_at', true]],
  polja: [
    { k: 'dan', l: 'Dan', t: 'select', obavezno: true, pola: true, opcije: DANI_OPCIJE },
    { k: 'vrijeme', l: 'Vrijeme', t: 'text', obavezno: true, max: 60, pola: true, placeholder: 'npr. 17:00 ili nakon akšama' },
    { k: 'naziv', l: 'Naziv', t: 'text', obavezno: true, max: 160 },
    { k: 'opis', l: 'Opis', t: 'textarea', redovi: 3, pomoc: 'Npr. ko predaje, gdje, da li je besplatno.' },
    { k: 'za_koga', l: 'Za koga', t: 'select', obavezno: true, pola: true, opcije: ZA_KOGA },
    { k: 'redoslijed', l: 'Redoslijed u danu', t: 'broj', min: 0, max: 9999, pola: true, pomoc: 'Manji broj = ranije u listi tog dana.' },
    { k: 'aktivno', l: 'Aktivno (prikazuje se na sajtu)', t: 'checkbox' },
  ],
  novi: () => ({ dan: '1', za_koga: 'svi', aktivno: true, redoslijed: 0 }),
  prijeSnimanja: (p) => ({ ...p, dan: Number(p.dan), redoslijed: Number(p.redoslijed ?? 0) || 0 }),
  prikaz: (r) => ({
    naslov: String(r.naziv ?? ''),
    meta: `${nazivDana(Number(r.dan))}, ${r.vrijeme ?? ''}`,
    znacke: [{ t: String(r.za_koga ?? 'svi'), v: 'muted' }, ...(r.aktivno ? [] : [{ t: 'Neaktivno', v: 'warn' as const }])],
  }),
  pretraga: (r) => `${r.naziv} ${r.opis} ${r.vrijeme} ${nazivDana(Number(r.dan))} ${r.za_koga}`,
  filteri: [
    { k: 'dan', l: 'Dan', opcije: DANI_OPCIJE },
    { k: 'za_koga', l: 'Za koga', opcije: ZA_KOGA },
  ],
};

// ---------------------------------------------------------------------------------------------
// Galerija
// ---------------------------------------------------------------------------------------------
export const galerija: DefTabele = {
  id: 'galerija',
  tabela: 'galerija',
  pk: 'id',
  naslov: 'Galerija',
  opis: 'Fotografije džamije. Svaka slika treba kratak opis (alt) za slijepe i slabovide posjetioce.',
  novoTekst: 'Nova slika',
  redoslijed: true,
  red: [['redoslijed', true], ['created_at', true]],
  polja: [
    { k: 'src', l: 'Slika', t: 'slika', obavezno: true, folder: 'galerija' },
    { k: 'alt', l: 'Opis slike (alt)', t: 'text', obavezno: true, max: 300, pomoc: 'Šta se vidi na slici, npr. "Munara džamije u zalazak sunca".' },
    { k: 'opis', l: 'Natpis ispod slike', t: 'textarea', redovi: 2, max: 1000 },
    { k: 'izvor', l: 'Autor / izvor', t: 'text', max: 300, pola: true },
    { k: 'licenca', l: 'Licenca', t: 'text', max: 120, pola: true, placeholder: 'npr. © Džamija na Jaliji' },
  ],
  prijeSnimanja: (p) => ({ ...p, alt: (p.alt as string) ?? '' }),
  prikaz: (r) => ({
    naslov: String(r.alt || '(bez opisa)'),
    meta: String(r.opis ?? ''),
    slika: (r.src as string) || null,
    znacke: r.alt ? [] : [{ t: 'Nedostaje opis', v: 'warn' }],
  }),
  pretraga: (r) => `${r.alt} ${r.opis} ${r.izvor}`,
  slikaPolja: ['src'],
  potvrdaBrisanja: (r) => `Obrisati sliku "${r.alt || 'bez opisa'}"? Fajl se briše i iz skladišta.`,
  alatke(s: SekcijaCrud) {
    const id = 'adm-galerija-vise';
    const ulaz = el('input', { type: 'file', id, multiple: true, accept: 'image/jpeg,image/png,image/webp,image/*', class: 'visually-hidden' }) as HTMLInputElement;
    const lab = el('label', { for: id, class: 'btn btn--ghost btn--sm', text: 'Dodaj više slika…' });
    ulaz.addEventListener('change', async () => {
      const fajlovi = Array.from(ulaz.files ?? []);
      if (!fajlovi.length) return;
      const k = await sb();
      let red = s.redovi.reduce((m, x) => Math.max(m, Number(x.redoslijed) || 0), 0);
      let ok = 0;
      const greske: string[] = [];
      for (const [i, f] of fajlovi.entries()) {
        toast(`Otpremam ${i + 1}/${fajlovi.length}: ${f.name}…`, 'info', 60000);
        try {
          const src = await otpremiSliku(k, f, 'galerija');
          red += 10;
          const { error } = await k.from('galerija').insert({ src, alt: '', redoslijed: red });
          if (error) throw error;
          ok++;
        } catch (e) {
          greske.push(`${f.name}: ${porukaGreske(e)}`);
        }
      }
      ulaz.value = '';
      await s.ucitaj();
      toast(
        `Dodano slika: ${ok}.${greske.length ? ` Nije uspjelo: ${greske.join('; ')}` : ''} Dopunite opis (alt) za svaku novu sliku.`,
        greske.length ? 'greska' : 'uspjeh',
        12000,
      );
    });
    return el('span', { class: 'adm-alatka' }, ulaz, lab);
  },
};

// ---------------------------------------------------------------------------------------------
// Dove, ajeti i hadisi
// ---------------------------------------------------------------------------------------------
let doveKategorijeIzBaze: string[] = [];
export const dove: DefTabele = {
  id: 'dove',
  tabela: 'dove',
  pk: 'id',
  naslov: 'Dove',
  opis: 'Dove sa arapskim tekstom, transliteracijom i prevodom (stranica Dove).',
  novoTekst: 'Nova dova',
  redoslijed: true,
  red: [['redoslijed', true], ['created_at', true]],
  async ucitaj(k: SB) {
    const { data, error } = await k.from('dove').select('*').order('redoslijed').order('created_at');
    if (error) throw error;
    doveKategorijeIzBaze = jedinstveno((data ?? []).map((r: Red) => r.kategorija as string));
    return data ?? [];
  },
  polja: () => [
    { k: 'naslov', l: 'Naslov', t: 'text', obavezno: true, max: 200 },
    { k: 'slug', l: 'Slug', t: 'text', obavezno: true, max: 120, zakljucanoPriIzmjeni: true, pola: true },
    { k: 'kategorija', l: 'Kategorija', t: 'select', obavezno: true, slobodno: true, max: 60, pola: true, opcije: () => uOpcije(jedinstveno([...ugradjeno().doveKategorije, ...doveKategorijeIzBaze, 'Ostalo'])) },
    { k: 'arapski', l: 'Arapski tekst', t: 'textarea', redovi: 3, rtl: true },
    { k: 'transliteracija', l: 'Transliteracija', t: 'textarea', redovi: 3 },
    { k: 'prevod', l: 'Prevod', t: 'textarea', redovi: 4, obavezno: true },
    { k: 'izvor', l: 'Izvor', t: 'text', max: 200, placeholder: 'npr. Muslim, 713 ili El-Bekare, 201', prazanString: true },
  ],
  autoSlug: { izvor: 'naslov', cilj: 'slug' },
  novi: () => ({ kategorija: 'Ostalo' }),
  prijeSnimanja: (p, stari, svi) => provjeriSlug({ ...p, izvor: p.izvor ?? '' }, stari, svi),
  prikaz: (r) => ({ naslov: String(r.naslov ?? ''), meta: `${r.kategorija ?? ''} · ${r.izvor ?? ''}` }),
  pretraga: (r) => `${r.naslov} ${r.kategorija} ${r.prevod} ${r.transliteracija} ${r.izvor}`,
  filteri: [{ k: 'kategorija', l: 'Kategorija', opcije: () => uOpcije(doveKategorijeIzBaze) }],
};

export const ajetiHadisi: DefTabele = {
  id: 'ajeti-hadisi',
  tabela: 'ajeti_hadisi',
  pk: 'id',
  naslov: 'Ajeti i hadisi',
  opis: 'Izbor za "Ajet / hadis dana" i stranicu Kur\'an i hadisi. Unosite samo provjerene prevode sa izvorom.',
  novoTekst: 'Novi ajet ili hadis',
  redoslijed: true,
  red: [['redoslijed', true], ['created_at', true]],
  polja: [
    { k: 'tip', l: 'Vrsta', t: 'select', obavezno: true, pola: true, opcije: [{ v: 'ajet', t: 'Ajet' }, { v: 'hadis', t: 'Hadis' }] },
    { k: 'izvor', l: 'Izvor', t: 'text', obavezno: true, max: 200, pola: true, placeholder: 'npr. El-Bekare, 152 ili Buhari' },
    { k: 'arapski', l: 'Arapski tekst', t: 'textarea', redovi: 3, rtl: true },
    { k: 'tekst', l: 'Prevod', t: 'textarea', redovi: 4, obavezno: true },
  ],
  novi: () => ({ tip: 'ajet' }),
  prikaz: (r) => {
    const t = String(r.tekst ?? '');
    return { naslov: t.length > 110 ? `${t.slice(0, 110)}…` : t, meta: String(r.izvor ?? ''), znacke: [{ t: r.tip === 'hadis' ? 'Hadis' : 'Ajet', v: 'muted' }] };
  },
  pretraga: (r) => `${r.tekst} ${r.izvor}`,
  filteri: [{ k: 'tip', l: 'Vrsta', opcije: [{ v: 'ajet', t: 'Ajeti' }, { v: 'hadis', t: 'Hadisi' }] }],
};

// ---------------------------------------------------------------------------------------------
// Tekstovi stranica
// ---------------------------------------------------------------------------------------------
export const stranice: DefTabele = {
  id: 'stranice',
  tabela: 'stranice_tekstovi',
  pk: 'kljuc',
  naslov: 'Tekstovi stranica',
  opis: 'Uvodni tekstovi stranica (mekteb, donacije, pravila ponašanja, učenje Kur\'ana). Prazan tekst = stranica prikazuje svoj ugrađeni tekst.',
  novoTekst: 'Novi tekst stranice',
  red: [['kljuc', true]],
  polja: () => [
    { k: 'kljuc', l: 'Stranica (ključ)', t: 'select', obavezno: true, slobodno: true, zakljucanoPriIzmjeni: true, max: 60, opcije: ugradjeno().stranice.map((s) => ({ v: s.kljuc, t: `${s.naziv} (${s.kljuc})` })) },
    { k: 'naslov', l: 'Naslov stranice', t: 'text', max: 200, pomoc: 'Veliki naslov na vrhu stranice. Prazno = ugrađeni naslov.' },
    { k: 'sadrzaj', l: 'Uvodni tekst', t: 'textarea', redovi: 12, pomoc: 'Prikazuje se na početku stranice (na Mektebu umjesto ugrađenog teksta o mektebu). Paragrafe odvojite praznim redom; linkovi (https://…) postaju klikabilni. Ostavite prazno da stranica koristi svoj ugrađeni tekst.' },
  ],
  prijeSnimanja: (p, stari, svi) => {
    p.kljuc = slugify(String(p.kljuc ?? ''));
    if (!stari && svi.some((r) => r.kljuc === p.kljuc)) throw new PoljeGreska('kljuc', 'Tekst za ovu stranicu već postoji — uredite postojeći.');
    return provjeriSlug(p, stari, [], 'kljuc');
  },
  prikaz: (r) => ({
    naslov: String(r.naslov || r.kljuc),
    meta: `/${r.kljuc}`,
    znacke: r.sadrzaj ? [] : [{ t: 'Prazno — koristi ugrađeni tekst', v: 'muted' }],
  }),
  pretraga: (r) => `${r.kljuc} ${r.naslov} ${r.sadrzaj}`,
};

// ---------------------------------------------------------------------------------------------
// Kategorije i serije (spojeno sa listama koje pravi YouTube skripta)
// ---------------------------------------------------------------------------------------------
function slugTabela(o: { id: string; tabela: 'kategorije' | 'serije'; naslov: string; opis: string; novoTekst: string; zasticeni?: string[] }): DefTabele {
  return {
    id: o.id,
    tabela: o.tabela,
    pk: 'slug',
    naslov: o.naslov,
    opis: o.opis,
    novoTekst: o.novoTekst,
    redoslijed: true,
    async ucitaj(k: SB) {
      const { data, error } = await k.from(o.tabela).select('*').order('redoslijed').order('slug');
      if (error) throw error;
      const baza: Red[] = data ?? [];
      const uBazi = new Set(baza.map((r) => r.slug));
      const ugr = ugradjeno()[o.tabela].filter((x) => !uBazi.has(x.slug)).map((x) => ({ ...x, samoJson: true, redoslijed: 99999 }));
      return [...baza, ...ugr];
    },
    polja: [
      { k: 'naziv', l: 'Naziv', t: 'text', obavezno: true, max: 160 },
      { k: 'slug', l: 'Slug', t: 'text', obavezno: true, max: 80, zakljucanoPriIzmjeni: true, pomoc: 'Koristi se u adresama i filterima; poslije kreiranja se ne mijenja.' },
      { k: 'opis', l: 'Opis', t: 'textarea', redovi: 3 },
    ],
    autoSlug: { izvor: 'naziv', cilj: 'slug' },
    prijeSnimanja: (p, stari, svi) => {
      // novi zapis (ili prvi upis stavke iz JSON-a) ide na kraj liste
      if (!stari || stari.samoJson) p.redoslijed = svi.filter((r) => !r.samoJson).reduce((m, r) => Math.max(m, Number(r.redoslijed) || 0), 0) + 10;
      return provjeriSlug(p, stari, svi);
    },
    async snimi(k: SB, p: Red) {
      const red: Red = { slug: p.slug, naziv: p.naziv, opis: p.opis ?? null };
      if (p.redoslijed !== undefined) red.redoslijed = p.redoslijed;
      const { error } = await k.from(o.tabela).upsert(red, { onConflict: 'slug' });
      if (error) throw error;
    },
    mozeBrisati: (r) =>
      o.zasticeni?.includes(String(r.slug))
        ? `Kategoriju "${r.naziv}" koristi kod sajta i ne može se obrisati.`
        : r.samoJson
          ? 'Ovu stavku pravi YouTube skripta (data/*.json) — ne može se obrisati iz admina.'
          : null,
    nakonIzmjene: osvjeziListe,
    prikaz: (r) => ({
      naslov: String(r.naziv ?? r.slug),
      meta: String(r.slug),
      znacke: [...(o.zasticeni?.includes(String(r.slug)) ? [{ t: 'Sistemska', v: 'muted' as const }] : []), ...(r.samoJson ? [{ t: 'Iz YouTube podataka', v: 'muted' as const }] : [])],
    }),
    pretraga: (r) => `${r.naziv} ${r.slug} ${r.opis}`,
  };
}

export const kategorije = slugTabela({
  id: 'kategorije',
  tabela: 'kategorije',
  naslov: 'Kategorije predavanja',
  opis: 'Kategorije za filter predavanja. "Hutba" i "Predavanje" su sistemske i ne mogu se obrisati.',
  novoTekst: 'Nova kategorija',
  zasticeni: ['hutba', 'predavanje'],
});

export const serije = slugTabela({
  id: 'serije',
  tabela: 'serije',
  naslov: 'Serije predavanja',
  opis: 'Serije (ciklusi) predavanja. Nove playliste sa YouTube-a se dodaju automatski; ovdje možete urediti naziv i opis.',
  novoTekst: 'Nova serija',
});

// ---------------------------------------------------------------------------------------------
// Imami (osnovni podaci + biografija)
// ---------------------------------------------------------------------------------------------
export const imami: DefTabele = {
  id: 'imami',
  tabela: 'imami',
  pk: 'slug',
  naslov: 'Imami i predavači',
  opis: 'Ime, uloga, biografija i fotografija. Novi predavač se prepoznaje u naslovima YouTube snimaka po imenu i varijantama (aliasi).',
  novoTekst: 'Novi imam / predavač',
  async ucitaj(k: SB) {
    const [im, bio] = await Promise.all([k.from('imami').select('*').order('redoslijed'), k.from('imami_bio').select('*')]);
    if (im.error) throw im.error;
    if (bio.error) throw bio.error;
    const bioMapa = new Map<string, Red>((bio.data ?? []).map((b: Red) => [String(b.slug), b]));
    const ugr = new Map(ugradjeno().imami.map((i) => [i.slug, i]));
    const rez: Red[] = [];
    const vidjeni = new Set<string>();
    for (const r of im.data ?? []) {
      const b = bioMapa.get(r.slug) ?? {};
      const u = ugr.get(r.slug);
      rez.push({ slug: r.slug, puno_ime: r.puno_ime, aliasi: r.aliasi ?? [], uloga: b.uloga ?? u?.uloga ?? null, bio: b.bio ?? u?.bio ?? null, slika: b.slika ?? u?.slika ?? null, potvrdjeno: b.potvrdjeno ?? u?.potvrdjeno ?? false, izvori: b.izvori ?? u?.izvori ?? [], uBazi: true, uJson: !!u });
      vidjeni.add(r.slug);
    }
    for (const u of ugr.values()) {
      if (vidjeni.has(u.slug)) continue;
      const b = bioMapa.get(u.slug) ?? {};
      rez.push({ slug: u.slug, puno_ime: u.punoIme, aliasi: u.aliasi, uloga: b.uloga ?? u.uloga, bio: b.bio ?? u.bio, slika: b.slika ?? u.slika, potvrdjeno: b.potvrdjeno ?? u.potvrdjeno, izvori: b.izvori ?? u.izvori, uBazi: false, uJson: true });
    }
    return rez;
  },
  polja: [
    { k: 'puno_ime', l: 'Puno ime za prikaz', t: 'text', obavezno: true, max: 120, placeholder: 'npr. Hfz. Admir ef. Jašarević' },
    { k: 'slug', l: 'Slug (ime-prezime)', t: 'text', obavezno: true, max: 80, zakljucanoPriIzmjeni: true, pomoc: 'Samo ime i prezime, bez titula: npr. "admir-jasarevic".' },
    { k: 'uloga', l: 'Uloga', t: 'text', max: 160, placeholder: 'npr. Imam džamije, Gost predavač' },
    { k: 'bio', l: 'Biografija', t: 'textarea', redovi: 7, pomoc: 'Samo provjereni podaci. Paragrafe odvojite praznim redom.' },
    { k: 'slika', l: 'Fotografija', t: 'slika', folder: 'imami' },
    { k: 'potvrdjeno', l: 'Podaci su provjereni', t: 'checkbox' },
    { k: 'aliasi', l: 'Varijante imena u naslovima (aliasi)', t: 'lista', redovi: 4, pomoc: 'Jedna varijanta po redu, kako se ime piše u naslovima na YouTube-u (npr. "Hfz Admir Jašarević").' },
    { k: 'izvori', l: 'Izvori', t: 'niz', dodajTekst: '+ Dodaj izvor', podPolja: [{ k: 'naziv', l: 'Naziv izvora', t: 'text', max: 300 }, { k: 'url', l: 'Adresa (URL)', t: 'url', max: 600 }] },
  ],
  autoSlug: { izvor: 'puno_ime', cilj: 'slug', fn: slugImama },
  novi: () => ({ potvrdjeno: false, aliasi: [], izvori: [] }),
  prijeSnimanja: (p, stari, svi) => {
    if (!stari && svi.some((r) => r.slug === p.slug)) throw new PoljeGreska('slug', 'Imam sa ovim slugom već postoji.');
    return provjeriSlug(p, stari, []);
  },
  async snimi(k: SB, p: Red) {
    const i = await k.from('imami').upsert({ slug: p.slug, puno_ime: p.puno_ime, aliasi: p.aliasi ?? [] }, { onConflict: 'slug' });
    if (i.error) throw i.error;
    const b = await k.from('imami_bio').upsert(
      { slug: p.slug, uloga: p.uloga ?? null, bio: p.bio ?? null, slika: p.slika ?? null, potvrdjeno: p.potvrdjeno === true, izvori: (p.izvori as unknown[]) ?? [] },
      { onConflict: 'slug' },
    );
    if (b.error) throw b.error;
  },
  async obrisi(k: SB, r: Red) {
    const b = await k.from('imami_bio').delete().eq('slug', r.slug);
    if (b.error) throw b.error;
    const i = await k.from('imami').delete().eq('slug', r.slug);
    if (i.error) throw i.error;
  },
  potvrdaBrisanja: (r) =>
    r.uJson
      ? `Obrisati izmjene za "${r.puno_ime}"? Ovaj imam postoji i u YouTube podacima, pa ostaje na sajtu sa osnovnim podacima.`
      : `Obrisati imama "${r.puno_ime}"? Ovo se ne može poništiti.`,
  nakonIzmjene: osvjeziListe,
  slikaPolja: ['slika'],
  prikaz: (r) => ({
    naslov: String(r.puno_ime ?? r.slug),
    meta: `${r.uloga ?? 'Uloga nije unesena'} · ${r.slug}`,
    slika: (r.slika as string) || null,
    znacke: [...(r.potvrdjeno ? [] : [{ t: 'Nepotvrđeno', v: 'warn' as const }]), ...(r.uBazi ? [] : [{ t: 'Samo YouTube podaci', v: 'muted' as const }])],
  }),
  pretraga: (r) => `${r.puno_ime} ${r.slug} ${r.uloga} ${(r.aliasi as string[] | undefined)?.join(' ')}`,
};

// ---------------------------------------------------------------------------------------------
// Urednici (samo admin)
// ---------------------------------------------------------------------------------------------
export const urednici: DefTabele = {
  id: 'urednici',
  tabela: 'urednici',
  pk: 'email',
  naslov: 'Urednici',
  opis: 'Ko smije uređivati sajt. Urednik mijenja sadržaj; administrator još i dodaje/uklanja urednike. Prijava je preko linka ili koda koji stiže na ovu e-mail adresu.',
  novoTekst: 'Novi urednik',
  red: [['uloga', true], ['email', true]],
  polja: [
    { k: 'email', l: 'E-mail adresa', t: 'email', obavezno: true, max: 254, zakljucanoPriIzmjeni: true },
    { k: 'uloga', l: 'Uloga', t: 'select', obavezno: true, opcije: [{ v: 'urednik', t: 'Urednik (sadržaj)' }, { v: 'admin', t: 'Administrator (sadržaj + urednici)' }] },
  ],
  novi: () => ({ uloga: 'urednik' }),
  prijeSnimanja: (p, stari, svi) => {
    p.email = String(p.email ?? '').trim().toLowerCase();
    if (!stari && svi.some((r) => r.email === p.email)) throw new PoljeGreska('email', 'Ova adresa je već na listi.');
    if (stari && stari.email === stanje.email && p.uloga !== 'admin') throw new PoljeGreska('uloga', 'Ne možete sami sebi oduzeti administratorska prava.');
    return p;
  },
  mozeBrisati: (r) => (r.email === stanje.email ? 'Ne možete ukloniti sami sebe.' : null),
  potvrdaBrisanja: (r) => `Ukloniti urednika ${r.email}? Više neće moći mijenjati sadržaj.`,
  porukaSacuvano: 'Sačuvano. Urednik se prijavljuje na ovoj stranici svojom e-mail adresom.',
  prikaz: (r) => ({
    naslov: String(r.email),
    meta: r.created_at ? `dodan ${datumTekst(String(r.created_at).slice(0, 10))}` : '',
    znacke: [{ t: r.uloga === 'admin' ? 'Administrator' : 'Urednik', v: r.uloga === 'admin' ? 'primary' : 'muted' }, ...(r.email === stanje.email ? [{ t: 'Vi', v: 'muted' as const }] : [])],
  }),
};

export const SVE_CRUD: DefTabele[] = [obavjestenja, raspored, galerija, dove, ajetiHadisi, stranice, imami, kategorije, serije, urednici];

export { uToku };
export type { Polje };
