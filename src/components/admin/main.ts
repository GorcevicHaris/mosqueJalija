// Admin panel: prijava (magic link / kod iz e-maila), provjera uredničkih prava, navigacija.
import { supabaseUkljucen } from '../../lib/supabase/config';
import * as aktivnostiDef from './aktivnosti';
import { SekcijaCrud } from './crud';
import { SekcijaDzamija } from './dzamija';
import { brojNovih, SekcijaPitanja, SekcijaPoruke, SekcijaPrijave } from './inbox';
import { SekcijaIspravke } from './ispravke';
import { SekcijaPredavanja } from './predavanja';
import { SekcijaTraka } from './traka';
import { SekcijaTranskripti } from './transkripti';
import { SVI_ODJELJCI } from './odjeljci';
import { pratiIstoriju, zapamtiOdjeljak } from './istorija';
import { adminUrl, sb, type SB } from './sb';
import * as def from './sekcije';
import { osvjeziListe, stanje } from './stanje';
import { porukaGreske, poruka, toast, uToku } from './util';

interface Sekcija {
  aktiviraj(): Promise<void>;
  /** CRUD: otvori formu za novi unos */
  otvoriNovo?(): void;
  /** Ispravke: otvori formu za predavanje */
  otvoriZa?(id: string): Promise<void>;
}

const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const KLJUC_EMAIL = 'dzamija-admin-email';

function pokazi(ekran: string) {
  document.querySelectorAll<HTMLElement>('[data-ekran]').forEach((e) => (e.hidden = e.dataset.ekran !== ekran));
  const cilj = $(`[data-ekran="${ekran}"] [data-fokus]`);
  if (ekran !== 'app') cilj?.focus();
}

function greskaEkran(tekst: string) {
  const p = $('[data-greska-tekst]');
  if (p) p.textContent = tekst;
  pokazi('greska');
}

// ---------------------------------------------------------------------------------------------
// Prijava
// ---------------------------------------------------------------------------------------------
let klijent: SB;
let prijavljenKao: string | null = null;

function korakPrijave(korak: 1 | 2, email?: string) {
  const f1 = $('[data-prijava-korak="1"]')!;
  const f2 = $('[data-prijava-korak="2"]')!;
  f1.hidden = korak !== 1;
  f2.hidden = korak !== 2;
  if (korak === 2) {
    $('[data-prijava-adresa]')!.textContent = email ?? '';
    $<HTMLInputElement>('#adm-kod')?.focus();
  } else $<HTMLInputElement>('#adm-email')?.focus();
}

function pokaziPrijavu(porukaTekst?: string, vrsta: 'info' | 'greska' = 'info') {
  prijavljenKao = null;
  pokazi('prijava');
  let sacuvan: string | null = null;
  try {
    sacuvan = sessionStorage.getItem(KLJUC_EMAIL);
  } catch {
    /* privatni režim */
  }
  if (sacuvan) {
    $<HTMLInputElement>('#adm-email')!.value = sacuvan;
    korakPrijave(2, sacuvan);
  } else korakPrijave(1);
  poruka($('[data-prijava-status]'), porukaTekst ?? '', vrsta);
}

let odbrojavanje: number | undefined;
function zakljucajPonovo(sekundi = 60) {
  const b = $<HTMLButtonElement>('[data-ponovo]')!;
  let n = sekundi;
  b.disabled = true;
  window.clearInterval(odbrojavanje);
  const tik = () => {
    b.textContent = n > 0 ? `Pošalji ponovo (${n} s)` : 'Pošalji ponovo';
    if (n-- <= 0) {
      b.disabled = false;
      window.clearInterval(odbrojavanje);
    }
  };
  tik();
  odbrojavanje = window.setInterval(tik, 1000);
}

async function posaljiLink(email: string) {
  const { error } = await klijent.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: adminUrl(), shouldCreateUser: true },
  });
  if (error) throw error;
  try {
    sessionStorage.setItem(KLJUC_EMAIL, email);
  } catch {
    /* nije bitno */
  }
}

function poveziPrijavu() {
  const status = $('[data-prijava-status]');
  const f1 = $<HTMLFormElement>('[data-prijava-korak="1"]')!;
  const f2 = $<HTMLFormElement>('[data-prijava-korak="2"]')!;
  const emailEl = $<HTMLInputElement>('#adm-email')!;
  const kodEl = $<HTMLInputElement>('#adm-kod')!;

  f1.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailEl.value.trim().toLowerCase();
    if (!emailEl.checkValidity() || !email) {
      emailEl.setAttribute('aria-invalid', 'true');
      poruka(status, 'Unesite ispravnu e-mail adresu.', 'greska');
      emailEl.focus();
      return;
    }
    emailEl.removeAttribute('aria-invalid');
    void uToku(f1.querySelector('button[type="submit"]'), 'Šaljem…', async () => {
      try {
        await posaljiLink(email);
        korakPrijave(2, email);
        zakljucajPonovo();
        poruka(status, 'E-mail je poslan. Provjerite i folder "Spam" ako ga ne vidite za minut.', 'uspjeh');
      } catch (err) {
        poruka(status, porukaGreske(err), 'greska');
      }
    });
  });

  f2.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = emailEl.value.trim().toLowerCase();
    const kod = kodEl.value.replace(/\s/g, '');
    if (!/^\d{6,10}$/.test(kod)) {
      kodEl.setAttribute('aria-invalid', 'true');
      poruka(status, 'Kod ima 6 cifara (ponekad više) — prepišite ga iz e-maila.', 'greska');
      kodEl.focus();
      return;
    }
    kodEl.removeAttribute('aria-invalid');
    void uToku(f2.querySelector('button[type="submit"]'), 'Provjeravam…', async () => {
      try {
        const { data, error } = await klijent.auth.verifyOtp({ email, token: kod, type: 'email' });
        if (error) throw error;
        kodEl.value = '';
        if (data?.session) await nastavi(data.session);
      } catch (err) {
        poruka(status, porukaGreske(err), 'greska');
      }
    });
  });

  const fL = $<HTMLFormElement>('[data-prijava-lozinka]')!;
  fL.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailL = $<HTMLInputElement>('#adm-email-l')!;
    const lozinkaEl = $<HTMLInputElement>('#adm-lozinka')!;
    const email = emailL.value.trim().toLowerCase();
    if (!emailL.checkValidity() || !email || !lozinkaEl.value) {
      poruka(status, 'Unesite e-mail adresu i lozinku.', 'greska');
      (email ? lozinkaEl : emailL).focus();
      return;
    }
    void uToku(fL.querySelector('button[type="submit"]'), 'Provjeravam…', async () => {
      try {
        const { data, error } = await klijent.auth.signInWithPassword({ email, password: lozinkaEl.value });
        if (error) throw error;
        lozinkaEl.value = '';
        if (data?.session) await nastavi(data.session);
      } catch (err) {
        poruka(status, porukaGreske(err), 'greska');
      }
    });
  });

  $('[data-ponovo]')!.addEventListener('click', async () => {
    const email = emailEl.value.trim().toLowerCase();
    try {
      await posaljiLink(email);
      zakljucajPonovo();
      poruka(status, 'Poslan je novi e-mail. Važi samo najnoviji link/kod.', 'uspjeh');
    } catch (err) {
      poruka(status, porukaGreske(err), 'greska');
    }
  });
  $('[data-promijeni-adresu]')!.addEventListener('click', () => {
    try {
      sessionStorage.removeItem(KLJUC_EMAIL);
    } catch {
      /* nije bitno */
    }
    poruka(status, '');
    korakPrijave(1);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-odjava]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        await klijent.auth.signOut();
      } catch {
        /* lokalna odjava i bez mreže */
      }
      try {
        sessionStorage.removeItem(KLJUC_EMAIL);
      } catch {
        /* nije bitno */
      }
      pokaziPrijavu('Odjavljeni ste.');
    }),
  );
  $('[data-ponovi]')?.addEventListener('click', () => location.reload());
}

// ---------------------------------------------------------------------------------------------
// Aplikacija (poslije prijave)
// ---------------------------------------------------------------------------------------------
const instance = new Map<string, Sekcija>();

async function osvjeziBrojace() {
  try {
    const b = await brojNovih();
    document.querySelectorAll<HTMLElement>('[data-brojac]').forEach((e) => {
      const n = b[e.dataset.brojac as keyof typeof b] ?? 0;
      e.textContent = n ? String(n) : '';
      e.hidden = !n;
      e.setAttribute('aria-label', n ? `${n} novih` : '');
    });
    // telefon: ukupan broj novih u Inboxu na dugmetu ladice
    const ukupno = b.poruke + b.prijave + b.pitanja;
    document.querySelectorAll<HTMLElement>('[data-brojac-ukupno]').forEach((e) => {
      e.textContent = ukupno ? String(ukupno) : '';
      e.hidden = !ukupno;
      e.setAttribute('aria-label', ukupno ? `${ukupno} novih u Inboxu` : '');
    });
  } catch {
    /* brojači nisu bitni */
  }
}

const TVORNICE: Record<string, (c: HTMLElement) => Sekcija> = {
  obavjestenja: (c) => new SekcijaCrud(def.obavjestenja, c),
  aktivnosti: (c) => new SekcijaCrud(aktivnostiDef.aktivnosti, c),
  citati: (c) => new SekcijaCrud(aktivnostiDef.citati, c),
  raspored: (c) => new SekcijaCrud(def.raspored, c),
  galerija: (c) => new SekcijaCrud(def.galerija, c),
  dove: (c) => new SekcijaCrud(def.dove, c),
  'ajeti-hadisi': (c) => new SekcijaCrud(def.ajetiHadisi, c),
  stranice: (c) => new SekcijaCrud(def.stranice, c),
  kartice: (c) => new SekcijaCrud(def.kartice, c),
  programi: (c) => new SekcijaCrud(def.programi, c),
  'predavanja-rucna': (c) => new SekcijaCrud(def.predavanjaRucna, c),
  predavanja: (c) => new SekcijaPredavanja(c),
  transkripti: (c) => new SekcijaTranskripti(c),
  traka: (c) => new SekcijaTraka(c),
  imami: (c) => new SekcijaCrud(def.imami, c),
  kategorije: (c) => new SekcijaCrud(def.kategorije, c),
  serije: (c) => new SekcijaCrud(def.serije, c),
  urednici: (c) => new SekcijaCrud(def.urednici, c),
  dzamija: (c) => new SekcijaDzamija(c),
  ispravke: (c) => new SekcijaIspravke(c),
  poruke: (c) => new SekcijaPoruke(c, osvjeziBrojace),
  prijave: (c) => new SekcijaPrijave(c, osvjeziBrojace),
  pitanja: (c) => new SekcijaPitanja(c, osvjeziBrojace),
};

function dozvoljen(id: string) {
  const o = SVI_ODJELJCI.find((x) => x.id === id);
  return !!o && (!o.samoAdmin || stanje.uloga === 'admin');
}

async function otvoriOdjeljak(id: string, fokus = true, istorija: 'push' | 'replace' | 'ne' = 'push'): Promise<Sekcija> {
  if (!dozvoljen(id)) id = 'obavjestenja';
  document.querySelectorAll<HTMLElement>('[data-sekcija]').forEach((s) => (s.hidden = s.dataset.sekcija !== id));
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach((b) => {
    if (b.dataset.nav === id) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const naziv = SVI_ODJELJCI.find((o) => o.id === id)?.naziv ?? '';
  document.querySelectorAll<HTMLElement>('[data-nav-trenutni]').forEach((e) => (e.textContent = naziv));
  zapamtiOdjeljak(id, istorija);

  const kontejner = $(`[data-sekcija="${id}"]`)!;
  let inst = instance.get(id);
  if (!inst) {
    inst = TVORNICE[id](kontejner);
    instance.set(id, inst);
  }
  if (fokus) {
    const h2 = kontejner.querySelector<HTMLElement>('h2');
    h2?.focus({ preventScroll: true });
    // telefon: novi odjeljak počinje od vrha (ne ostaje na sredini prethodne liste)
    const vrh = $('.adm-app__tijelo');
    if (vrh && vrh.getBoundingClientRect().top < 0) window.scrollTo({ top: vrh.getBoundingClientRect().top + window.scrollY - 140, behavior: 'auto' });
  }
  await inst.aktiviraj();
  return inst;
}

/** Prečice između odjeljaka (npr. Predavanja → "Dodaj video" / "Uredi podatke"). */
document.addEventListener('adm:otvori', (e) => {
  const d = (e as CustomEvent<{ odjeljak: string; id?: string; novo?: boolean }>).detail;
  void (async () => {
    const inst = await otvoriOdjeljak(d.odjeljak);
    if (d.novo) inst.otvoriNovo?.();
    else if (d.id && inst.otvoriZa) await inst.otvoriZa(d.id);
    else if (d.id) {
      // CRUD: otvori postojeći zapis po ključu (dugme "Uredi" u listi)
      document.querySelector<HTMLButtonElement>(`[data-sekcija="${CSS.escape(d.odjeljak)}"] [data-uredi="${CSS.escape(d.id)}"]`)?.click();
    }
  })();
});

function poveziNavigaciju() {
  const meni = $<HTMLDialogElement>('[data-adm-meni]');
  document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach((b) =>
    b.addEventListener('click', () => {
      if (meni?.open) meni.close();
      void otvoriOdjeljak(b.dataset.nav!);
    }),
  );
  // telefon: ladica sa odjeljcima (umjesto javnog menija sajta)
  $('[data-adm-meni-otvori]')?.addEventListener('click', () => {
    if (!meni) return;
    meni.showModal();
    meni.querySelector<HTMLElement>('[aria-current="page"]')?.focus();
  });
  meni?.querySelector('[data-adm-meni-zatvori]')?.addEventListener('click', () => meni.close());
  meni?.addEventListener('click', (e) => {
    if (e.target === meni) meni.close(); // klik na zatamnjenu pozadinu
  });
  pratiIstoriju((id) => void otvoriOdjeljak(id, true, 'ne'));
}

async function nastavi(session: { user: { email?: string } }) {
  const email = (session.user.email ?? '').toLowerCase();
  if (prijavljenKao === email) return;
  prijavljenKao = email;
  pokazi('ucitavanje');
  try {
    const { data, error } = await klijent.from('urednici').select('email,uloga').eq('email', email).maybeSingle();
    if (error) throw error;
    try {
      sessionStorage.removeItem(KLJUC_EMAIL);
    } catch {
      /* nije bitno */
    }
    document.querySelectorAll<HTMLElement>('[data-korisnik]').forEach((e) => (e.textContent = email));
    if (!data) {
      pokazi('bez-prava');
      return;
    }
    stanje.email = email;
    stanje.uloga = data.uloga === 'admin' ? 'admin' : 'urednik';
    document.querySelectorAll<HTMLElement>('[data-uloga]').forEach((e) => (e.textContent = stanje.uloga === 'admin' ? 'Administrator' : 'Urednik'));
    document.querySelectorAll<HTMLElement>('[data-samo-admin]').forEach((e) => (e.hidden = stanje.uloga !== 'admin'));
    pokazi('app');
    await osvjeziListe();
    void osvjeziBrojace();
    await otvoriOdjeljak(new URLSearchParams(location.search).get('odjeljak') ?? 'obavjestenja', false, 'replace');
    $('[data-app-naslov]')?.focus();
  } catch (e) {
    prijavljenKao = null;
    greskaEkran(`Provjera uredničkih prava nije uspjela: ${porukaGreske(e)}`);
  }
}

async function start() {
  if (!supabaseUkljucen) {
    pokazi('nije-podeseno');
    return;
  }
  pokazi('ucitavanje');
  // greška iz linka u e-mailu (npr. istekao link) dolazi u hash-u
  const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
  const hashGreska = hash.get('error_description') || hash.get('error');
  try {
    klijent = await sb();
  } catch {
    greskaEkran('Nije moguće učitati alat za prijavu. Provjerite internet vezu (ili isključite blokator sadržaja) pa osvježite stranicu.');
    return;
  }
  poveziPrijavu();
  poveziNavigaciju();
  klijent.auth.onAuthStateChange((dogadjaj: string, session: { user: { email?: string } } | null) => {
    // bez await-a unutar callback-a (preporuka supabase-js) — odgodi
    setTimeout(() => {
      if (dogadjaj === 'SIGNED_OUT') {
        if (prijavljenKao) pokaziPrijavu('Sesija je završena. Prijavite se ponovo.');
      } else if (session && (dogadjaj === 'SIGNED_IN' || dogadjaj === 'INITIAL_SESSION')) void nastavi(session);
    }, 0);
  });
  const { data } = await klijent.auth.getSession();
  if (data?.session) await nastavi(data.session);
  else if (hashGreska) {
    history.replaceState(null, '', location.pathname + location.search);
    pokaziPrijavu(/expired|invalid/i.test(hashGreska) ? 'Link za prijavu je istekao ili je već iskorišten. Zatražite novi ili upišite kod iz najnovijeg e-maila.' : `Prijava nije uspjela: ${hashGreska}`, 'greska');
  } else {
    if (location.hash.includes('access_token')) history.replaceState(null, '', location.pathname + location.search);
    pokaziPrijavu();
  }
}

// obavijest se sklanja i tapom (na telefonu može prekriti dio forme)
document.getElementById('adm-toast')?.addEventListener('click', (e) => ((e.currentTarget as HTMLElement).hidden = true));

window.addEventListener('unhandledrejection', (e) => {
  console.error(e.reason);
  toast(porukaGreske(e.reason), 'greska');
});

void start();
