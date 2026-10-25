// Generički uređivač tabele: lista (pretraga, filteri, redoslijed) + forma (dodaj/uredi/obriši).
// Svaka sekcija admin panela je opis (DefTabele) — vidi sekcije.ts.
import { Forma, type KontekstForme, type Opcija, type Polje } from './polja';
import { sb, type SB } from './sb';
import { ukloniSliku } from './slike';
import { el, esc, norm, odgovara, porukaGreske, potvrdi, poruka, SACUVANO, toast, uToku } from './util';

/** Lokalna putanja ('/images/…') → sa base-om sajta (GitHub Pages podfolder); URL ostaje. */
const srcSlike = (v: string): string =>
  /^https?:\/\//.test(v) ? v : `${import.meta.env.BASE_URL.replace(/\/$/, '')}${v.startsWith('/') ? v : `/${v}`}`;

export type Red = Record<string, unknown>;
export interface Znacka {
  t: string;
  v?: 'warn' | 'primary' | 'muted';
}

export interface DefTabele {
  id: string;
  tabela: string;
  pk: string;
  naslov: string;
  opis?: string;
  novoTekst?: string; // bez njega nema dugmeta "Dodaj"
  polja: Polje[] | (() => Polje[]);
  select?: string;
  red?: [string, boolean][]; // [kolona, rastuće]
  redoslijed?: boolean; // kolona `redoslijed` + dugmad gore/dolje
  prikaz(r: Red): { naslov: string; meta?: string; znacke?: Znacka[]; slika?: string | null };
  pretraga?(r: Red): string;
  filteri?: { k: string; l: string; opcije: Opcija[] | (() => Opcija[]); test?(r: Red, v: string): boolean }[];
  novi?(svi: Red[]): Red;
  autoSlug?: { izvor: string; cilj: string; fn?: (s: string) => string };
  prijeSnimanja?(podaci: Red, stari: Red | null, svi: Red[]): Red | Promise<Red>;
  mozeBrisati?(r: Red): string | null;
  ucitaj?(k: SB): Promise<Red[]>;
  snimi?(k: SB, podaci: Red, stari: Red | null): Promise<void>;
  obrisi?(k: SB, r: Red): Promise<void>;
  nakonIzmjene?(): void | Promise<void>;
  pregled?(podaci: Red): string;
  alatke?(s: SekcijaCrud): HTMLElement | null;
  slikaPolja?: string[];
  porukaSacuvano?: string;
  potvrdaBrisanja?(r: Red): string;
}

export class SekcijaCrud {
  redovi: Red[] = [];
  private lista!: HTMLElement;
  private pogled!: HTMLElement;
  private formaEl!: HTMLElement;
  private status!: HTMLElement;
  private pretraga!: HTMLInputElement;
  private filteri: Map<string, HTMLSelectElement> = new Map();
  private novoBtn: HTMLButtonElement | null = null;
  private ucitano = false;

  constructor(readonly def: DefTabele, readonly kontejner: HTMLElement) {
    this.izgradi();
  }

  private izgradi() {
    const d = this.def;
    const naslovId = `${d.id}-naslov`;
    const zaglavlje = el('div', { class: 'adm-sekcija__zaglavlje' }, el('h2', { id: naslovId, text: d.naslov, tabindex: '-1' }));
    if (d.opis) zaglavlje.append(el('p', { class: 'muted adm-sekcija__opis', text: d.opis }));
    const dugmad = el('div', { class: 'adm-red-dugmadi' });
    if (d.novoTekst) {
      this.novoBtn = el('button', { type: 'button', class: 'btn btn--primary', text: `+ ${d.novoTekst}` }) as HTMLButtonElement;
      this.novoBtn.addEventListener('click', () => this.otvori(null));
      dugmad.append(this.novoBtn);
    }
    const osvjezi = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Osvježi' }) as HTMLButtonElement;
    osvjezi.addEventListener('click', () => uToku(osvjezi, 'Učitavam…', () => this.ucitaj()));
    dugmad.append(osvjezi);
    const alatke = d.alatke?.(this);
    if (alatke) dugmad.append(alatke);
    zaglavlje.append(dugmad);

    const pretragaId = `${d.id}-pretraga`;
    this.pretraga = el('input', { id: pretragaId, class: 'input', type: 'search', placeholder: 'Pretraga…', autocomplete: 'off' }) as HTMLInputElement;
    this.pretraga.addEventListener('input', () => this.prikaziListu());
    const traka = el('div', { class: 'adm-traka', role: 'search' }, el('div', { class: 'field adm-traka__pretraga' }, el('label', { for: pretragaId, class: 'visually-hidden', text: `Pretraga: ${d.naslov}` }), this.pretraga));
    for (const f of d.filteri ?? []) {
      const fid = `${d.id}-f-${f.k}`;
      const sel = el('select', { id: fid, class: 'select' }) as HTMLSelectElement;
      const napuni = () => {
        const v = sel.value;
        sel.replaceChildren(el('option', { value: '', text: `${f.l}: sve` }), ...(typeof f.opcije === 'function' ? f.opcije() : f.opcije).map((o) => el('option', { value: o.v, text: o.t })));
        sel.value = v;
      };
      napuni();
      sel.addEventListener('focus', napuni);
      sel.addEventListener('change', () => this.prikaziListu());
      this.filteri.set(f.k, sel);
      traka.append(el('div', { class: 'field' }, el('label', { for: fid, class: 'visually-hidden', text: f.l }), sel));
    }

    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.lista = el('ul', { class: 'adm-lista', role: 'list', 'aria-labelledby': naslovId });
    this.pogled = el('div', { class: 'adm-sekcija__lista' }, traka, this.status, this.lista);
    this.formaEl = el('div', { class: 'adm-sekcija__forma', hidden: true });
    this.kontejner.replaceChildren(zaglavlje, this.pogled, this.formaEl);
  }

  /** Učitaj samo prvi put kad se sekcija otvori. */
  async aktiviraj() {
    if (!this.ucitano) await this.ucitaj();
  }

  async ucitaj() {
    poruka(this.status, 'Učitavam…', 'info');
    try {
      const k = await sb();
      if (this.def.ucitaj) this.redovi = await this.def.ucitaj(k);
      else {
        let q = k.from(this.def.tabela).select(this.def.select ?? '*');
        for (const [kol, asc] of this.def.red ?? (this.def.redoslijed ? [['redoslijed', true] as [string, boolean]] : [])) q = q.order(kol, { ascending: asc });
        const { data, error } = await q;
        if (error) throw error;
        this.redovi = data ?? [];
      }
      this.ucitano = true;
      poruka(this.status, '', 'info');
      this.prikaziListu();
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  private filtrirani(): Red[] {
    const q = this.pretraga.value.trim();
    return this.redovi.filter((r) => {
      if (q) {
        const p = this.def.prikaz(r);
        const indeks = norm(this.def.pretraga ? this.def.pretraga(r) : `${p.naslov} ${p.meta ?? ''}`);
        if (!odgovara(indeks, q)) return false;
      }
      for (const f of this.def.filteri ?? []) {
        const v = this.filteri.get(f.k)?.value ?? '';
        if (v && !(f.test ? f.test(r, v) : String(r[f.k] ?? '') === v)) return false;
      }
      return true;
    });
  }

  prikaziListu() {
    const redovi = this.filtrirani();
    const filtrirano = redovi.length !== this.redovi.length;
    const mozePomjeranje = !!this.def.redoslijed && !filtrirano;
    if (!redovi.length) {
      this.lista.replaceChildren(el('li', { class: 'adm-prazno muted', text: this.redovi.length ? 'Nema rezultata za ovu pretragu.' : 'Još nema unosa.' }));
      return;
    }
    this.lista.replaceChildren(
      ...redovi.map((r, i) => {
        const p = this.def.prikaz(r);
        const pkv = String(r[this.def.pk] ?? '');
        const li = el('li', { class: 'adm-stavka', 'data-pk': pkv });
        if (p.slika !== undefined) {
          li.append(p.slika ? el('img', { class: 'adm-stavka__slika', src: srcSlike(p.slika), alt: '', loading: 'lazy' }) : el('span', { class: 'adm-stavka__slika adm-stavka__slika--prazno', 'aria-hidden': 'true' }));
        }
        const tijelo = el('div', { class: 'adm-stavka__tijelo' }, el('p', { class: 'adm-stavka__naslov', text: p.naslov || '(bez naslova)' }));
        const meta = el('p', { class: 'adm-stavka__meta' });
        if (p.meta) meta.append(p.meta);
        for (const z of p.znacke ?? []) meta.append(' ', el('span', { class: `badge${z.v ? ` badge--${z.v}` : ''}`, text: z.t }));
        if (meta.childNodes.length) tijelo.append(meta);
        const akcije = el('div', { class: 'adm-stavka__akcije' });
        const uredi = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'data-uredi': pkv, text: 'Uredi' }) as HTMLButtonElement;
        uredi.setAttribute('aria-label', `Uredi: ${p.naslov}`);
        uredi.addEventListener('click', () => this.otvori(r));
        akcije.append(uredi);
        if (mozePomjeranje) {
          const gore = el('button', { type: 'button', class: 'adm-ikona', text: '↑', 'aria-label': `Pomjeri gore: ${p.naslov}`, disabled: i === 0 }) as HTMLButtonElement;
          const dolje = el('button', { type: 'button', class: 'adm-ikona', text: '↓', 'aria-label': `Pomjeri dolje: ${p.naslov}`, disabled: i === redovi.length - 1 }) as HTMLButtonElement;
          gore.addEventListener('click', () => this.pomjeri(r, -1));
          dolje.addEventListener('click', () => this.pomjeri(r, 1));
          akcije.append(gore, dolje);
        }
        const obrisi = el('button', { type: 'button', class: 'adm-ikona adm-ikona--opasno', text: '✕', 'aria-label': `Obriši: ${p.naslov}` }) as HTMLButtonElement;
        obrisi.addEventListener('click', () => this.obrisi(r, obrisi));
        akcije.append(obrisi);
        li.append(tijelo, akcije);
        return li;
      }),
    );
  }

  private async pomjeri(r: Red, smjer: number) {
    const i = this.redovi.indexOf(r);
    const j = i + smjer;
    if (j < 0 || j >= this.redovi.length) return;
    const novi = this.redovi.slice();
    [novi[i], novi[j]] = [novi[j], novi[i]];
    const izmjene = novi
      .map((x, idx) => ({ x, nr: idx * 10 }))
      .filter(({ x, nr }) => Number(x.redoslijed) !== nr);
    try {
      const k = await sb();
      const rez = await Promise.all(izmjene.map(({ x, nr }) => k.from(this.def.tabela).update({ redoslijed: nr }).eq(this.def.pk, x[this.def.pk])));
      const g = rez.find((x: { error: unknown }) => x.error);
      if (g) throw g.error;
      izmjene.forEach(({ x, nr }) => (x.redoslijed = nr));
      this.redovi = novi;
      this.prikaziListu();
      const pkv = String(r[this.def.pk]);
      this.lista.querySelector<HTMLButtonElement>(`[data-pk="${CSS.escape(pkv)}"] [aria-label^="Pomjeri ${smjer < 0 ? 'gore' : 'dolje'}"]:not([disabled])`)?.focus() ??
        this.lista.querySelector<HTMLButtonElement>(`[data-pk="${CSS.escape(pkv)}"] [data-uredi]`)?.focus();
      toast('Redoslijed je sačuvan. Na sajtu se vidi za otprilike 15–20 minuta.', 'uspjeh', 4000);
      await this.def.nakonIzmjene?.();
    } catch (e) {
      toast(porukaGreske(e), 'greska');
      await this.ucitaj();
    }
  }

  private async obrisi(r: Red, btn: HTMLButtonElement) {
    const razlog = this.def.mozeBrisati?.(r);
    if (razlog) return toast(razlog, 'greska');
    const naslov = this.def.prikaz(r).naslov;
    if (!potvrdi(this.def.potvrdaBrisanja?.(r) ?? `Obrisati "${naslov}"? Ovo se ne može poništiti.`)) return;
    await uToku(btn, '…', async () => {
      try {
        const k = await sb();
        if (this.def.obrisi) await this.def.obrisi(k, r);
        else {
          const { error } = await k.from(this.def.tabela).delete().eq(this.def.pk, r[this.def.pk]);
          if (error) throw error;
        }
        for (const s of this.def.slikaPolja ?? []) await ukloniSliku(k, r[s] as string);
        toast(`Obrisano: ${naslov}`, 'uspjeh', 4000);
        await this.def.nakonIzmjene?.();
        await this.ucitaj();
        (this.novoBtn ?? this.pretraga).focus();
      } catch (e) {
        toast(porukaGreske(e), 'greska');
      }
    });
  }

  otvori(r: Red | null) {
    const d = this.def;
    const jeNovo = r === null;
    const ctx: KontekstForme = { klijent: sb, otpremljene: new Set() };
    const forma = new Forma(typeof d.polja === 'function' ? d.polja() : d.polja, ctx, jeNovo);
    forma.postavi(jeNovo ? (d.novi?.(this.redovi) ?? {}) : r);
    if (d.autoSlug) forma.autoIz(d.autoSlug.izvor, d.autoSlug.cilj, d.autoSlug.fn);

    const naslovId = `${d.id}-forma-naslov`;
    const h = el('h3', { id: naslovId, tabindex: '-1', text: jeNovo ? (d.novoTekst ?? 'Novi unos') : `Uređivanje: ${d.prikaz(r).naslov}` });
    const status = el('p', { class: 'adm-poruka', hidden: true });
    const sacuvaj = el('button', { type: 'submit', class: 'btn btn--primary', text: 'Sačuvaj' }) as HTMLButtonElement;
    const odustani = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Odustani' }) as HTMLButtonElement;
    const dugmad = el('div', { class: 'adm-red-dugmadi adm-forma__dugmad' }, sacuvaj);
    const pregledEl = el('div', { class: 'adm-pregled', hidden: true, 'aria-live': 'polite' });
    if (d.pregled) {
      const pregledBtn = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Pregled', 'aria-expanded': 'false' }) as HTMLButtonElement;
      pregledBtn.addEventListener('click', () => {
        const otvoren = pregledEl.hidden;
        pregledEl.hidden = !otvoren;
        pregledBtn.setAttribute('aria-expanded', String(otvoren));
        if (otvoren) pregledEl.innerHTML = `<p class="adm-pregled__oznaka">Pregled (približan izgled na sajtu)</p>${d.pregled!(forma.procitaj())}`;
      });
      dugmad.append(pregledBtn);
    }
    dugmad.append(odustani);
    const form = el('form', { class: 'adm-forma card', novalidate: true, 'aria-labelledby': naslovId }, h, forma.el, status, dugmad, pregledEl);

    const zatvori = (fokusPk?: string) => {
      this.formaEl.hidden = true;
      this.formaEl.replaceChildren();
      this.pogled.hidden = false;
      window.removeEventListener('beforeunload', cuvar);
      const cilj = fokusPk ? this.lista.querySelector<HTMLElement>(`[data-uredi="${CSS.escape(fokusPk)}"]`) : null;
      (cilj ?? this.novoBtn ?? this.pretraga).focus();
    };
    const pocetno = JSON.stringify(forma.procitaj());
    const cuvar = (e: BeforeUnloadEvent) => {
      if (JSON.stringify(forma.procitaj()) !== pocetno) e.preventDefault();
    };
    window.addEventListener('beforeunload', cuvar);

    odustani.addEventListener('click', async () => {
      if (JSON.stringify(forma.procitaj()) !== pocetno && !potvrdi('Odbaciti nesačuvane izmjene?')) return;
      const k = await sb();
      for (const u of ctx.otpremljene) void ukloniSliku(k, u);
      zatvori(jeNovo ? undefined : String(r![d.pk]));
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!forma.provjeri()) {
        poruka(status, 'Provjerite označena polja.', 'greska');
        return;
      }
      void uToku(sacuvaj, 'Čuvam…', async () => {
        try {
          let podaci = forma.procitaj();
          if (d.prijeSnimanja) podaci = await d.prijeSnimanja(podaci, r, this.redovi);
          const k = await sb();
          if (d.snimi) await d.snimi(k, podaci, r);
          else if (jeNovo) {
            if (d.redoslijed && podaci.redoslijed === undefined)
              podaci.redoslijed = this.redovi.reduce((m, x) => Math.max(m, Number(x.redoslijed) || 0), 0) + 10;
            const { error } = await k.from(d.tabela).insert(podaci);
            if (error) throw error;
          } else {
            const { error } = await k.from(d.tabela).update(podaci).eq(d.pk, r![d.pk]);
            if (error) throw error;
          }
          // stara slika koja je zamijenjena/uklonjena se briše iz bucketa
          if (!jeNovo) for (const s of d.slikaPolja ?? []) if (r![s] && r![s] !== podaci[s]) await ukloniSliku(k, r![s] as string);
          ctx.otpremljene.clear();
          toast(d.porukaSacuvano ?? SACUVANO, 'uspjeh');
          await d.nakonIzmjene?.();
          await this.ucitaj();
          zatvori(String(podaci[d.pk] ?? r?.[d.pk] ?? ''));
        } catch (err) {
          const m = err instanceof PoljeGreska ? err.message : porukaGreske(err);
          if (err instanceof PoljeGreska) forma.greska(err.polje, err.message);
          poruka(status, m, 'greska');
        }
      });
    });

    this.pogled.hidden = true;
    this.formaEl.replaceChildren(form);
    this.formaEl.hidden = false;
    h.focus();
  }
}

/** Greška vezana za konkretno polje (prikazuje se uz to polje). */
export class PoljeGreska extends Error {
  constructor(readonly polje: string, poruka: string) {
    super(poruka);
  }
}

export { esc };
