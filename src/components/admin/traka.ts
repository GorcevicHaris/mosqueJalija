// Traka na vrhu sajta (postavke, red 'traka'): kratko obavještenje na vrhu svake stranice
// (npr. dženaza, promjena termina džume). Sajt je čita direktno iz baze — vidi se bez čekanja na build.
import { trakaIz, trakaVidljiva, type Traka } from '../../lib/supabase/tipovi';
import { Forma, type KontekstForme, type Polje } from './polja';
import { sb } from './sb';
import { el, porukaGreske, poruka, toast, uToku } from './util';

const SACUVANO_TRAKA = 'Sačuvano. Traka se na sajtu mijenja odmah — posjetiocima koji već imaju otvoren sajt najkasnije za 3 minute.';

const POLJA: Polje[] = [
  { k: 'aktivno', l: 'Prikaži traku na sajtu', t: 'checkbox' },
  { k: 'vrsta', l: 'Vrsta', t: 'select', obavezno: true, pola: true, opcije: [{ v: 'info', t: 'Obavještenje (zelena)' }, { v: 'vazno', t: 'Važno (zlatna)' }, { v: 'dzenaza', t: 'Dženaza (tamna)' }] },
  { k: 'do', l: 'Prikazuj do (uključujući taj dan)', t: 'datum', pola: true, pomoc: 'Prazno = dok je ne isključite.' },
  { k: 'tekst', l: 'Tekst', t: 'textarea', redovi: 2, max: 300, pomoc: 'Jedna do dvije kratke rečenice (najviše 300 znakova).' },
  { k: 'link', l: 'Link „Više“ (nije obavezno)', t: 'text', max: 600, placeholder: 'https://… ili /obavjestenja/…', pomoc: 'Puna adresa (https://…) ili stranica ovog sajta (počinje sa /).' },
];

export class SekcijaTraka {
  private ucitano = false;
  private forma: Forma;
  private status: HTMLElement;
  private pregled: HTMLElement;

  constructor(kontejner: HTMLElement) {
    const ctx: KontekstForme = { klijent: sb, otpremljene: new Set() };
    this.forma = new Forma(POLJA, ctx, false);
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    this.pregled = el('div', { class: 'adm-pregled', 'aria-live': 'polite' });
    const sacuvaj = el('button', { type: 'submit', class: 'btn btn--primary', text: 'Sačuvaj traku' }) as HTMLButtonElement;
    const form = el('form', { class: 'adm-forma card', novalidate: true, 'aria-labelledby': 'traka-naslov' }, this.forma.el, this.status, el('div', { class: 'adm-red-dugmadi' }, sacuvaj), this.pregled);
    form.addEventListener('input', () => this.osvjeziPregled());
    form.addEventListener('change', () => this.osvjeziPregled());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void uToku(sacuvaj, 'Čuvam…', () => this.sacuvaj());
    });
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: 'traka-naslov', tabindex: '-1', text: 'Traka na vrhu sajta' }),
        el('p', { class: 'muted adm-sekcija__opis', text: 'Kratko obavještenje na vrhu svake stranice — npr. dženaza, promjena termina džume ili važna akcija. Posjetilac je može sakriti za vrijeme posjete.' })),
      form,
    );
  }

  private procitaj(): Traka {
    const f = this.forma.procitaj();
    return {
      aktivno: f.aktivno === true,
      vrsta: (f.vrsta as Traka['vrsta']) || 'info',
      tekst: typeof f.tekst === 'string' ? f.tekst.trim() : '',
      link: typeof f.link === 'string' && f.link.trim() ? f.link.trim() : null,
      do: typeof f.do === 'string' && f.do ? f.do : null,
    };
  }

  private osvjeziPregled() {
    const t = this.procitaj();
    const traka = el('div', { class: `adm-traka-pregled adm-traka-pregled--${t.vrsta}` }, t.tekst || '(nema teksta)', t.link ? el('span', { class: 'adm-traka-pregled__link', text: ' Više' }) : null);
    const stanje = !t.aktivno
      ? 'Traka je isključena — ne prikazuje se.'
      : !t.tekst
        ? 'Upišite tekst da bi se traka prikazala.'
        : trakaVidljiva(t)
          ? `Traka se prikazuje${t.do ? ` do ${t.do.split('-').reverse().join('. ')}.` : '.'}`
          : 'Datum „do“ je prošao — traka se više ne prikazuje.';
    this.pregled.replaceChildren(el('p', { class: 'adm-pregled__oznaka', text: 'Pregled' }), traka, el('p', { class: 'adm-pomoc', text: stanje }));
  }

  async aktiviraj() {
    if (this.ucitano) return;
    poruka(this.status, 'Učitavam…');
    try {
      const k = await sb();
      const { data, error } = await k.from('postavke').select('vrijednost').eq('kljuc', 'traka').maybeSingle();
      if (error) throw error;
      const t = trakaIz(data?.vrijednost) ?? { aktivno: false, tekst: '', link: null, vrsta: 'info', do: null };
      // aktivno iz baze (trakaIz gasi traku bez teksta — ovdje prikaži stvarnu vrijednost)
      const v = (data?.vrijednost ?? {}) as Record<string, unknown>;
      this.forma.postavi({ ...t, aktivno: v.aktivno === true });
      this.ucitano = true;
      poruka(this.status, '');
      this.osvjeziPregled();
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  private async sacuvaj() {
    if (!this.ucitano || !this.forma.provjeri()) return;
    const t = this.procitaj();
    if (t.aktivno && !t.tekst) {
      this.forma.greska('tekst', 'Upišite tekst trake (ili isključite prikaz).');
      return poruka(this.status, 'Provjerite označena polja.', 'greska');
    }
    if (t.link && !/^(https?:\/\/|\/)/.test(t.link)) {
      this.forma.greska('link', 'Link mora početi sa https:// ili / (stranica ovog sajta).');
      return poruka(this.status, 'Provjerite označena polja.', 'greska');
    }
    try {
      const k = await sb();
      const { error } = await k.from('postavke').upsert({ kljuc: 'traka', vrijednost: t }, { onConflict: 'kljuc' });
      if (error) throw error;
      poruka(this.status, SACUVANO_TRAKA, 'uspjeh');
      toast(SACUVANO_TRAKA, 'uspjeh');
    } catch (e) {
      poruka(this.status, porukaGreske(e), 'greska');
    }
  }
}
