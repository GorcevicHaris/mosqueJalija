// Pristigle poruke, prijave (mekteb/halke) i pitanja ("Pitaj imama") koje šalju posjetioci sajta.
import { sb } from './sb';
import { stanje } from './stanje';
import { csv, datumVrijeme, el, norm, odgovara, porukaGreske, poruka, potvrdi, preuzmi, toast, uToku, type VrstaPoruke } from './util';

type Red = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Brojači za bedževe u navigaciji. */
export async function brojNovih(): Promise<{ poruke: number; prijave: number; pitanja: number }> {
  const k = await sb();
  const broj = async (tabela: string, filter: (q: any) => any): Promise<number | null> => {
    const { count, error } = await filter(k.from(tabela).select('id', { count: 'exact', head: true }));
    return error ? null : (count ?? 0);
  };
  const [poruke, prijave, pitanja] = await Promise.all([
    broj('poruke', (q) => q.eq('procitano', false)).then((n) => n ?? 0),
    broj('prijave', (q) => q.eq('status', 'nova')).then((n) => n ?? 0),
    // bez odgovora i nije sakriveno; prije migracije 0007 kolona `skriveno` ne postoji → bez tog uslova
    broj('pitanja', (q) => q.is('odgovor', null).eq('skriveno', false)).then(async (n) => n ?? (await broj('pitanja', (q) => q.is('odgovor', null))) ?? 0),
  ]);
  return { poruke, prijave, pitanja };
}

abstract class Sanduce {
  protected redovi: Red[] = [];
  protected ucitano = false;
  protected lista: HTMLElement;
  protected status: HTMLElement;
  protected pretraga: HTMLInputElement;
  protected filter: HTMLSelectElement;
  protected traka: HTMLElement;

  constructor(
    protected kontejner: HTMLElement,
    protected id: string,
    naslov: string,
    opis: string,
    filterOpcije: { v: string; t: string }[],
    protected naPromjenu: () => void,
  ) {
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.lista = el('ul', { class: 'adm-lista adm-lista--poruke', role: 'list', 'aria-labelledby': `${id}-naslov` });
    this.pretraga = el('input', { id: `${id}-pretraga`, class: 'input', type: 'search', placeholder: 'Pretraga…', autocomplete: 'off' }) as HTMLInputElement;
    this.filter = el('select', { id: `${id}-filter`, class: 'select' }, ...filterOpcije.map((o) => el('option', { value: o.v, text: o.t }))) as HTMLSelectElement;
    this.pretraga.addEventListener('input', () => this.prikazi());
    this.filter.addEventListener('change', () => this.prikazi());
    const osvjezi = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Osvježi' }) as HTMLButtonElement;
    osvjezi.addEventListener('click', () => uToku(osvjezi, 'Učitavam…', () => this.ucitaj()));
    this.traka = el('div', { class: 'adm-traka', role: 'search' },
      el('div', { class: 'field adm-traka__pretraga' }, el('label', { for: `${id}-pretraga`, class: 'visually-hidden', text: `Pretraga: ${naslov}` }), this.pretraga),
      el('div', { class: 'field' }, el('label', { for: `${id}-filter`, class: 'visually-hidden', text: 'Prikaži' }), this.filter));
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: `${id}-naslov`, tabindex: '-1', text: naslov }),
        el('p', { class: 'muted adm-sekcija__opis', text: opis }),
        el('div', { class: 'adm-red-dugmadi' }, osvjezi, ...this.alatke())),
      this.traka, this.status, this.lista);
  }

  protected alatke(): HTMLElement[] {
    return [];
  }
  protected abstract tabela: string;
  protected abstract indeks(r: Red): string;
  protected abstract odgovaraFilteru(r: Red, f: string): boolean;
  protected abstract stavka(r: Red): HTMLElement;

  async aktiviraj() {
    if (!this.ucitano) await this.ucitaj();
  }

  async ucitaj() {
    poruka(this.status, 'Učitavam…');
    try {
      const k = await sb();
      const { data, error } = await k.from(this.tabela).select('*').order('created_at', { ascending: false }).limit(1000);
      if (error) throw error;
      this.redovi = data ?? [];
      this.ucitano = true;
      poruka(this.status, '');
      this.prikazi();
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  protected filtrirani(): Red[] {
    const q = this.pretraga.value.trim();
    const f = this.filter.value;
    return this.redovi.filter((r) => (!f || this.odgovaraFilteru(r, f)) && (!q || odgovara(norm(this.indeks(r)), q)));
  }

  protected prikazi() {
    const r = this.filtrirani();
    this.lista.replaceChildren(...(r.length ? r.map((x) => this.stavka(x)) : [el('li', { class: 'adm-prazno muted', text: this.redovi.length ? 'Nema stavki za ovaj prikaz.' : 'Još ništa nije stiglo.' })]));
  }

  protected async azuriraj(r: Red, izmjene: Red, poruka_ = 'Sačuvano.', vrsta: VrstaPoruke = 'uspjeh') {
    const k = await sb();
    const { error } = await k.from(this.tabela).update(izmjene).eq('id', r.id);
    if (error) throw error;
    Object.assign(r, izmjene);
    toast(poruka_, vrsta, 3500);
    this.naPromjenu();
  }

  protected async obrisi(r: Red, opis: string) {
    if (!potvrdi(`Obrisati ${opis}? Ovo se ne može poništiti.`)) return;
    try {
      const k = await sb();
      const { error } = await k.from(this.tabela).delete().eq('id', r.id);
      if (error) throw error;
      this.redovi = this.redovi.filter((x) => x !== r);
      this.prikazi();
      toast('Obrisano.', 'uspjeh', 3000);
      this.naPromjenu();
      this.pretraga.focus();
    } catch (e) {
      toast(porukaGreske(e), 'greska');
    }
  }

  protected dugme(tekst: string, klasa = 'btn btn--ghost btn--sm', aria?: string) {
    return el('button', { type: 'button', class: klasa, text: tekst, 'aria-label': aria }) as HTMLButtonElement;
  }
}

// ---------------------------------------------------------------------------------------------
export class SekcijaPoruke extends Sanduce {
  protected tabela = 'poruke';
  constructor(k: HTMLElement, naPromjenu: () => void) {
    super(k, 'poruke', 'Poruke', 'Poruke sa kontakt forme. Odgovor šaljete iz svog e-mail programa (dugme "Odgovori").', [
      { v: '', t: 'Sve poruke' },
      { v: 'nove', t: 'Nepročitane' },
      { v: 'procitane', t: 'Pročitane' },
    ], naPromjenu);
  }
  protected indeks(r: Red) {
    return `${r.ime} ${r.email} ${r.tema} ${r.poruka}`;
  }
  protected odgovaraFilteru(r: Red, f: string) {
    return (f === 'nove' ? !r.procitano : !!r.procitano);
  }
  protected stavka(r: Red): HTMLElement {
    const li = el('li', { class: `adm-poruka-stavka${r.procitano ? '' : ' adm-poruka-stavka--nova'}` });
    const oznaci = this.dugme(r.procitano ? 'Označi kao nepročitano' : 'Označi kao pročitano');
    oznaci.addEventListener('click', () =>
      uToku(oznaci, '…', async () => {
        try {
          await this.azuriraj(r, { procitano: !r.procitano }, r.procitano ? 'Označeno kao nepročitano.' : 'Označeno kao pročitano.');
          this.prikazi();
        } catch (e) {
          toast(porukaGreske(e), 'greska');
        }
      }));
    const odgovori = el('a', { class: 'btn btn--primary btn--sm', href: `mailto:${s(r.email)}?subject=${encodeURIComponent(`Re: ${s(r.tema)}`)}`, text: 'Odgovori e-mailom' });
    odgovori.addEventListener('click', () => {
      if (!r.procitano) void this.azuriraj(r, { procitano: true }, 'Označeno kao pročitano.').then(() => this.prikazi()).catch(() => {});
    });
    const obrisi = this.dugme('Obriši', 'btn btn--ghost btn--sm adm-opasno');
    obrisi.addEventListener('click', () => this.obrisi(r, `poruku od ${s(r.ime)}`));
    li.append(
      el('div', { class: 'adm-poruka-stavka__glava' },
        el('p', { class: 'adm-stavka__naslov', text: `${s(r.ime)} — ${s(r.tema)}` }),
        el('p', { class: 'adm-stavka__meta' }, `${datumVrijeme(s(r.created_at))} · `, el('a', { href: `mailto:${s(r.email)}`, text: s(r.email) }), r.procitano ? '' : ' ', r.procitano ? '' : el('span', { class: 'badge badge--primary', text: 'Novo' }))),
      el('p', { class: 'adm-poruka-stavka__tekst', text: s(r.poruka) }),
      el('div', { class: 'adm-red-dugmadi' }, odgovori, oznaci, obrisi));
    return li;
  }
}

// ---------------------------------------------------------------------------------------------
const STATUSI = [
  { v: 'nova', t: 'Nova' },
  { v: 'kontaktiran', t: 'Kontaktiran' },
  { v: 'upisan', t: 'Upisan' },
  { v: 'odbijen', t: 'Odbijen' },
];

export class SekcijaPrijave extends Sanduce {
  protected tabela = 'prijave';
  constructor(k: HTMLElement, naPromjenu: () => void) {
    super(k, 'prijave', 'Prijave (mekteb, halke, kursevi)', 'Prijave sa sajta. Promijenite status kad kontaktirate osobu; tabelu možete preuzeti za Excel (CSV).', [
      { v: '', t: 'Svi statusi' },
      ...STATUSI,
    ], naPromjenu);
  }
  protected alatke() {
    const b = this.dugme('Preuzmi CSV (prikazano)');
    b.addEventListener('click', () => {
      const redovi = this.filtrirani().map((r) => ({ ...r, created_at: datumVrijeme(s(r.created_at)), status: STATUSI.find((x) => x.v === r.status)?.t ?? r.status }));
      if (!redovi.length) return toast('Nema prijava za izvoz u ovom prikazu.', 'info');
      preuzmi(
        `prijave-${new Date().toISOString().slice(0, 10)}.csv`,
        csv(redovi, [
          { k: 'created_at', l: 'Datum' },
          { k: 'ime_prezime', l: 'Ime i prezime' },
          { k: 'program', l: 'Program' },
          { k: 'uzrast', l: 'Uzrast' },
          { k: 'roditelj', l: 'Roditelj' },
          { k: 'telefon', l: 'Telefon' },
          { k: 'email', l: 'E-mail' },
          { k: 'napomena', l: 'Napomena' },
          { k: 'status', l: 'Status' },
          { k: 'biljeska', l: 'Bilješka' },
        ]),
      );
    });
    return [b];
  }
  protected indeks(r: Red) {
    return `${r.ime_prezime} ${r.roditelj} ${r.telefon} ${r.email} ${r.program} ${r.napomena} ${r.biljeska}`;
  }
  protected odgovaraFilteru(r: Red, f: string) {
    return r.status === f;
  }
  protected stavka(r: Red): HTMLElement {
    const id = `prijava-${s(r.id)}`;
    const sel = el('select', { id: `${id}-status`, class: 'select select--sm' }, ...STATUSI.map((o) => el('option', { value: o.v, text: o.t }))) as HTMLSelectElement;
    sel.value = s(r.status);
    sel.addEventListener('change', async () => {
      const staro = s(r.status);
      try {
        await this.azuriraj(r, { status: sel.value }, `Status: ${STATUSI.find((x) => x.v === sel.value)?.t}.`);
      } catch (e) {
        sel.value = staro;
        toast(porukaGreske(e), 'greska');
      }
    });
    const biljeska = el('textarea', { id: `${id}-biljeska`, class: 'textarea textarea--sm', rows: '2', maxlength: '2000' }) as HTMLTextAreaElement;
    biljeska.value = s(r.biljeska);
    const sacuvaj = this.dugme('Sačuvaj bilješku');
    sacuvaj.addEventListener('click', () =>
      uToku(sacuvaj, 'Čuvam…', async () => {
        try {
          await this.azuriraj(r, { biljeska: biljeska.value.trim() || null }, 'Bilješka je sačuvana.');
        } catch (e) {
          toast(porukaGreske(e), 'greska');
        }
      }));
    const obrisi = this.dugme('Obriši', 'btn btn--ghost btn--sm adm-opasno');
    obrisi.addEventListener('click', () => this.obrisi(r, `prijavu: ${s(r.ime_prezime)}`));
    const detalji = el('dl', { class: 'adm-detalji' });
    const dodaj = (l: string, v: Node | string) => detalji.append(el('dt', { text: l }), el('dd', {}, v));
    dodaj('Telefon', el('a', { href: `tel:${s(r.telefon).replace(/[^\d+]/g, '')}`, text: s(r.telefon) }));
    if (r.email) dodaj('E-mail', el('a', { href: `mailto:${s(r.email)}`, text: s(r.email) }));
    if (r.uzrast) dodaj('Uzrast', `${s(r.uzrast)} god.`);
    if (r.roditelj) dodaj('Roditelj', s(r.roditelj));
    if (r.napomena) dodaj('Napomena', s(r.napomena));
    return el('li', { class: `adm-poruka-stavka${r.status === 'nova' ? ' adm-poruka-stavka--nova' : ''}` },
      el('div', { class: 'adm-poruka-stavka__glava' },
        el('p', { class: 'adm-stavka__naslov', text: s(r.ime_prezime) }),
        el('p', { class: 'adm-stavka__meta' }, `${datumVrijeme(s(r.created_at))} · `, el('span', { class: 'badge', text: s(r.program) }))),
      detalji,
      el('div', { class: 'adm-inbox-polja' },
        el('div', { class: 'field' }, el('label', { for: sel.id, text: 'Status' }), sel),
        el('div', { class: 'field' }, el('label', { for: biljeska.id, text: 'Interna bilješka' }), biljeska)),
      el('div', { class: 'adm-red-dugmadi' }, sacuvaj, obrisi));
  }
}

// ---------------------------------------------------------------------------------------------
// Pitanja: javna (odmah na sajtu, urednik ih može sakriti) i privatne poruke (vidi ih samo urednik;
// odgovor se može objaviti anonimno). Kolone javno/skriveno — migracija 0007.
const jeJavno = (r: Red) => r.javno === true;

export class SekcijaPitanja extends Sanduce {
  protected tabela = 'pitanja';
  constructor(k: HTMLElement, naPromjenu: () => void) {
    super(k, 'pitanja', 'Pitanja ("Pitaj imama")',
      'Javna pitanja se odmah vide na stranici „Pitaj imama“, a vaš odgovor ispod njih čim ga sačuvate (neprikladna sakrijte). Privatne poruke vidite samo vi — odgovor možete objaviti anonimno. E-mail se nikad ne objavljuje.', [
      { v: '', t: 'Sva pitanja' },
      { v: 'neodgovorena', t: 'Neodgovorena' },
      { v: 'javna', t: 'Javna' },
      { v: 'privatna', t: 'Privatne poruke' },
      { v: 'sakrivena', t: 'Sakrivena sa sajta' },
    ], naPromjenu);
  }
  protected indeks(r: Red) {
    return `${r.pitanje} ${r.odgovor} ${r.ime} ${r.email} ${r.odgovorio} ${jeJavno(r) ? 'javno' : 'privatno'}`;
  }
  protected odgovaraFilteru(r: Red, f: string) {
    if (f === 'neodgovorena') return !r.odgovor;
    if (f === 'javna') return jeJavno(r);
    if (f === 'privatna') return !jeJavno(r);
    if (f === 'sakrivena') return r.skriveno === true;
    return true;
  }
  /** Da li se pitanje sada vidi na sajtu (ista pravila kao pogled pitanja_javna). */
  private naSajtu(r: Red) {
    return r.skriveno !== true && (jeJavno(r) || (r.objavljeno === true && !!r.odgovor));
  }
  protected stavka(r: Red): HTMLElement {
    const id = `pitanje-${s(r.id)}`;
    const javno = jeJavno(r);
    const odgovor = el('textarea', { id: `${id}-odgovor`, class: 'textarea adm-rastuci', rows: '5', maxlength: '20000' }) as HTMLTextAreaElement;
    odgovor.value = s(r.odgovor);
    const listaId = 'adm-imena-imama';
    if (!document.getElementById(listaId)) document.body.append(el('datalist', { id: listaId }, ...stanje.imami.map((i) => el('option', { value: i.punoIme }))));
    const odgovorio = el('input', { id: `${id}-odgovorio`, class: 'input', type: 'text', maxlength: '120', list: listaId, placeholder: 'npr. Hfz. Admir ef. Jašarević', autocomplete: 'off' }) as HTMLInputElement;
    odgovorio.value = s(r.odgovorio);
    // javno: "Sakrij sa sajta"; privatno: "Objavi odgovor (anonimno)"
    const prekidac = el('input', { id: `${id}-${javno ? 'sakrij' : 'objavi'}`, type: 'checkbox' }) as HTMLInputElement;
    prekidac.checked = javno ? r.skriveno === true : r.objavljeno === true;
    const prekidacPomoc = el('p', {
      class: 'adm-pomoc',
      id: `${id}-prekidac-pomoc`,
      text: javno
        ? 'Sakriveno pitanje (i odgovor) nestaje sa stranice „Pitaj imama“ odmah; ostaje ovdje.'
        : 'Pitanje i odgovor se prikazuju na sajtu bez imena i e-maila — samo kad postoji odgovor.',
    });
    prekidac.setAttribute('aria-describedby', prekidacPomoc.id);
    const status = el('p', { class: 'adm-poruka', hidden: true });
    const sacuvaj = this.dugme('Sačuvaj', 'btn btn--primary btn--sm');
    sacuvaj.addEventListener('click', () => {
      const tekst = odgovor.value.trim();
      if (!javno && prekidac.checked && !tekst) {
        poruka(status, 'Odgovor na privatnu poruku se može objaviti tek kad ga upišete.', 'greska');
        odgovor.focus();
        return;
      }
      const izmjene: Red = { odgovor: tekst || null, odgovorio: odgovorio.value.trim() || null };
      if (javno) izmjene.skriveno = prekidac.checked;
      else izmjene.objavljeno = prekidac.checked && !!tekst;
      const vidljivo = this.naSajtu({ ...r, ...izmjene });
      const tekstPoruke = javno
        ? vidljivo
          ? tekst ? 'Sačuvano — odgovor se odmah vidi na stranici „Pitaj imama“.' : 'Sačuvano — pitanje je na sajtu i čeka odgovor.'
          : 'Sačuvano — pitanje je sakriveno sa sajta.'
        : vidljivo
          ? 'Sačuvano i objavljeno (bez imena) — vidi se odmah na stranici „Pitaj imama“.'
          : 'Sačuvano. Privatna poruka se ne prikazuje na sajtu.';
      void uToku(sacuvaj, 'Čuvam…', async () => {
        try {
          await this.azuriraj(r, izmjene, tekstPoruke);
          poruka(status, '');
          this.prikazi();
          this.lista.querySelector<HTMLElement>(`[data-pitanje="${CSS.escape(s(r.id))}"] .btn--primary`)?.focus();
        } catch (e) {
          poruka(status, porukaGreske(e), 'greska');
        }
      });
    });
    const obrisi = this.dugme('Obriši', 'btn btn--ghost btn--sm adm-opasno');
    obrisi.addEventListener('click', () => this.obrisi(r, javno ? 'ovo javno pitanje (nestaje i sa sajta)' : 'ovu privatnu poruku'));

    const ime = s(r.ime).trim();
    const ko = javno ? (ime ? `${ime} (ime se vidi na sajtu)` : 'anonimno') : [ime || 'bez imena (staro pitanje)', s(r.email)].filter(Boolean).join(', ');
    const znacke = el('span', { class: 'adm-red-dugmadi adm-pitanje__znacke' },
      el('span', { class: `badge ${javno ? 'badge--primary' : 'badge--muted'}`, text: javno ? 'Javno' : 'Privatno' }),
      r.odgovor ? el('span', { class: 'badge badge--muted', text: 'Odgovoreno' }) : el('span', { class: 'badge badge--warn', text: 'Bez odgovora' }),
      r.skriveno === true
        ? el('span', { class: 'badge badge--warn', text: 'Sakriveno sa sajta' })
        : this.naSajtu(r)
          ? el('span', { class: 'badge badge--primary', text: javno ? 'Na sajtu' : 'Odgovor objavljen (anonimno)' })
          : null);
    const detalji = el('dl', { class: 'adm-detalji' }, el('dt', { text: 'Pita' }), el('dd', { text: ko }));
    if (r.email) {
      const dd = detalji.lastElementChild as HTMLElement;
      dd.replaceChildren(`${ime || 'bez imena'}, `, el('a', { href: `mailto:${s(r.email)}`, text: s(r.email) }));
    }
    return el('li', { class: `adm-poruka-stavka${r.odgovor || r.skriveno ? '' : ' adm-poruka-stavka--nova'}`, 'data-pitanje': s(r.id) },
      el('div', { class: 'adm-poruka-stavka__glava' },
        el('p', { class: 'adm-stavka__meta' }, datumVrijeme(s(r.created_at)), ' ', znacke)),
      el('p', { class: 'adm-poruka-stavka__tekst adm-pitanje', text: s(r.pitanje) }),
      detalji,
      el('div', { class: 'field' }, el('label', { for: odgovor.id, text: javno ? 'Odgovor (vidi se na sajtu čim sačuvate)' : 'Odgovor' }), odgovor),
      el('div', { class: 'field' }, el('label', { for: odgovorio.id, text: 'Odgovorio (prikazuje se uz odgovor)' }), odgovorio),
      el('div', { class: 'field' },
        el('label', { class: 'adm-check', for: prekidac.id }, prekidac, javno ? ' Sakrij sa sajta' : ' Objavi odgovor na sajtu (anonimno, bez imena i e-maila)'),
        prekidacPomoc),
      status,
      el('div', { class: 'adm-red-dugmadi' }, sacuvaj, obrisi));
  }
}
