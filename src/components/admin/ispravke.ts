// Ručne ispravke podataka o predavanjima (imam, kategorija, serija, dio, čist naslov).
// Lista predavanja je ugrađena pri buildu (data/predavanja.json); ispravke se čuvaju u tabeli
// predavanja_ispravke i primjenjuju pri sljedećem buildu (vidi docs/supabase.md).
import { datumTekst } from '../../lib/format';
import { Forma, type KontekstForme, type Polje } from './polja';
import { sb } from './sb';
import { nazivImama, opcijeImama, opcijeKategorija, opcijeSerija, stanje, ugradjeno, type UgradjenoPredavanje } from './stanje';
import { el, norm, odgovara, porukaGreske, poruka, potvrdi, SACUVANO, toast, uToku } from './util';

type Podaci = Record<string, unknown>;
const UREDIVO = ['imam', 'imamPotvrdjen', 'kategorija', 'serija', 'serijaDio', 'naslovCist'];

const polja = (): Polje[] => [
  { k: 'imam', l: 'Imam / predavač', t: 'select', pola: true, opcije: () => [{ v: '', t: '— bez promjene —' }, { v: '__null', t: 'Nepoznat (bez imama)' }, ...opcijeImama()] },
  { k: 'kategorija', l: 'Kategorija', t: 'select', pola: true, opcije: () => [{ v: '', t: '— bez promjene —' }, ...opcijeKategorija()] },
  { k: 'nesiguran', l: 'Imam nije siguran (prikaži kao "nepotvrđeno")', t: 'checkbox' },
  { k: 'serija', l: 'Serija', t: 'select', pola: true, opcije: () => [{ v: '', t: '— bez promjene —' }, { v: '__null', t: 'Nije dio serije' }, ...opcijeSerija()] },
  { k: 'serijaDio', l: 'Dio serije (broj)', t: 'broj', min: 1, max: 999, pola: true, pomoc: 'Prazno = bez promjene.' },
  { k: 'naslovCist', l: 'Naslov na sajtu', t: 'text', max: 200, pomoc: 'Prazno = bez promjene (koristi se automatski očišćen naslov).' },
];

function uFormu(p: Podaci): Podaci {
  return {
    imam: 'imam' in p ? (p.imam === null ? '__null' : p.imam) : '',
    nesiguran: p.imamPotvrdjen === false,
    kategorija: p.kategorija ?? '',
    serija: 'serija' in p ? (p.serija === null ? '__null' : p.serija) : '',
    serijaDio: p.serijaDio ?? null,
    naslovCist: p.naslovCist ?? '',
  };
}

function izForme(f: Podaci, postojece: Podaci): Podaci {
  const p: Podaci = {};
  // ključevi koje forma ne uređuje (npr. "opis") ostaju
  for (const [k, v] of Object.entries(postojece)) if (!UREDIVO.includes(k)) p[k] = v;
  if (f.imam === '__null') p.imam = null;
  else if (f.imam) {
    p.imam = f.imam;
    if (f.nesiguran) p.imamPotvrdjen = false;
  }
  if (f.kategorija) p.kategorija = f.kategorija;
  if (f.serija === '__null') p.serija = null;
  else if (f.serija) p.serija = f.serija;
  if (typeof f.serijaDio === 'number' && Number.isInteger(f.serijaDio)) p.serijaDio = f.serijaDio;
  if (typeof f.naslovCist === 'string' && f.naslovCist.trim()) p.naslovCist = f.naslovCist.trim();
  return p;
}

function opisIspravke(p: Podaci): string {
  const d: string[] = [];
  if ('imam' in p) d.push(`imam: ${p.imam === null ? 'nepoznat' : nazivImama(String(p.imam))}${p.imamPotvrdjen === false ? ' (nepotvrđeno)' : ''}`);
  if (p.kategorija) d.push(`kategorija: ${stanje.kategorije.find((k) => k.slug === p.kategorija)?.naziv ?? p.kategorija}`);
  if ('serija' in p) d.push(`serija: ${p.serija === null ? 'nije dio serije' : (stanje.serije.find((s) => s.slug === p.serija)?.naziv ?? p.serija)}`);
  if (p.serijaDio) d.push(`dio ${p.serijaDio}`);
  if (p.naslovCist) d.push(`naslov: „${p.naslovCist}”`);
  if (p.opis !== undefined) d.push('opis');
  return d.join(' · ') || '(prazno)';
}

export class SekcijaIspravke {
  private ucitano = false;
  private ispravke = new Map<string, Podaci>();
  private listaEl: HTMLElement;
  private rezultati: HTMLElement;
  private pretraga: HTMLInputElement;
  private formaOmot: HTMLElement;
  private status: HTMLElement;
  private predavanja: UgradjenoPredavanje[];

  constructor(kontejner: HTMLElement) {
    this.predavanja = ugradjeno().predavanja;
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.pretraga = el('input', { id: 'isp-pretraga', class: 'input', type: 'search', autocomplete: 'off', placeholder: 'Dio naslova ili YouTube ID…' }) as HTMLInputElement;
    this.rezultati = el('ul', { class: 'adm-lista adm-lista--kompakt', role: 'list', 'aria-label': 'Rezultati pretrage predavanja' });
    this.listaEl = el('ul', { class: 'adm-lista', role: 'list', 'aria-labelledby': 'isp-postojece' });
    this.formaOmot = el('div', { hidden: true });
    this.pretraga.addEventListener('input', () => this.trazi());
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: 'ispravke-naslov', tabindex: '-1', text: 'Ispravke predavanja' }),
        el('p', { class: 'muted adm-sekcija__opis', text: 'Kad je imam, kategorija ili serija snimka pogrešno prepoznata. Ispravke ostaju i poslije svakog automatskog osvježavanja sa YouTube-a.' })),
      el('div', { class: 'card adm-blok' },
        el('div', { class: 'field' }, el('label', { for: 'isp-pretraga', text: 'Pronađi predavanje' }), this.pretraga),
        this.rezultati),
      this.formaOmot,
      this.status,
      el('h3', { id: 'isp-postojece', text: 'Postojeće ispravke' }),
      this.listaEl,
    );
  }

  async aktiviraj() {
    if (!this.ucitano) await this.ucitaj();
  }

  private async ucitaj() {
    poruka(this.status, 'Učitavam…');
    try {
      const k = await sb();
      const { data, error } = await k.from('predavanja_ispravke').select('video_id,podaci,updated_at').order('updated_at', { ascending: false });
      if (error) throw error;
      this.ispravke = new Map((data ?? []).map((r: { video_id: string; podaci: Podaci }) => [r.video_id, r.podaci ?? {}]));
      this.ucitano = true;
      poruka(this.status, '');
      this.prikaziPostojece();
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  private predavanje(id: string) {
    return this.predavanja.find((p) => p.id === id) ?? null;
  }

  private stavka(id: string, opis: string, dugme: string, onClick: () => void, obrisi?: () => void) {
    const p = this.predavanje(id);
    const naslov = p ? p.naslovCist || p.naslov : id;
    const btn = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: dugme, 'aria-label': `${dugme}: ${naslov}` });
    btn.addEventListener('click', onClick);
    const akcije = el('div', { class: 'adm-stavka__akcije' }, btn);
    if (obrisi) {
      const x = el('button', { type: 'button', class: 'adm-ikona adm-ikona--opasno', text: '✕', 'aria-label': `Ukloni ispravku: ${naslov}` });
      x.addEventListener('click', obrisi);
      akcije.append(x);
    }
    return el('li', { class: 'adm-stavka', 'data-id': id },
      el('div', { class: 'adm-stavka__tijelo' },
        el('p', { class: 'adm-stavka__naslov', text: naslov }),
        el('p', { class: 'adm-stavka__meta', text: `${p ? `${datumTekst(p.datum)} · ` : ''}${id}${opis ? ` · ${opis}` : ''}` })),
      akcije);
  }

  private prikaziPostojece() {
    if (!this.ispravke.size) {
      this.listaEl.replaceChildren(el('li', { class: 'adm-prazno muted', text: 'Još nema ispravki.' }));
      return;
    }
    this.listaEl.replaceChildren(...Array.from(this.ispravke.entries()).map(([id, p]) => this.stavka(id, opisIspravke(p), 'Uredi', () => this.otvori(id), () => this.obrisi(id))));
  }

  private trazi() {
    const q = this.pretraga.value.trim();
    if (q.length < 2) {
      this.rezultati.replaceChildren();
      return;
    }
    const nadjeni = this.predavanja.filter((p) => p.id === q || odgovara(norm(`${p.naslov} ${p.naslovCist} ${p.id} ${nazivImama(p.imam)}`), q)).slice(0, 15);
    this.rezultati.replaceChildren(
      ...(nadjeni.length
        ? nadjeni.map((p) => this.stavka(p.id, nazivImama(p.imam), this.ispravke.has(p.id) ? 'Uredi ispravku' : 'Ispravi', () => this.otvori(p.id)))
        : [el('li', { class: 'adm-prazno muted', text: 'Nema predavanja koje odgovara pretrazi.' })]),
    );
  }

  private otvori(id: string) {
    const p = this.predavanje(id);
    const postojece = this.ispravke.get(id) ?? {};
    const ctx: KontekstForme = { klijent: sb, otpremljene: new Set() };
    const forma = new Forma(polja(), ctx, true);
    forma.postavi(uFormu(postojece));
    const h = el('h3', { id: 'isp-forma-naslov', tabindex: '-1', text: `Ispravka: ${p ? p.naslovCist || p.naslov : id}` });
    const info = el('div', { class: 'adm-pomoc adm-trenutno' });
    if (p) {
      info.append(
        el('p', { text: `Originalni naslov: ${p.naslov}` }),
        el('p', { text: `Trenutno: ${nazivImama(p.imam) || 'bez imama'} · ${stanje.kategorije.find((k) => k.slug === p.kategorija)?.naziv ?? p.kategorija}${p.serija ? ` · ${stanje.serije.find((s) => s.slug === p.serija)?.naziv ?? p.serija}${p.serijaDio ? `, dio ${p.serijaDio}` : ''}` : ''}` }),
        el('p', {}, el('a', { href: `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, target: '_blank', rel: 'noopener noreferrer', text: 'Otvori na YouTube-u' })),
      );
    }
    const status = el('p', { class: 'adm-poruka', hidden: true });
    const sacuvaj = el('button', { type: 'submit', class: 'btn btn--primary', text: 'Sačuvaj ispravku' }) as HTMLButtonElement;
    const odustani = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Zatvori' }) as HTMLButtonElement;
    const form = el('form', { class: 'adm-forma card', novalidate: true, 'aria-labelledby': 'isp-forma-naslov' }, h, info, forma.el, status, el('div', { class: 'adm-red-dugmadi' }, sacuvaj, odustani));
    odustani.addEventListener('click', () => {
      this.formaOmot.hidden = true;
      this.formaOmot.replaceChildren();
      this.pretraga.focus();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!forma.provjeri()) return;
      const podaci = izForme(forma.procitaj(), postojece);
      if (!Object.keys(podaci).length) {
        poruka(status, 'Niste izabrali nijednu izmjenu. Za uklanjanje ispravke koristite ✕ u listi.', 'greska');
        return;
      }
      void uToku(sacuvaj, 'Čuvam…', async () => {
        try {
          const k = await sb();
          const { error } = await k.from('predavanja_ispravke').upsert({ video_id: id, podaci }, { onConflict: 'video_id' });
          if (error) throw error;
          this.ispravke.delete(id);
          this.ispravke = new Map([[id, podaci], ...this.ispravke]);
          this.prikaziPostojece();
          this.trazi();
          poruka(status, SACUVANO, 'uspjeh');
          toast(SACUVANO, 'uspjeh');
        } catch (err) {
          poruka(status, porukaGreske(err), 'greska');
        }
      });
    });
    this.formaOmot.replaceChildren(form);
    this.formaOmot.hidden = false;
    h.focus();
  }

  private async obrisi(id: string) {
    const p = this.predavanje(id);
    if (!potvrdi(`Ukloniti ispravku za "${p ? p.naslovCist || p.naslov : id}"? Vratiće se automatski prepoznati podaci.`)) return;
    try {
      const k = await sb();
      const { error } = await k.from('predavanja_ispravke').delete().eq('video_id', id);
      if (error) throw error;
      this.ispravke.delete(id);
      this.prikaziPostojece();
      toast('Ispravka je uklonjena. Promjena se na sajtu vidi za otprilike 15–20 minuta.', 'uspjeh');
    } catch (e) {
      toast(porukaGreske(e), 'greska');
    }
  }
}
