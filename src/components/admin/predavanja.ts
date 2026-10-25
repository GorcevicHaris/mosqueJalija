// Predavanja: lista svih predavanja (ugrađena pri buildu, i skrivena) sa sakrivanjem/prikazivanjem
// i prečicama na ispravku podataka i dodavanje videa. Skrivanje = ključ "skriveno": true u
// predavanja_ispravke.podaci (ostale ispravke istog videa ostaju); primjenjuje se pri sljedećem buildu.
import { datumTekst } from '../../lib/format';
import { sb } from './sb';
import { nazivImama, ugradjeno, type UgradjenoPredavanje } from './stanje';
import { el, norm, odgovara, porukaGreske, poruka, toast, uToku } from './util';

type Podaci = Record<string, unknown>;
const KORAK = 40;

/** Otvara drugi odjeljak admin panela (main.ts sluša događaj). */
export function otvoriOdjeljak(odjeljak: string, akcija?: { id?: string; novo?: boolean }) {
  document.dispatchEvent(new CustomEvent('adm:otvori', { detail: { odjeljak, ...akcija } }));
}

export class SekcijaPredavanja {
  private ucitano = false;
  private ispravke = new Map<string, Podaci>();
  private predavanja: UgradjenoPredavanje[];
  private pretraga: HTMLInputElement;
  private filter: HTMLSelectElement;
  private lista: HTMLElement;
  private vise: HTMLButtonElement;
  private status: HTMLElement;
  private brojEl: HTMLElement;
  private prikazano = KORAK;

  constructor(kontejner: HTMLElement) {
    this.predavanja = ugradjeno().predavanja;
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.pretraga = el('input', { id: 'pred-pretraga', class: 'input', type: 'search', autocomplete: 'off', placeholder: 'Dio naslova, imam ili YouTube ID…' }) as HTMLInputElement;
    this.filter = el('select', { id: 'pred-filter', class: 'select' },
      el('option', { value: '', text: 'Sva predavanja' }),
      el('option', { value: 'vidljiva', text: 'Vidljiva na sajtu' }),
      el('option', { value: 'skrivena', text: 'Skrivena' }),
      el('option', { value: 'rucna', text: 'Ručno dodana' })) as HTMLSelectElement;
    this.lista = el('ul', { class: 'adm-lista', role: 'list', 'aria-labelledby': 'predavanja-naslov' });
    this.brojEl = el('p', { class: 'adm-pomoc', role: 'status' });
    this.vise = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Prikaži još', hidden: true }) as HTMLButtonElement;
    this.vise.addEventListener('click', () => {
      const prvi = this.prikazano;
      this.prikazano += KORAK;
      this.prikazi();
      this.lista.querySelectorAll<HTMLElement>('[data-uredi]')[prvi]?.focus();
    });
    const novo = () => {
      this.prikazano = KORAK;
      this.prikazi();
    };
    this.pretraga.addEventListener('input', novo);
    this.filter.addEventListener('change', novo);
    const dodaj = el('button', { type: 'button', class: 'btn btn--primary', text: '+ Dodaj video' }) as HTMLButtonElement;
    dodaj.addEventListener('click', () => otvoriOdjeljak('predavanja-rucna', { novo: true }));
    const osvjezi = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Osvježi' }) as HTMLButtonElement;
    osvjezi.addEventListener('click', () => uToku(osvjezi, 'Učitavam…', () => this.ucitaj()));
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: 'predavanja-naslov', tabindex: '-1', text: 'Predavanja' }),
        el('p', { class: 'muted adm-sekcija__opis', text: 'Sva predavanja sa sajta (YouTube kanal džamije + ručno dodani videi). „Sakrij“ uklanja predavanje sa svih stranica (liste, pretraga, RSS, početna) — snimak na YouTube-u ostaje. Promjene se na sajtu vide za otprilike 15–20 minuta.' }),
        el('div', { class: 'adm-red-dugmadi' }, dodaj, osvjezi)),
      el('div', { class: 'adm-traka', role: 'search' },
        el('div', { class: 'field adm-traka__pretraga' }, el('label', { for: 'pred-pretraga', class: 'visually-hidden', text: 'Pretraga predavanja' }), this.pretraga),
        el('div', { class: 'field' }, el('label', { for: 'pred-filter', class: 'visually-hidden', text: 'Prikaz' }), this.filter)),
      this.status,
      this.brojEl,
      this.lista,
      this.vise,
    );
  }

  async aktiviraj() {
    if (!this.ucitano) await this.ucitaj();
  }

  private async ucitaj() {
    poruka(this.status, 'Učitavam…');
    try {
      const k = await sb();
      const { data, error } = await k.from('predavanja_ispravke').select('video_id,podaci');
      if (error) throw error;
      this.ispravke = new Map((data ?? []).map((r: { video_id: string; podaci: Podaci }) => [r.video_id, r.podaci ?? {}]));
      this.ucitano = true;
      poruka(this.status, '');
      this.prikazi();
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  private skriveno(p: UgradjenoPredavanje): boolean {
    const isp = this.ispravke.get(p.id);
    return isp ? isp.skriveno === true : !!p.skriveno && !this.ucitano;
  }

  private filtrirani(): UgradjenoPredavanje[] {
    const q = this.pretraga.value.trim();
    const f = this.filter.value;
    return this.predavanja.filter((p) => {
      if (f === 'vidljiva' && this.skriveno(p)) return false;
      if (f === 'skrivena' && !this.skriveno(p)) return false;
      if (f === 'rucna' && !p.rucno) return false;
      return !q || p.id === q || odgovara(norm(`${p.naslov} ${p.naslovCist} ${p.id} ${nazivImama(p.imam)}`), q);
    });
  }

  private prikazi() {
    const svi = this.filtrirani();
    const dio = svi.slice(0, this.prikazano);
    this.brojEl.textContent = `Prikazano ${dio.length} od ${svi.length} (ukupno predavanja: ${this.predavanja.length}).`;
    this.vise.hidden = dio.length >= svi.length;
    if (!dio.length) {
      this.lista.replaceChildren(el('li', { class: 'adm-prazno muted', text: 'Nema predavanja za ovu pretragu.' }));
      return;
    }
    this.lista.replaceChildren(...dio.map((p) => this.stavka(p)));
  }

  private stavka(p: UgradjenoPredavanje): HTMLElement {
    const naslov = p.naslovCist || p.naslov;
    const sakriveno = this.skriveno(p);
    const meta = el('p', { class: 'adm-stavka__meta', text: `${datumTekst(p.datum)} · ${nazivImama(p.imam) || 'bez imama'} · ${p.id}` });
    if (sakriveno) meta.append(' ', el('span', { class: 'badge badge--warn', text: 'Skriveno' }));
    if (p.rucno) meta.append(' ', el('span', { class: 'badge badge--muted', text: 'Ručno dodano' }));
    const toggle = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: sakriveno ? 'Prikaži' : 'Sakrij', 'aria-label': `${sakriveno ? 'Prikaži na sajtu' : 'Sakrij sa sajta'}: ${naslov}` }) as HTMLButtonElement;
    toggle.addEventListener('click', () => uToku(toggle, '…', () => this.postaviSkriveno(p, !sakriveno)));
    const uredi = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'data-uredi': p.id, text: 'Uredi podatke', 'aria-label': `Uredi podatke: ${naslov}` }) as HTMLButtonElement;
    uredi.addEventListener('click', () => otvoriOdjeljak(p.rucno ? 'predavanja-rucna' : 'ispravke', { id: p.id }));
    const yt = el('a', { class: 'btn btn--ghost btn--sm', href: `https://www.youtube.com/watch?v=${encodeURIComponent(p.id)}`, target: '_blank', rel: 'noopener noreferrer', text: 'YouTube ↗', 'aria-label': `Otvori na YouTube-u: ${naslov}` });
    return el('li', { class: 'adm-stavka', 'data-pk': p.id },
      el('img', { class: 'adm-stavka__slika', src: `https://i.ytimg.com/vi/${encodeURIComponent(p.id)}/mqdefault.jpg`, alt: '', loading: 'lazy' }),
      el('div', { class: 'adm-stavka__tijelo' }, el('p', { class: 'adm-stavka__naslov', text: naslov }), meta),
      el('div', { class: 'adm-stavka__akcije' }, toggle, uredi, yt));
  }

  private async postaviSkriveno(p: UgradjenoPredavanje, sakrij: boolean) {
    try {
      const k = await sb();
      // svjež red (da se ne prepišu ispravke koje je neko drugi u međuvremenu sačuvao)
      const { data, error } = await k.from('predavanja_ispravke').select('podaci').eq('video_id', p.id).maybeSingle();
      if (error) throw error;
      const podaci: Podaci = { ...((data?.podaci as Podaci) ?? {}) };
      if (sakrij) podaci.skriveno = true;
      else delete podaci.skriveno;
      if (Object.keys(podaci).length) {
        const r = await k.from('predavanja_ispravke').upsert({ video_id: p.id, podaci }, { onConflict: 'video_id' });
        if (r.error) throw r.error;
        this.ispravke.set(p.id, podaci);
      } else {
        const r = await k.from('predavanja_ispravke').delete().eq('video_id', p.id);
        if (r.error) throw r.error;
        this.ispravke.delete(p.id);
      }
      this.prikazi();
      this.lista.querySelector<HTMLButtonElement>(`[data-pk="${CSS.escape(p.id)}"] button`)?.focus();
      toast(
        sakrij
          ? `Sakriveno: „${p.naslovCist || p.naslov}”. Sa sajta nestaje za otprilike 15–20 minuta.`
          : `Ponovo vidljivo: „${p.naslovCist || p.naslov}”. Na sajtu za otprilike 15–20 minuta.`,
        'uspjeh',
      );
    } catch (e) {
      toast(porukaGreske(e), 'greska');
    }
  }
}
