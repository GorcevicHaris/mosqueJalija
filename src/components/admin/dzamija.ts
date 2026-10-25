// Podaci o džamiji: jedan JSON objekat (postavke.kljuc = 'dzamija', oblik Dzamija iz types.ts).
// Forma mijenja poznata polja; ključevi koje forma ne poznaje ostaju netaknuti.
import { Forma, type KontekstForme, type Polje } from './polja';
import { sb } from './sb';
import { ugradjeno } from './stanje';
import { el, porukaGreske, poruka, potvrdi, SACUVANO, toast, uToku } from './util';

type Obj = Record<string, unknown>;

const GRUPE: { naslov: string; opis?: string; polja: Polje[] }[] = [
  {
    naslov: 'Osnovno',
    polja: [
      { k: 'naziv', l: 'Naziv džamije', t: 'text', obavezno: true, max: 120 },
      { k: 'nazivArapski', l: 'Naziv na arapskom', t: 'text', rtl: true, max: 120 },
      { k: 'adresa', l: 'Adresa', t: 'text', max: 200, placeholder: 'Ulica i broj, poštanski broj i mjesto' },
      { k: 'grad', l: 'Grad', t: 'text', max: 80, pola: true },
      { k: 'drzava', l: 'Država', t: 'text', max: 80, pola: true },
      { k: 'koordinate.lat', l: 'Geografska širina (lat)', t: 'broj', korak: 0.000001, min: -90, max: 90, obavezno: true, pola: true },
      { k: 'koordinate.lng', l: 'Geografska dužina (lng)', t: 'broj', korak: 0.000001, min: -180, max: 180, obavezno: true, pola: true },
      { k: 'koordinate.potvrdjeno', l: 'Koordinate su provjerene (koriste se za vaktiju i mapu)', t: 'checkbox' },
      { k: 'kratakOpis', l: 'Kratak opis', t: 'textarea', redovi: 4, max: 1200, pomoc: 'Prikazuje se na početnoj, u opisu za pretraživače i pri dijeljenju linka.' },
      { k: 'naslovnaSlika', l: 'Naslovna fotografija', t: 'slika', folder: 'dzamija', pomoc: 'Široka fotografija džamije (položena, najbolje bez ljudi u prvom planu) — pozadina na početnoj i fotografija na stranici O džamiji. Smanjuje se na najviše 1600 px.' },
      { k: 'naslovnaSlikaIzvor', l: 'Potpis naslovne fotografije', t: 'text', max: 200, placeholder: 'npr. Foto: Džamija na Jaliji' },
    ],
  },
  {
    naslov: 'Kontakt',
    polja: [
      { k: 'kontakt.email', l: 'E-mail', t: 'email', max: 254, pola: true },
      { k: 'kontakt.telefon', l: 'Telefon', t: 'tel', max: 40, pola: true },
      { k: 'kontakt.napomena', l: 'Napomena uz kontakt', t: 'textarea', redovi: 3, max: 1000 },
    ],
  },
  {
    naslov: 'Džuma-namaz',
    polja: [
      { k: 'dzuma.vrijeme', l: 'Vrijeme džume', t: 'text', max: 120, placeholder: 'npr. 12:30 (zimi), 13:30 (ljeti)' },
      { k: 'dzuma.napomena', l: 'Napomena', t: 'textarea', redovi: 3, max: 1000 },
    ],
  },
  {
    naslov: 'Društvene mreže',
    polja: [
      { k: 'drustveneMreze.youtube', l: 'YouTube kanal', t: 'url', obavezno: true, max: 300 },
      { k: 'drustveneMreze.facebook', l: 'Facebook stranica', t: 'url', max: 300 },
      { k: 'drustveneMreze.instagram', l: 'Instagram profil', t: 'url', max: 300 },
    ],
  },
  {
    naslov: 'Donacije',
    opis: 'Stranica Donacije prikazuje samo kontakt: Instagram i Facebook (iz društvenih mreža), telefon i e-mail. Prazno polje = koristi se opšti kontakt džamije.',
    polja: [
      { k: 'donacije.email', l: 'E-mail za donacije', t: 'email', max: 254, pola: true },
      { k: 'donacije.telefon', l: 'Telefon za donacije', t: 'tel', max: 40, pola: true },
      { k: 'donacije.napomena', l: 'Napomena (prikazuje se ispod kontakta)', t: 'textarea', redovi: 3, max: 1000 },
    ],
  },
  {
    naslov: 'Historija',
    polja: [
      {
        k: 'historija', l: 'Odjeljci historije', t: 'niz', dodajTekst: '+ Dodaj odjeljak',
        pomoc: 'Redoslijed mijenjate strelicama. Uz svaku tvrdnju navedite izvor.',
        podPolja: [
          { k: 'naslov', l: 'Naslov odjeljka', t: 'text', max: 200, obavezno: true },
          { k: 'tekst', l: 'Tekst', t: 'textarea', redovi: 5, obavezno: true },
          { k: 'izvor', l: 'Izvor (URL)', t: 'url', max: 600 },
        ],
      },
    ],
  },
  {
    naslov: 'Činjenice',
    polja: [
      {
        k: 'cinjenice', l: 'Činjenice (kratki podaci)', t: 'niz', dodajTekst: '+ Dodaj činjenicu',
        podPolja: [
          { k: 'oznaka', l: 'Oznaka', t: 'text', max: 120, obavezno: true, pola: true, placeholder: 'npr. Svečano otvorena' },
          { k: 'vrijednost', l: 'Vrijednost', t: 'text', max: 300, obavezno: true, pola: true, placeholder: 'npr. 8. mart 2024.' },
          { k: 'izvor', l: 'Izvor (URL)', t: 'url', max: 600 },
        ],
      },
    ],
  },
  {
    naslov: 'Izvori',
    polja: [
      {
        k: 'izvori', l: 'Lista izvora', t: 'niz', dodajTekst: '+ Dodaj izvor',
        podPolja: [
          { k: 'naziv', l: 'Naziv', t: 'text', max: 300, obavezno: true },
          { k: 'url', l: 'Adresa (URL)', t: 'url', max: 600 },
        ],
      },
    ],
  },
];

const jeObj = (v: unknown): v is Obj => !!v && typeof v === 'object' && !Array.isArray(v);

/** Duboko spajanje: objekti se spajaju po ključu, nizovi i vrijednosti se zamjenjuju. */
function spoji(osnova: Obj, izmjene: Obj): Obj {
  const rez: Obj = { ...osnova };
  for (const [k, v] of Object.entries(izmjene)) rez[k] = jeObj(rez[k]) && jeObj(v) ? spoji(rez[k] as Obj, v) : v;
  return rez;
}

export class SekcijaDzamija {
  private ucitano = false;
  private original: Obj = {};
  private forme: Forma[] = [];
  private status: HTMLElement;
  private formEl: HTMLFormElement;
  private izBaze = false;

  constructor(kontejner: HTMLElement) {
    const ctx: KontekstForme = { klijent: sb, otpremljene: new Set() };
    this.status = el('p', { class: 'adm-poruka', hidden: true });
    const sacuvaj = el('button', { type: 'submit', class: 'btn btn--primary', text: 'Sačuvaj podatke o džamiji' }) as HTMLButtonElement;
    const ponisti = el('button', { type: 'button', class: 'btn btn--ghost', text: 'Poništi izmjene' }) as HTMLButtonElement;
    this.formEl = el('form', { class: 'adm-forma', novalidate: true, 'aria-labelledby': 'dzamija-naslov' }) as HTMLFormElement;
    for (const g of GRUPE) {
      const f = new Forma(g.polja, ctx, false);
      this.forme.push(f);
      const fs = el('fieldset', { class: 'adm-grupa card' }, el('legend', { text: g.naslov }));
      if (g.opis) fs.append(el('p', { class: 'adm-pomoc', text: g.opis }));
      fs.append(f.el);
      this.formEl.append(fs);
    }
    this.formEl.append(this.status, el('div', { class: 'adm-red-dugmadi adm-forma__dugmad adm-forma__dugmad--ljepljivo' }, sacuvaj, ponisti));
    this.formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      void uToku(sacuvaj, 'Čuvam…', () => this.sacuvaj());
    });
    ponisti.addEventListener('click', () => {
      if (potvrdi('Vratiti sva polja na posljednje sačuvano stanje?')) this.postavi(this.original);
    });
    kontejner.replaceChildren(
      el('div', { class: 'adm-sekcija__zaglavlje' },
        el('h2', { id: 'dzamija-naslov', tabindex: '-1', text: 'Podaci o džamiji' }),
        el('p', { class: 'muted adm-sekcija__opis', text: 'Kontakt, džuma, društvene mreže, donacije, historija i činjenice. Prikazuje se na stranicama O džamiji, Kontakt, Donacije i u podnožju sajta.' })),
      this.formEl,
    );
  }

  private postavi(o: Obj) {
    this.forme.forEach((f) => f.postavi(o));
  }

  async aktiviraj() {
    if (this.ucitano) return;
    poruka(this.status, 'Učitavam…');
    try {
      const k = await sb();
      const { data, error } = await k.from('postavke').select('vrijednost').eq('kljuc', 'dzamija').maybeSingle();
      if (error) throw error;
      this.izBaze = !!data?.vrijednost;
      // rezerva: podaci ugrađeni pri buildu (data/dzamija.json)
      this.original = spoji(ugradjeno().dzamija ?? {}, jeObj(data?.vrijednost) ? (data!.vrijednost as Obj) : {});
      this.postavi(this.original);
      this.ucitano = true;
      poruka(this.status, this.izBaze ? '' : 'U bazi još nema podataka o džamiji — prikazani su podaci sa sajta; čuvanjem se upisuju u bazu.', 'info');
    } catch (e) {
      poruka(this.status, `Učitavanje nije uspjelo: ${porukaGreske(e)}`, 'greska');
    }
  }

  private async sacuvaj() {
    if (!this.ucitano) return;
    if (!this.forme.every((f) => f.provjeri())) {
      // provjeri() fokusira prvo neispravno polje u svakoj grupi — fokusiraj prvo u formi
      this.formEl.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      poruka(this.status, 'Provjerite označena polja.', 'greska');
      return;
    }
    let izmjene: Obj = {};
    for (const f of this.forme) izmjene = spoji(izmjene, f.procitaj());
    const nova = spoji(this.original, izmjene);
    try {
      const k = await sb();
      const { error } = await k.from('postavke').upsert({ kljuc: 'dzamija', vrijednost: nova }, { onConflict: 'kljuc' });
      if (error) throw error;
      this.original = nova;
      this.izBaze = true;
      poruka(this.status, SACUVANO, 'uspjeh');
      toast(SACUVANO, 'uspjeh');
    } catch (e) {
      poruka(this.status, porukaGreske(e), 'greska');
    }
  }
}
