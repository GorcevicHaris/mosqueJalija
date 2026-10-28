// SAMO ZA RAZVOJ (QA): lažni supabase-js klijent za admin panel — prijavljen urednik + baza u memoriji.
// Uključuje se jedino u `astro dev` adresom /admin/?qa-mock (ili ?qa-mock=urednik za ulogu urednika);
// sb.ts ga uvozi samo unutar `if (import.meta.env.DEV …)`, pa ga produkcijski build ne sadrži.
// Ništa se ne šalje u pravu bazu: javne tabele se jednom pročitaju anonimno (GET, kao posjetilac),
// privatne (urednici, poruke, prijave, pitanja) dobijaju izmišljene redove. Upis/izmjena/brisanje
// i otpremanje slika ostaju u memoriji pregledača (nestaju osvježavanjem stranice).
// Greške za testiranje: ?qa-greska=upis | citanje | mreza | slika | prava (ili padajući meni u uglu).
import { restUrl, zaglavlja } from '../../lib/supabase/config';

type Red = Record<string, unknown>;
type Greska = { message: string; code?: string; status?: number };
type Odg = { data: unknown; error: Greska | null; count?: number | null };

const JAVNE = [
  'obavjestenja', 'galerija', 'imami', 'imami_bio', 'kategorije', 'serije', 'dove', 'ajeti_hadisi', 'raspored',
  'stranice_tekstovi', 'postavke', 'predavanja_ispravke', 'programi', 'kartice_stranica', 'transkript_ispravke',
  'predavanja_rucna', 'aktivnosti', 'citati',
];

/** Primarni ključ (za upsert bez onConflict). */
const PK: Record<string, string[]> = {
  imami: ['slug'], imami_bio: ['slug'], kategorije: ['slug'], serije: ['slug'], stranice_tekstovi: ['kljuc'],
  postavke: ['kljuc'], predavanja_ispravke: ['video_id'], programi: ['slug'], urednici: ['email'],
  transkript_ispravke: ['video_id', 'jezik', 'segment'],
};

const sad = () => new Date().toISOString();
const prije = (dana: number, sati = 0) => new Date(Date.now() - dana * 864e5 - sati * 36e5).toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `qa-${Math.random().toString(36).slice(2)}`);
const cekaj = (ms: number) => new Promise((r) => setTimeout(r, ms));

function izmisljeni(email: string): Record<string, Red[]> {
  return {
    urednici: [
      { email, uloga: 'admin', dodao: null, created_at: prije(40) },
      { email: 'sekretar@primjer.test', uloga: 'urednik', dodao: email, created_at: prije(12) },
    ],
    poruke: [
      { id: uuid(), ime: 'Amra H.', email: 'amra@primjer.test', tema: 'Mekteb', poruka: 'Selam alejkum, kada počinje mekteb za djecu od 7 godina?', procitano: false, created_at: prije(0, 3) },
      { id: uuid(), ime: 'Emir', email: 'emir@primjer.test', tema: 'Opšte', poruka: 'Hvala na predavanjima — da li će biti snimak sa posljednje halke?\n\nPozdrav', procitano: true, created_at: prije(3) },
    ],
    prijave: [
      { id: uuid(), ime_prezime: 'Hana Hodžić', roditelj: 'Senad Hodžić', telefon: '+381 63 123 456', email: null, program: 'Mekteb — početni nivo', uzrast: 8, napomena: 'Može samo subotom.', status: 'nova', biljeska: null, created_at: prije(1), updated_at: prije(1) },
      { id: uuid(), ime_prezime: 'Adnan Mujić', roditelj: null, telefon: '064 555 0101', email: 'adnan@primjer.test', program: 'Učenje Kur\'ana za odrasle', uzrast: 34, napomena: null, status: 'kontaktiran', biljeska: 'Pozvan 12. 10.', created_at: prije(9), updated_at: prije(8) },
    ],
    pitanja: [
      { id: uuid(), ime: null, email: null, javno: true, skriveno: false, pitanje: 'Da li se abdest kvari ako se zaspi sjedeći u džamiji dok se čeka namaz?', odgovor: null, odgovorio: null, odgovoreno_at: null, objavljeno: false, created_at: prije(0, 5), updated_at: prije(0, 5) },
      { id: uuid(), ime: 'Selma', email: null, javno: true, skriveno: false, pitanje: 'Koliko iznosi sadekatul-fitr ove godine i kome se može dati?', odgovor: 'Iznos za ovu godinu objavljuje Mešihat; sadaka se daje siromašnima u džematu prije bajram-namaza.', odgovorio: 'Hfz. Admir ef. Jašarević', odgovoreno_at: prije(2), objavljeno: false, created_at: prije(4), updated_at: prije(2) },
      { id: uuid(), ime: 'Mirza Kurtović', email: 'mirza@primjer.test', javno: false, skriveno: false, pitanje: 'Imam porodično pitanje u vezi nasljedstva — da li mogu doći lično poslije džume?', odgovor: null, odgovorio: null, odgovoreno_at: null, objavljeno: false, created_at: prije(1, 2), updated_at: prije(1, 2) },
      { id: uuid(), ime: 'Lejla', email: 'lejla@primjer.test', javno: false, skriveno: false, pitanje: 'Da li žena smije postiti nafilu bez pitanja muža?', odgovor: 'Za dobrovoljni post preporučuje se saglasnost supruga ako je kod kuće.', odgovorio: 'Hfz. Admir ef. Jašarević', odgovoreno_at: prije(6), objavljeno: true, created_at: prije(8), updated_at: prije(6) },
      { id: uuid(), ime: null, email: null, javno: true, skriveno: true, pitanje: 'Reklama: najbolji kursevi… (spam koji je urednik sakrio)', odgovor: null, odgovorio: null, odgovoreno_at: null, objavljeno: false, created_at: prije(2), updated_at: prije(2) },
    ],
  };
}

/** Podrazumijevane vrijednosti kolona (kao DEFAULT u migracijama). */
function podrazumijevano(tabela: string, r: Red): Red {
  const d: Red = { created_at: sad(), updated_at: sad() };
  if (!PK[tabela]) d.id = uuid();
  if (['aktivnosti', 'citati'].includes(tabela)) d.datum = sad();
  if (tabela === 'obavjestenja') Object.assign(d, { objavljeno: true, placeholder: false, sadrzaj: [] });
  if (tabela === 'pitanja') Object.assign(d, { javno: false, skriveno: false, objavljeno: false, odgovor: null });
  return { ...d, ...r };
}

/** Provjere iz baze koje panel treba da prikaže kao grešku (CHECK ograničenja). */
function provjera(tabela: string, r: Red): Greska | null {
  const chk = (poruka: string): Greska => ({ code: '23514', message: `new row for relation "${tabela}" violates check constraint (${poruka})` });
  if (tabela === 'aktivnosti' && !(String(r.tekst ?? '').trim() || (Array.isArray(r.slike) && r.slike.length))) return chk('tekst ili slike');
  if (tabela === 'pitanja' && !r.javno && String(r.ime ?? '').trim().length < 2) return chk('privatno pitanje traži ime');
  if (tabela === 'galerija' && !r.src) return { code: '23502', message: 'null value in column "src"' };
  return null;
}

function okidaci(tabela: string, r: Red, staro: Red | null) {
  r.updated_at = sad();
  if (tabela === 'pitanja') {
    r.ime_javno = r.javno && typeof r.ime === 'string' && r.ime.trim() ? r.ime.trim() : null; // generisana kolona (0007)
    const odg = typeof r.odgovor === 'string' && r.odgovor.trim() ? r.odgovor : null;
    if (!odg) Object.assign(r, { odgovor: null, odgovoreno_at: null, objavljeno: false });
    else if (!r.odgovoreno_at || staro?.odgovor !== r.odgovor) r.odgovoreno_at = r.odgovoreno_at ?? sad();
  }
}

class Upit implements PromiseLike<Odg> {
  private filteri: ((r: Red) => boolean)[] = [];
  private redanje: [string, boolean][] = [];
  private granica: number | null = null;
  private jedan: 'tacno' | 'mozda' | null = null;
  private radnja: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private teret: Red | Red[] | null = null;
  private opcije: { onConflict?: string; ignoreDuplicates?: boolean; count?: string; head?: boolean } = {};

  constructor(private baza: Mock, private tabela: string) {}

  // kolone se ne filtriraju (vraća se cijeli red, kao select=*)
  select(_kolone = '*', o: { count?: string; head?: boolean } = {}) {
    this.opcije = { ...this.opcije, ...o };
    return this;
  }
  insert(r: Red | Red[]) { this.radnja = 'insert'; this.teret = r; return this; }
  update(r: Red) { this.radnja = 'update'; this.teret = r; return this; }
  upsert(r: Red | Red[], o: { onConflict?: string; ignoreDuplicates?: boolean } = {}) { this.radnja = 'upsert'; this.teret = r; this.opcije = { ...this.opcije, ...o }; return this; }
  delete() { this.radnja = 'delete'; return this; }
  eq(k: string, v: unknown) { this.filteri.push((r) => String(r[k]) === String(v)); return this; }
  neq(k: string, v: unknown) { this.filteri.push((r) => String(r[k]) !== String(v)); return this; }
  is(k: string, v: unknown) { this.filteri.push((r) => (v === null ? r[k] === null || r[k] === undefined : r[k] === v)); return this; }
  not(k: string, op: string, v: unknown) {
    if (op === 'is' && v === null) this.filteri.push((r) => r[k] !== null && r[k] !== undefined);
    else this.filteri.push((r) => String(r[k]) !== String(v));
    return this;
  }
  in(k: string, v: unknown[]) { const s = new Set(v.map(String)); this.filteri.push((r) => s.has(String(r[k]))); return this; }
  order(k: string, o: { ascending?: boolean } = {}) { this.redanje.push([k, o.ascending !== false]); return this; }
  limit(n: number) { this.granica = n; return this; }
  maybeSingle() { this.jedan = 'mozda'; return this; }
  single() { this.jedan = 'tacno'; return this; }

  then<A = Odg, B = never>(ok?: ((v: Odg) => A | PromiseLike<A>) | null, ne?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return this.izvrsi().then(ok, ne);
  }

  private async izvrsi(): Promise<Odg> {
    await cekaj(120 + Math.random() * 180);
    const g = this.baza.greska;
    if (g === 'mreza') return { data: null, error: { message: 'TypeError: Failed to fetch' } };
    if (this.radnja !== 'select' && g === 'upis') return { data: null, error: { code: '42501', message: 'new row violates row-level security policy for table "' + this.tabela + '"' } };
    if (g === 'prava') return { data: null, error: { message: 'JWT expired', status: 401 } };
    if (this.radnja === 'select' && g === 'citanje') return { data: null, error: { code: '500', message: 'Server greška (QA mock)' } };
    const t = this.baza.tabela(this.tabela);
    const odgovara = (r: Red) => this.filteri.every((f) => f(r));

    if (this.radnja === 'select') {
      let rez = t.filter(odgovara);
      for (const [k, asc] of [...this.redanje].reverse()) {
        rez = rez.slice().sort((a, b) => {
          const x = a[k] ?? null, y = b[k] ?? null;
          if (x === y) return 0;
          if (x === null) return 1;
          if (y === null) return -1;
          return (x < y ? -1 : 1) * (asc ? 1 : -1);
        });
      }
      if (this.granica !== null) rez = rez.slice(0, this.granica);
      const kopija = rez.map((r) => structuredClone(r));
      const count = this.opcije.count ? rez.length : null;
      if (this.opcije.head) return { data: null, error: null, count };
      if (this.jedan) {
        if (kopija.length > 1 || (this.jedan === 'tacno' && !kopija.length)) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
        return { data: kopija[0] ?? null, error: null };
      }
      return { data: kopija, error: null, count };
    }

    if (this.radnja === 'delete') {
      const ostaju = t.filter((r) => !odgovara(r));
      this.baza.dnevnik(`DELETE ${this.tabela}: ${t.length - ostaju.length}`);
      t.splice(0, t.length, ...ostaju);
      return { data: null, error: null };
    }

    if (this.radnja === 'update') {
      const nadjeni = t.filter(odgovara);
      for (const r of nadjeni) {
        const staro = { ...r };
        const novo = { ...r, ...structuredClone(this.teret as Red) };
        okidaci(this.tabela, novo, staro);
        const gr = provjera(this.tabela, novo);
        if (gr) return { data: null, error: gr };
        Object.assign(r, novo);
      }
      this.baza.dnevnik(`UPDATE ${this.tabela}: ${nadjeni.length}`);
      return { data: null, error: null };
    }

    const redovi = (Array.isArray(this.teret) ? this.teret : [this.teret as Red]).map((r) => structuredClone(r));
    const kljuc = this.opcije.onConflict?.split(',').map((x) => x.trim()) ?? PK[this.tabela] ?? ['id'];
    for (const r of redovi) {
      const postojeci = this.radnja === 'upsert' ? t.find((x) => kljuc.every((k) => String(x[k]) === String(r[k]))) : undefined;
      if (postojeci) {
        if (this.opcije.ignoreDuplicates) continue;
        const novo = { ...postojeci, ...r };
        okidaci(this.tabela, novo, postojeci);
        const gr = provjera(this.tabela, novo);
        if (gr) return { data: null, error: gr };
        Object.assign(postojeci, novo);
      } else {
        const novo = podrazumijevano(this.tabela, r);
        if (kljuc.length === 1 && kljuc[0] !== 'id' && t.some((x) => String(x[kljuc[0]]) === String(novo[kljuc[0]])))
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint' } };
        if (['obavjestenja', 'dove'].includes(this.tabela) && t.some((x) => x.slug === novo.slug))
          return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "slug"' } };
        okidaci(this.tabela, novo, null);
        const gr = provjera(this.tabela, novo);
        if (gr) return { data: null, error: gr };
        t.push(novo);
      }
    }
    this.baza.dnevnik(`${this.radnja.toUpperCase()} ${this.tabela}: ${redovi.length}`);
    return { data: null, error: null };
  }
}

class Mock {
  greska = new URLSearchParams(location.search).get('qa-greska') ?? '';
  private podaci = new Map<string, Red[]>();
  private fajlovi = new Map<string, string>();
  log: string[] = [];

  constructor(readonly email: string, readonly uloga: 'admin' | 'urednik') {}

  tabela(t: string): Red[] {
    if (!this.podaci.has(t)) this.podaci.set(t, []);
    return this.podaci.get(t)!;
  }

  dnevnik(s: string) {
    this.log.push(`${new Date().toLocaleTimeString()} ${s}`);
    console.info('[qa-mock]', s);
  }

  async napuni() {
    const lazni = izmisljeni(this.email);
    if (this.uloga === 'urednik') lazni.urednici[0].uloga = 'urednik';
    for (const [t, r] of Object.entries(lazni)) this.podaci.set(t, r);
    // javni sadržaj: jedno anonimno čitanje (GET) — isto što vidi svaki posjetilac
    await Promise.all(
      JAVNE.map(async (t) => {
        try {
          const res = await fetch(restUrl(`${t}?select=*&limit=1000`), { headers: zaglavlja() });
          this.podaci.set(t, res.ok ? ((await res.json()) as Red[]) : []);
        } catch {
          this.podaci.set(t, []);
        }
      }),
    );
  }

  from(t: string) {
    return new Upit(this, t);
  }

  readonly auth = {
    getSession: async () => ({ data: { session: { user: { email: this.email } } }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({ error: null }),
    signInWithOtp: async () => ({ error: null }),
    verifyOtp: async () => ({ data: { session: { user: { email: this.email } } }, error: null }),
  };

  readonly storage = {
    from: (_bucket: string) => ({
      upload: async (putanja: string, blob: Blob) => {
        await cekaj(300);
        if (this.greska === 'slika') return { data: null, error: { statusCode: '413', message: 'The object exceeded the maximum allowed size' } };
        this.fajlovi.set(putanja, URL.createObjectURL(blob));
        this.dnevnik(`UPLOAD ${putanja} (${Math.round(blob.size / 1024)} KB, ${blob.type})`);
        return { data: { path: putanja }, error: null };
      },
      getPublicUrl: (putanja: string) => ({ data: { publicUrl: this.fajlovi.get(putanja) ?? putanja } }),
      remove: async (putanje: string[]) => {
        putanje.forEach((p) => this.dnevnik(`REMOVE ${p}`));
        return { data: null, error: null };
      },
    }),
  };
}

function oznaka(m: Mock) {
  const d = document.createElement('div');
  d.setAttribute('style', 'position:fixed;z-index:200;right:8px;bottom:8px;opacity:.92;display:flex;gap:6px;align-items:center;padding:4px 8px;border-radius:8px;background:#b4231a;color:#fff;font:700 12px/1.2 system-ui;box-shadow:0 2px 8px rgb(0 0 0/.3)');
  d.innerHTML = '<span>QA mock</span>';
  const s = document.createElement('select');
  s.setAttribute('aria-label', 'QA: simulirana greška');
  s.setAttribute('style', 'font:12px system-ui;max-width:110px');
  for (const [v, t] of [['', 'bez greške'], ['upis', 'upis: RLS'], ['citanje', 'čitanje: 500'], ['mreza', 'bez mreže'], ['slika', 'slika: 413'], ['prava', 'sesija istekla']]) s.append(new Option(t, v));
  s.value = m.greska;
  s.addEventListener('change', () => (m.greska = s.value));
  d.append(s);
  document.body.append(d);
}

export async function napraviMock(uloga: 'admin' | 'urednik'): Promise<Mock> {
  const m = new Mock('qa-urednik@primjer.test', uloga);
  await m.napuni();
  (window as unknown as { qaMock: Mock }).qaMock = m;
  oznaka(m);
  console.warn('[qa-mock] Admin radi nad LAŽNOM bazom u memoriji (samo astro dev). Ništa se ne upisuje u Supabase.');
  return m;
}
