// Arapski dijelovi transkripta (uvod i završetak hutbe, ajeti, hadisi, dove) — čiste funkcije, bez zavisnosti.
// Koristi ih scripts/transkripcija/arapski.mjs (drugi korak poslije bosanske transkripcije).
//
// Ideja: bosanski prolaz (whisper -l bs) arapski dio ili „proguta“ (oznaka, rupa u vremenu, par riječi
// preko 60 s), ili ga napiše latinicom („Innel hamde lillahi…“), ili arapskim pismom bez harakata.
// Zato se kandidatski dijelovi snimka ponovo prepoznaju sa -l ar; rezultat se filtrira (poznate
// halucinacije, provjera jezika) i ubacuje kao zasebni segmenti { jezik: "ar" }.

import { POZNATI, normAr } from './arapski-tekstovi.mjs';

export const ARAPSKA_SLOVA = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/g;
const LATINICA = /[A-Za-zÀ-žḀ-ỿ]/g;

/** Oznake koje whisper/lektura stavljaju umjesto arapskog dijela. */
export const OZNAKE = /^\s*\[(učenje na arapskom|arapski \/ nije transkribovano|arabic recitation|arabic|nejasno[^\]]*)\]\s*$/i;

// Česte bosanske riječi: latinični tekst bez njih je gotovo sigurno arapska transliteracija.
const BOSANSKE = new Set(
  ('i je da se u na to su a od za kao ali ne što sto koji koja koje kaže kaze nas nam mi vi on ona oni ono smo ste bio bila bilo ' +
    'će ce bi biti ima nema sve svi svaki tako onda kada kad ako ili jer pa još jos samo sam si braćo braco draga dragi ' +
    'poštovana postovana uzvišeni uzviseni njega njegov njegova našeg naš nas naše vas ovo ova ovaj taj ta ' +
    'koliko kako zašto zasto gdje šta sta neka po iz do sa kod prema nakon prije poslije danas dana zato ovdje tu evo ' +
    'zahvala pripada gospodaru svjetova poslaniku hvala molim dalje kažu kazu rekao rekli reče rece reci tada njegovi ' +
    'njihov njihova njihovi braća braca otac sin ovome onome svijetu dunjaluku znači znaci ovaj ova dakle također takodjer').split(' '),
);
// Česte engleske riječi (engleska verzija transkripta): rečenica sa njima nije transliteracija.
const ENGLESKE = new Set(
  ('the and to of in is he she it that this with for on be are was we you they his her our your their as by at not ' +
    'but or so all who what when said says say from him them us me my i an a there which will would has have had do does ' +
    'did if then than one also into about upon every those these come came truly indeed lord dear brothers').split(' '),
);

// Česte riječi arapske transliteracije (bosanski i engleski način pisanja).
const TRANSLIT = new Set(
  ('ve wa va ala alejhi alayhi alejhim alayhim min fi bi la illa ilahe ilaha inne inna innallahe innallaha innel innal ' +
    'hamde hamda lillahi lillah nahmeduhu nahmaduhu neste\'inuhu nasta\'inuhu nestagfiruhu nastaghfiruhu ne\'uzu na\'udhu neuzu billahi ' +
    'šururi shururi enfusina anfusina sejjiati sayyi\'ati a\'malina men man jehdihillahu yahdihillahu fela fala mudille mudilla leh lah ' +
    'judlil yudlil hadije hadiya ešhedu ash-hadu ashhadu enne anna muhammeden muhammadan abduhu resuluh rasuluh resuluhu rasuluhu ' +
    'vahdehu wahdahu šerike sharika erselehullahu arsalahullahu bil-hakki beširen bashiran neziren nadhiran ' +
    'kale qala kala te\'ala ta\'ala kitabihil-kerim kitabihil-karim ja ya ejjuhellezine ayyuhal-ladhina amenu amanu ' +
    'ttekullahe ittaqullaha hakka haqqa tukatihi tuqatihi temutunne tamutunna entum antum muslimun emma amma ba\'d ' +
    'bismillahir-rahmanir-rahim bismillahirrahmanirrahim rahman rahim rabbi rabbena rabbana rabbel-alemin rabbil-alamin ' +
    'salatu selamu salamu ves-salatu ves-selamu was-salatu was-salamu resulillah rasulillah nebijjina nabiyyina sahbihi ' +
    'edžmein edžma\'in ajma\'in sadekallahul-azim sadaqallahul-azim barekallahu barakallahu lekum lakum fil-kur\'anil-azim ' +
    'ekulu aqulu kavli qawli haza hadha estagfirullahe astaghfirullaha festagfiruhu fastaghfiruhu innehu innahu huvel huwal ' +
    'allahumme allahumma salli sallim barik ibrahime ibrahima alihi alihit-tajjibinet-tahirin kema kama ' +
    'qala kitabihi kitabihil kerim karim ema sadekallahul-azim sadaqallahul-azim sadekallahul sadaqallahul ba\'du ' +
    'innellahe innallahe rabbuna rabbena jehdi yahdi kulli kullihi lev law kerihe kariha kerihel-kafirun kerihel-mušrikun ' +
    'ridvanullahi ridwanullahi edžmein ajmain sejjidina sayyidina mevlana mawlana nebijju nabiyyu nebijjina').split(' '),
);

const jeTranslitRijec = (x) =>
  TRANSLIT.has(x) ||
  /^(el|al|l|ul|il|er|ar|es|as|en|an|et|at|ed|ad|ez|az|eš|ash|bil|fil|bir|lil|vel|wal|ves|was|ve|wa)-/.test(x) ||
  /-(azim|alemin|alamin|rahim|kerim|karim|kafirun|mušrikun)$/.test(x.replace(/'/g, '')) ||
  /^\w+'\w+$/.test(x) && /^(ba'd|te'ala|ta'ala|a'malina|ne'uzu|na'udhu|neste'inuhu|nasta'inuhu)$/.test(x);

const rijeci = (t) =>
  t
    .toLowerCase()
    .replace(/[„“”"«»().,;:!?…–—]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^\[.*\]$/.test(w));

/** Vrsta teksta: 'ar' (arapsko pismo), 'translit' (arapski latinicom), 'oznaka', 'bs', 'mjesovito'. */
export function vrstaTeksta(t) {
  const tekst = String(t || '').trim();
  if (!tekst || OZNAKE.test(tekst)) return 'oznaka';
  const ar = (tekst.match(ARAPSKA_SLOVA) || []).length;
  const lat = (tekst.match(LATINICA) || []).length;
  if (ar && ar > lat * 2) {
    // arapski tekst sa bosanskom rečenicom („Molim Njega Uzvišenog da nas sastavi u Džennetu. آمين…“)
    const lw = rijeci(tekst.replace(/[\u0600-\u06FF]+/g, ' '));
    const bosRijeci = lw.filter((x) => BOSANSKE.has(x) || ENGLESKE.has(x)).length;
    const neTranslit = lw.filter((x) => !jeTranslitRijec(x)).length;
    if ((lw.length >= 4 && bosRijeci >= 2) || (bosRijeci >= 1 && neTranslit >= 2)) return 'mjesovito';
    return 'ar';
  }
  const w = rijeci(tekst.replace(/[؀-ۿ]+/g, ' '));
  const bezNejasno = tekst.replace(/\[nejasno[^\]]*\]/gi, '').trim();
  if (!bezNejasno) return 'oznaka';
  if (!w.length) return ar ? 'ar' : 'oznaka';
  const bos = w.filter((x) => BOSANSKE.has(x) || ENGLESKE.has(x)).length;
  const tr = w.filter((x) => jeTranslitRijec(x)).length;
  // kratke formule („Emma ba'd.“, „Sadekallahul-azim.“)
  if (w.length <= 3 && tr >= 1 && !bos) return ar ? 'mjesovito' : 'translit';
  if (w.length >= 3 && tr / w.length >= 0.35 && (bos === 0 || (w.length >= 20 && bos / w.length < 0.05))) return ar ? 'mjesovito' : 'translit';
  if (ar) return 'mjesovito';
  if (tr >= 4 && tr / w.length >= 0.2) return 'mjesovito';
  return 'bs';
}

/** Udio latiničnih riječi koje izgledaju kao arapska transliteracija (0–1). */
export function udioTranslit(t) {
  const w = rijeci(String(t || '').replace(/[؀-ۿ]+/g, ' '));
  if (!w.length) return 0;
  return w.filter((x) => jeTranslitRijec(x)).length / w.length;
}

/** Segmenti sirovog whisper JSON-a (-oj) kao { od, do, tekst } u sekundama. */
export function sirovISegmenti(sirovo) {
  return (sirovo?.transcription || [])
    .map((s) => ({ od: s.offsets.from / 1000, do: s.offsets.to / 1000, tekst: String(s.text || '').replace(/\s+/g, ' ').trim() }))
    .filter((s) => s.do > s.od);
}

/** true = segment je jasan bosanski govor (dovoljno gust tekst bez arapskog/transliteracije). */
export function jeBosanski(s) {
  const v = vrstaTeksta(s.tekst);
  if (v !== 'bs') return false;
  const duz = s.do - s.od;
  return !(duz >= 6 && rijeci(s.tekst).length / duz < 0.6);
}

/**
 * Kandidatski dijelovi snimka za arapski prolaz: sve što u bosanskom prolazu NIJE jasan bosanski
 * govor — oznake, arapsko pismo, transliteracija, „progutani“ dijelovi (malo riječi na dugo vrijeme)
 * i rupe između segmenata (≥ 3 s; na početku ~3 min i kraju ~2 min snimka već od 1,5 s, jer su tu
 * uvod i završetak hutbe). Gleda i fine segmente sirovog izlaza (`sirovi`), ako postoje.
 * @param {{od:number, do:number, tekst:string}[]} segmenti  bosanski (automatski ili lektorisani) segmenti
 * @param {number} trajanje  dužina snimka u sekundama
 * @param {{od:number, do:number, tekst:string}[]} [sirovi]  fini segmenti bosanskog prolaza
 * @returns {{od:number, do:number, razlog:string[]}[]}
 */
export function kandidati(segmenti, trajanje, sirovi = [], { pocetak = 200, kraj = 130, pad = 1, rupa = 3, rupaRub = 1.5 } = {}) {
  const T = trajanje || (segmenti.length ? segmenti[segmenti.length - 1].do + 5 : 0);
  const r = [];
  const dodaj = (od, d, razlog) => {
    od = Math.max(0, od - pad);
    d = Math.min(T || d + pad, d + pad);
    if (d - od >= 1.5) r.push({ od, do: d, razlog: [razlog] });
  };
  const naRubu = (t) => t < pocetak || t > T - kraj;
  for (const izvor of [segmenti, sirovi]) {
    if (!izvor?.length) continue;
    let prev = 0;
    for (const s of izvor) {
      const prag = naRubu(prev) || naRubu(s.od) ? rupaRub : rupa;
      if (s.od - prev >= prag) dodaj(prev, s.od, 'rupa');
      if (!jeBosanski(s)) dodaj(s.od, s.do, vrstaTeksta(s.tekst) === 'bs' ? 'rijetko' : vrstaTeksta(s.tekst));
      prev = Math.max(prev, s.do);
    }
    if (T && T - prev >= rupaRub) dodaj(prev, T, 'rupa');
  }
  r.sort((a, b) => a.od - b.od);
  const out = [];
  for (const k of r) {
    const z = out[out.length - 1];
    if (z && k.od <= z.do + 2) {
      z.do = Math.max(z.do, k.do);
      for (const x of k.razlog) if (!z.razlog.includes(x)) z.razlog.push(x);
    } else out.push({ ...k, razlog: [...k.razlog] });
  }
  return out.map((k) => ({ od: Math.round(k.od * 100) / 100, do: Math.round(k.do * 100) / 100, razlog: k.razlog }));
}

// Poznate whisper halucinacije kod -l ar (najčešće na bosanskom govoru ili tišini).
const HALUCINACIJE_AR = [
  /اشتركوا في القناة/,
  /اشترك(وا)? (في|ب)/,
  /لا تنسوا الاشتراك/,
  /شكرا (لكم )?(على|ل)(ل)?(مشاهدة|المشاهدة)/,
  /ترجمة|نانسي قنقر|المترجم|تدقيق/,
  /^\s*(موسيقى|موسيقي|تصفيق)\s*$/,
  /^\s*[.\-…!؟?]*\s*$/,
];

/** true = segment arapskog prolaza je smeće (halucinacija, nema arapskih slova, petlja). */
export function jeSmeceAr(tekst) {
  const t = String(tekst || '').trim();
  if (!t) return true;
  if (HALUCINACIJE_AR.some((r) => r.test(t))) return true;
  const ar = (t.match(ARAPSKA_SLOVA) || []).length;
  const lat = (t.match(LATINICA) || []).length;
  if (ar < 4 || lat > ar) return true;
  if (/[\u0400-\u04FF]/.test(t)) return true; // ćirilica = bosanski govor napisan „arapskim“ modelom
  // petlja: ista riječ ponovljena 5+ puta
  const w = normAr(t).split(' ').filter(Boolean);
  if (w.length >= 8 && new Set(w).size / w.length < 0.25) return true;
  return false;
}

/** Jezici koji znače „ovo je bosanski govor“ kod whisperove detekcije jezika. */
export const SLAVENSKI = new Set(['bs', 'hr', 'sr', 'sl', 'mk', 'bg', 'ru', 'uk', 'pl', 'cs', 'sk', 'be']);

/** Arapski segment je prihvaćen ako detekcija jezika nije sigurno slavenska. */
export const jeArapskiGovor = (lid) => !lid || !(SLAVENSKI.has(lid.jezik) && lid.p >= 0.4);

export { POZNATI };
