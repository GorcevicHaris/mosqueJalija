// Ispravke transkripata: urednik bira predavanje i jezik, vidi sve segmente (vrijeme + tekst) i
// čuva samo izmijenjene segmente (tabela transkript_ispravke). Originalni tekst je u JSON fajlovima
// sajta — učitava se lijeno sa /transkripti/<id>.json (tek kad se predavanje izabere).
import { datumTekst } from '../../lib/format';
import { sb } from './sb';
import { nazivImama, ugradjeno, type UgradjenoPredavanje } from './stanje';
import { el, norm, odgovara, porukaGreske, poruka, potvrdi, toast, uToku } from './util';

type Jezik = 'bs' | 'en';
interface Original {
  bs: string[];
  en: string[] | null;
  od: number[];
  odEn: number[] | null;
}

const SACUVANO_TR = 'Sačuvano. Ispravke transkripta se na sajtu vide za otprilike 15–20 minuta (automatsko osvježavanje).';

const vrijeme = (sek: number) => {
  const s = Math.max(0, Math.floor(sek));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
};

export class SekcijaTranskripti {
  private predavanja: UgradjenoPredavanje[];
  private pretraga: HTMLInputElement;
  private rezultati: HTMLElement;
  private urednik: HTMLElement;
  private status: HTMLElement;
  private kes = new Map<string, Original>();
  // stanje otvorenog transkripta
  private id: string | null = null;
  private jezik: Jezik = 'bs';
  private original: string[] = [];
  private ispravke = new Map<number, string>(); // trenutno sačuvano u bazi (za izabrani jezik)
  private polja: HTMLTextAreaElement[] = [];
  private cuvar = (e: BeforeUnloadEvent) => {
    if (this.izmijenjeni().length) e.preventDefault();
  };

  constructor(kontejner: HTMLElement) {
    this.predavanja = ugradjeno().predavanja.filter((p) => p.tr);
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.pretraga = el('input', { id: 'tr-pretraga', class: 'input', type: 'search', autocomplete: 'off', placeholder: 'Dio naslova, imam ili YouTube ID…' }) as HTMLInputElement;
    this.rezultati = el('ul', { class: 'adm-lista adm-lista--kompakt', role: 'list', 'aria-label': 'Predavanja sa transkriptom' });
    this.urednik = el('div', { class: 'adm-tr', hidden: true });
    this.pretraga.addEventListener('input', () => this.trazi());
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: 'transkripti-naslov', tabindex: '-1', text: 'Transkripti' }),
        el('p', { class: 'muted adm-sekcija__opis', text: `Ispravka pogrešno prepoznatih riječi u transkriptima predavanja (bosanski i engleski prevod). Čuvaju se samo segmenti koje promijenite; „Vrati original“ briše ispravku. Transkript ima ${this.predavanja.length} predavanja.` })),
      el('div', { class: 'card adm-blok' },
        el('div', { class: 'field' }, el('label', { for: 'tr-pretraga', text: 'Pronađi predavanje' }), this.pretraga),
        this.rezultati),
      this.status,
      this.urednik,
    );
    this.trazi();
  }

  async aktiviraj() {
    /* lista je ugrađena; transkript se učitava kad se izabere predavanje */
  }

  private trazi() {
    const q = this.pretraga.value.trim();
    const nadjeni = (q ? this.predavanja.filter((p) => p.id === q || odgovara(norm(`${p.naslov} ${p.naslovCist} ${p.id} ${nazivImama(p.imam)}`), q)) : this.predavanja).slice(0, q ? 20 : 8);
    this.rezultati.replaceChildren(
      ...(nadjeni.length
        ? nadjeni.map((p) => {
            const naslov = p.naslovCist || p.naslov;
            const b = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Otvori transkript', 'aria-label': `Otvori transkript: ${naslov}` }) as HTMLButtonElement;
            b.addEventListener('click', () => uToku(b, 'Učitavam…', () => this.otvori(p, 'bs')));
            const meta = el('p', { class: 'adm-stavka__meta', text: `${datumTekst(p.datum)} · ${nazivImama(p.imam) || 'bez imama'}` });
            if (p.trEn) meta.append(' ', el('span', { class: 'badge badge--muted', text: 'EN prevod' }));
            if (p.skriveno) meta.append(' ', el('span', { class: 'badge badge--warn', text: 'Skriveno' }));
            return el('li', { class: 'adm-stavka' }, el('div', { class: 'adm-stavka__tijelo' }, el('p', { class: 'adm-stavka__naslov', text: naslov }), meta), el('div', { class: 'adm-stavka__akcije' }, b));
          })
        : [el('li', { class: 'adm-prazno muted', text: 'Nema predavanja sa transkriptom za ovu pretragu.' })]),
    );
  }

  private izmijenjeni(): number[] {
    return this.polja.flatMap((t, i) => (t.value !== (this.ispravke.get(i) ?? this.original[i]) ? [i] : []));
  }

  private async ucitajOriginal(id: string): Promise<Original> {
    const k = this.kes.get(id);
    if (k) return k;
    const res = await fetch(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}transkripti/${encodeURIComponent(id)}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.status === 404 ? 'Transkript nije pronađen na sajtu (možda je dodan poslije zadnjeg osvježavanja).' : `Greška ${res.status} pri učitavanju transkripta.`);
    const o = (await res.json()) as Original;
    this.kes.set(id, o);
    return o;
  }

  private async otvori(p: UgradjenoPredavanje, jezik: Jezik) {
    if (this.izmijenjeni().length && !potvrdi('Odbaciti nesačuvane izmjene u transkriptu?')) return;
    try {
      const [o, k] = [await this.ucitajOriginal(p.id), await sb()];
      if (jezik === 'en' && !o.en) jezik = 'bs';
      const { data, error } = await k.from('transkript_ispravke').select('segment,tekst').eq('video_id', p.id).eq('jezik', jezik);
      if (error) throw error;
      this.id = p.id;
      this.jezik = jezik;
      this.original = (jezik === 'en' ? o.en : o.bs) ?? [];
      this.ispravke = new Map((data ?? []).map((r: { segment: number; tekst: string }) => [Number(r.segment), r.tekst]));
      this.iscrtaj(p, o);
      window.addEventListener('beforeunload', this.cuvar);
    } catch (e) {
      poruka(this.status, porukaGreske(e), 'greska');
    }
  }

  private iscrtaj(p: UgradjenoPredavanje, o: Original) {
    poruka(this.status, '');
    const naslov = p.naslovCist || p.naslov;
    const od = (this.jezik === 'en' ? o.odEn : o.od) ?? [];
    const h = el('h3', { id: 'tr-urednik-naslov', tabindex: '-1', text: `Transkript: ${naslov}` });

    // jezik
    const jezici = el('div', { class: 'adm-red-dugmadi', role: 'group', 'aria-label': 'Jezik transkripta' });
    for (const [j, t] of [['bs', 'Bosanski'], ['en', 'Engleski prevod']] as [Jezik, string][]) {
      const b = el('button', { type: 'button', class: `btn btn--sm ${j === this.jezik ? 'btn--primary' : 'btn--ghost'}`, text: t, 'aria-pressed': String(j === this.jezik), disabled: j === 'en' && !o.en }) as HTMLButtonElement;
      if (j !== this.jezik) b.addEventListener('click', () => uToku(b, 'Učitavam…', () => this.otvori(p, j)));
      jezici.append(b);
    }

    // filter segmenata
    const filter = el('input', { id: 'tr-filter', class: 'input', type: 'search', autocomplete: 'off', placeholder: 'Traži riječ u transkriptu…' }) as HTMLInputElement;
    const samoIsp = el('input', { type: 'checkbox', id: 'tr-samo-isp' }) as HTMLInputElement;
    const brojac = el('p', { class: 'adm-pomoc', role: 'status' });

    const lista = el('ol', { class: 'adm-tr__lista', role: 'list' });
    this.polja = [];
    const stavke: HTMLElement[] = [];
    this.original.forEach((orig, i) => {
      const tid = `tr-seg-${i}`;
      const trenutno = this.ispravke.get(i) ?? orig;
      const t = el('textarea', { id: tid, class: 'textarea textarea--sm adm-tr__tekst', rows: String(Math.min(6, Math.max(2, Math.ceil(trenutno.length / 90)))), lang: this.jezik === 'en' ? 'en' : 'bs', dir: 'auto' }) as HTMLTextAreaElement;
      t.value = trenutno;
      this.polja.push(t);
      const sek = od[i] ?? 0;
      const lab = el('label', { for: tid, class: 'adm-tr__vrijeme' }, el('span', { class: 'visually-hidden', text: `Segment ${i + 1}, ` }), vrijeme(sek));
      const yt = el('a', { href: `https://www.youtube.com/watch?v=${encodeURIComponent(p.id)}&t=${Math.floor(sek)}s`, target: '_blank', rel: 'noopener noreferrer', class: 'adm-tr__yt', text: '▶', 'aria-label': `Poslušaj od ${vrijeme(sek)} na YouTube-u` });
      const oznaka = el('span', { class: 'badge badge--primary', text: 'ispravljeno', hidden: !this.ispravke.has(i) });
      const vrati = el('button', { type: 'button', class: 'btn btn--ghost btn--sm', text: 'Vrati original', hidden: !this.ispravke.has(i), 'aria-label': `Vrati original za segment ${vrijeme(sek)}` }) as HTMLButtonElement;
      vrati.addEventListener('click', () => uToku(vrati, '…', () => this.vratiOriginal(i, t, oznaka, vrati)));
      const li = el('li', { class: 'adm-tr__seg', 'data-i': String(i) }, el('div', { class: 'adm-tr__glava' }, lab, yt, oznaka, vrati), t);
      t.addEventListener('input', () => li.classList.toggle('adm-tr__seg--izmijenjeno', t.value !== (this.ispravke.get(i) ?? orig)));
      stavke.push(li);
    });
    lista.append(...stavke);

    const primijeniFilter = () => {
      const q = filter.value.trim();
      let n = 0;
      stavke.forEach((li, i) => {
        const vidi = (!samoIsp.checked || this.ispravke.has(i)) && (!q || odgovara(norm(this.polja[i].value), q));
        li.hidden = !vidi;
        if (vidi) n++;
      });
      brojac.textContent = `Segmenata: ${n} od ${stavke.length}. Ispravljenih: ${this.ispravke.size}.`;
    };
    filter.addEventListener('input', primijeniFilter);
    samoIsp.addEventListener('change', primijeniFilter);

    const status = el('p', { class: 'adm-poruka', hidden: true });
    const sacuvaj = el('button', { type: 'submit', class: 'btn btn--primary', text: 'Sačuvaj izmjene' }) as HTMLButtonElement;
    const zatvori = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Zatvori' }) as HTMLButtonElement;
    zatvori.addEventListener('click', () => {
      if (this.izmijenjeni().length && !potvrdi('Odbaciti nesačuvane izmjene u transkriptu?')) return;
      this.zatvori();
    });
    const form = el('form', { class: 'adm-forma card', novalidate: true, 'aria-labelledby': 'tr-urednik-naslov' },
      h,
      el('p', { class: 'adm-pomoc', text: `${datumTekst(p.datum)} · ${p.id}. Mijenjajte samo pogrešno prepoznate riječi; vrijeme segmenta ostaje isto.` }),
      jezici,
      el('div', { class: 'adm-traka' },
        el('div', { class: 'field adm-traka__pretraga' }, el('label', { for: 'tr-filter', class: 'visually-hidden', text: 'Traži u transkriptu' }), filter),
        el('label', { class: 'adm-check', for: 'tr-samo-isp' }, samoIsp, ' Samo ispravljeni')),
      brojac,
      lista,
      status,
      el('div', { class: 'adm-red-dugmadi adm-forma__dugmad adm-forma__dugmad--ljepljivo' }, sacuvaj, zatvori));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void uToku(sacuvaj, 'Čuvam…', () => this.sacuvaj(status, oznakeOsvjezi));
    });
    const oznakeOsvjezi = () => {
      stavke.forEach((li, i) => {
        const isp = this.ispravke.has(i);
        li.querySelector<HTMLElement>('.badge')!.hidden = !isp;
        li.querySelector<HTMLElement>('button')!.hidden = !isp;
        li.classList.remove('adm-tr__seg--izmijenjeno');
      });
      primijeniFilter();
    };
    primijeniFilter();
    this.urednik.replaceChildren(form);
    this.urednik.hidden = false;
    h.focus();
  }

  private async sacuvaj(status: HTMLElement, poslije: () => void) {
    const id = this.id;
    if (!id) return;
    const promjene = this.izmijenjeni();
    if (!promjene.length) return poruka(status, 'Nema izmjena za čuvanje.', 'info');
    const prazni = promjene.filter((i) => !this.polja[i].value.trim());
    if (prazni.length) {
      this.polja[prazni[0]].focus();
      return poruka(status, 'Segment ne može biti prazan — za vraćanje originala koristite „Vrati original“.', 'greska');
    }
    const upis = promjene.filter((i) => this.polja[i].value.trim() !== this.original[i].trim());
    const brisanje = promjene.filter((i) => this.polja[i].value.trim() === this.original[i].trim() && this.ispravke.has(i));
    try {
      const k = await sb();
      if (upis.length) {
        const { error } = await k
          .from('transkript_ispravke')
          .upsert(upis.map((i) => ({ video_id: id, jezik: this.jezik, segment: i, tekst: this.polja[i].value.trim() })), { onConflict: 'video_id,jezik,segment' });
        if (error) throw error;
      }
      if (brisanje.length) {
        const { error } = await k.from('transkript_ispravke').delete().eq('video_id', id).eq('jezik', this.jezik).in('segment', brisanje);
        if (error) throw error;
      }
      for (const i of upis) {
        this.polja[i].value = this.polja[i].value.trim();
        this.ispravke.set(i, this.polja[i].value);
      }
      for (const i of brisanje) {
        this.ispravke.delete(i);
        this.polja[i].value = this.original[i];
      }
      // izmjena koja je samo vratila original bez reda u bazi
      for (const i of promjene) if (!upis.includes(i) && !brisanje.includes(i)) this.polja[i].value = this.original[i];
      poslije();
      poruka(status, `${SACUVANO_TR} Sačuvano segmenata: ${upis.length}${brisanje.length ? `, vraćeno na original: ${brisanje.length}` : ''}.`, 'uspjeh');
      toast(SACUVANO_TR, 'uspjeh');
    } catch (e) {
      poruka(status, porukaGreske(e), 'greska');
    }
  }

  private async vratiOriginal(i: number, t: HTMLTextAreaElement, oznaka: HTMLElement, dugme: HTMLButtonElement) {
    if (!this.id || !potvrdi('Vratiti originalni (automatski) tekst ovog segmenta?')) return;
    try {
      const k = await sb();
      const { error } = await k.from('transkript_ispravke').delete().eq('video_id', this.id).eq('jezik', this.jezik).eq('segment', i);
      if (error) throw error;
      this.ispravke.delete(i);
      t.value = this.original[i];
      t.closest('li')?.classList.remove('adm-tr__seg--izmijenjeno');
      oznaka.hidden = true;
      dugme.hidden = true;
      t.focus();
      toast('Vraćen je original. Na sajtu se vidi za otprilike 15–20 minuta.', 'uspjeh');
    } catch (e) {
      toast(porukaGreske(e), 'greska');
    }
  }

  private zatvori() {
    window.removeEventListener('beforeunload', this.cuvar);
    this.id = null;
    this.polja = [];
    this.urednik.hidden = true;
    this.urednik.replaceChildren();
    this.pretraga.focus();
  }
}
