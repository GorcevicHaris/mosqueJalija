# Transkripti predavanja (automatski)

Svako predavanje/hutba ima tekstualni transkript koji se prikazuje na stranici predavanja
(`/predavanja/<id>`, sekcija „Automatski transkript“) i koji se može pretraživati.
YouTube za ove snimke nema titlove ni automatske titlove, pa se govor pretvara u tekst
**lokalno**, na računaru, alatom [whisper.cpp](https://github.com/ggml-org/whisper.cpp).

## Gdje je šta

| Putanja | Namjena |
|---|---|
| `data/transkripti/<id>.json` | gotov automatski transkript (ide u repozitorij) |
| `data/transkripti-lektura/<id>.json` | lektorisana verzija (isti format + `"lektorisano": true`); **ima prednost** nad automatskom; skripta za transkripciju je nikad ne dira |
| `scripts/transkripcija/transkribuj.mjs` | preuzimanje zvuka + whisper + obrada (Node, bez npm paketa) |
| `scripts/transkripcija/obrada.mjs` | čišćenje i spajanje segmenata u pasuse |
| `src/lib/transkripti.ts` | čitanje transkripata pri buildu (`getTranskript(id)`, `transkriptiZaPretragu()`) |
| `src/lib/transkripti-pretraga.ts` | pretraga u pregledaču (lijeno učitavanje JSON-a) |
| `src/components/predavanja/Transkript.astro` | prikaz na stranici predavanja |
| `src/pages/pretraga-transkripti.json.ts` | endpoint `/pretraga-transkripti.json` za pretragu |
| `~/Library/Caches/jalija-transkripcija/` | radni folder VAN projekta: modeli, zvuk, sirovi whisper izlaz (**ne commit-ovati**) |

Format `data/transkripti/<id>.json`:

```json
{
  "id": "tb5geb6Gxcg",
  "jezik": "bs",
  "model": "large-v3-turbo",
  "generisano": "2026-10-25T01:07:10.000Z",
  "automatski": true,
  "segmenti": [ { "od": 97, "do": 123.2, "tekst": "…" } ]
}
```

`od`/`do` su sekunde od početka snimka. Segmenti su pasusi od ~15–40 s.

## Potrebno (jednom)

macOS sa Apple Silicon čipom (M1–M4) — whisper koristi GPU (Metal).

```sh
brew install ffmpeg whisper-cpp yt-dlp
mkdir -p ~/Library/Caches/jalija-transkripcija/models
cd ~/Library/Caches/jalija-transkripcija/models
# model za prepoznavanje govora (~1,6 GB)
curl -L -o ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin
# VAD model (~1 MB) — preskače tišinu, smanjuje "izmišljene" rečenice
curl -L -o ggml-silero-v5.1.2.bin https://huggingface.co/ggml-org/whisper-vad/resolve/main/ggml-silero-v5.1.2.bin
```

Ako `yt-dlp` nije u PATH-u: `YTDLP=/putanja/do/yt-dlp node scripts/transkripcija/transkribuj.mjs`.

## Komande

```sh
# svi videi koji još nemaju transkript (najnoviji prvo) — npr. poslije sedmičnog `npm run update-videos`
node scripts/transkripcija/transkribuj.mjs

# samo određeni video(i)
node scripts/transkripcija/transkribuj.mjs --id tb5geb6Gxcg --id zViIQjXeAd8

# najviše N videa
node scripts/transkripcija/transkribuj.mjs --limit 3

# ponovo transkribuj i kad transkript postoji
node scripts/transkripcija/transkribuj.mjs --force --id tb5geb6Gxcg

# samo ponovo pokreni obradu (npr. nakon izmjene obrada.mjs) — bez ponovnog prepoznavanja govora;
# prepisuje gotove fajlove u data/transkripti/ (lektura ostaje netaknuta) — po pravilu uz --id
node scripts/transkripcija/transkribuj.mjs --samo-obrada
```

Skripta je nastavljiva: prekinite je (Ctrl+C) i pokrenite ponovo — preskače gotove videe.
Zvuk (`.m4a`) ostaje u radnom folderu (keš), `.wav` se briše nakon obrade (`--zadrzi-audio` ga čuva).
Promjenljive okruženja: `WHISPER_MODEL` (npr. `ggml-large-v3.bin`), `WHISPER_JEZIK` (podrazumijevano `bs`),
`WHISPER_PROMPT`, `JALIJA_TRANSKRIPCIJA_DIR`.

## Postavke i trajanje

- Model `large-v3-turbo`, jezik `bs`, beam search 5, `--max-context 0`, Silero VAD
  (`-vt 0.45 -vsd 500 -vp 200 -vmsd 28`), potiskivanje ne-govornih tokena (`-sns`).
- Testirano na snimku od 11 min: `bs` i `hr` daju gotovo isti tekst; `bs` ostavlja arapske dove
  arapskim pismom i bolje piše „Muhammed“, pa je izabran `bs`. Pohlepno dekodiranje (`-bs 1`) je
  ~40 % brže, ali daje tekst bez interpunkcije i velikih slova. `--max-context 64` je na početku hutbe
  ušao u petlju („Assalamualaikum…“ 12 puta) i izgubio prvi minut — zato `0`.
- Brzina na Apple M4: **~7–8× brže od stvarnog vremena** (sat snimka ≈ 8 min). Svih 81 videa
  (~20 h snimka) ≈ 2,5–3 h. Novi sedmični video od 15–60 min: 2–8 min.

## Kvalitet — šta očekivati

- Bosanski/srpski govor: uglavnom razumljiv i tačan, dobra interpunkcija. Česte greške: dijalekatske
  riječi, imena i arapski izrazi napisani fonetski („hajli“ umjesto „hajr“, „hudba“ umjesto „hutba“),
  pokoja pogrešno čuta riječ.
- Arapski (uvod hutbe, ajeti, hadisi, dove): whisper ih ponekad prepiše arapskim pismom (to se
  zadržava), ponekad latiničnom transkripcijom, a ponekad „proguta“ cijeli dio. Dug segment sa
  svega par riječi zamjenjuje se oznakom **`[arapski / nije transkribovano]`** (ništa se ne izmišlja).
- Obrada (`obrada.mjs`) uklanja poznate whisper halucinacije („Hvala na gledanju“, „Pretplatite se“,
  titl-potpise, [Muzika]), ponovljene redove i petlje, i ujednačava pisanje: Allah (i padeži),
  Kur'an, Poslanik, Muhammed, „sallallahu alejhi ve sellem“, „subhanehu ve te'ala“, „dželle šanuhu“…
- Snimci bez govora (npr. `WA79h85BTKU` — nijem zvuk, `eTjV_BlQIqk` — 16 s bez govora) dobijaju fajl sa
  praznim `segmenti: []`: skripta ih više ne obrađuje, a stranica ne prikazuje sekciju transkripta.
- Na stranici stoji jasna napomena da je tekst mašinski i da je mjerodavan video.

## Ručna ispravka transkripta

Ako postoji `data/transkripti-lektura/<id>.json`, sajt prikazuje nju (naslov sekcije
„Automatski transkript (lektorisan)“), pa ispravke unosite tamo; inače u `data/transkripti/<id>.json`.

1. Otvorite odgovarajući fajl u editoru i ispravite `"tekst"` u segmentima
   (vremena `od`/`do` ne dirajte, osim ako ne spajate/dijelite segmente).
2. Postavite `"automatski": false` i po želji `"ispravio": "Ime Prezime"`.
   Tada se na stranici umjesto upozorenja prikazuje „Transkript je ručno pregledan“, a skripta
   **nikad više ne prepisuje** taj fajl (ni sa `--force` ni sa `--samo-obrada`).
3. Segment možete obrisati (npr. besmislen dio) ili tekst zamijeniti oznakom u uglastim zagradama,
   npr. `"[učenje Kur'ana: sura El-Asr]"` — oznake se prikazuju sivo i ne ulaze u pretragu.
4. `npm run build` da provjerite.

## Integracija (za održavanje koda)

### Stranica predavanja — `src/pages/predavanja/[id].astro`

```astro
import Transkript from '../../components/predavanja/Transkript.astro';
…
<!-- u .pd__main, poslije sekcije "Opis", prije navigacije kroz seriju -->
<Transkript id={p.id} naslov={punNaslov} />
```

Komponenta ne renderuje ništa ako transkript ne postoji.
Link na odlomak: `/predavanja/<id>#t-<sekunda>` otvara transkript i označava odlomak.

### Premotavanje playera — `src/components/predavanja/YouTubeFacade.astro`

Transkript na klik na vrijeme šalje `window.dispatchEvent(new CustomEvent('jalija:seek', { detail: { sekunde } }))`,
ali samo ako player ima atribut `data-ytf-seek` (inače link otvara YouTube na tom vremenu).
U facade-u:

1. Na korijenski `div` dodati atribut `data-ytf-seek`.
2. U `aktiviraj()` izdvojiti pravljenje iframe-a u funkciju `ucitaj(start)`, dodati `enablejsapi: '1'`
   i `origin: location.origin` u parametre, i slušati događaj:

```ts
const ORIGIN = 'https://www.youtube-nocookie.com';
function ucitaj(start: number) {
  const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', playsinline: '1', enablejsapi: '1', origin: location.origin });
  if (start) params.set('start', String(start));
  const iframe = document.createElement('iframe');
  iframe.src = `${ORIGIN}/embed/${encodeURIComponent(root.dataset.id!)}?${params}`;
  // … title, allow, allowFullscreen, referrerPolicy kao do sada …
  btn!.replaceWith(iframe);
  iframe.focus();
}
btn.addEventListener('click', (e) => {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
  e.preventDefault();
  ucitaj(Number(root.dataset.start) || 0);
});
window.addEventListener('jalija:seek', (e) => {
  const s = Math.max(0, Math.floor(Number((e as CustomEvent<{ sekunde: number }>).detail?.sekunde) || 0));
  const iframe = root.querySelector('iframe');
  if (!iframe) return ucitaj(s); // još nije učitan → učitaj sa start=s&autoplay=1
  const cmd = (func: string, args: unknown[] = []) =>
    iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), ORIGIN);
  cmd('seekTo', [s, true]);
  cmd('playVideo');
});
```

### Pretraga — `src/components/extras/PretragaApp.astro`

Transkripti NISU u ugrađenom indeksu (bio bi ~1 MB). Endpoint `/pretraga-transkripti.json`
(~1 MB, ~350 KB gzip) se učitava tek kad korisnik nešto ukuca:

U `<script>` komponente (testirano):

```ts
import { ucitajTranskripte, pretraziTranskripte } from '../../lib/transkripti-pretraga';

// … unutar `if (root) {`, prije `function render(q)`:
const trBox = document.createElement('section');
trBox.className = 'sr-group';
trBox.setAttribute('aria-labelledby', 'sr-g-tr');
results.after(trBox);
const naslovi = new Map(ix.p.map((p) => [p[0], p[1]] as const));
const vrijeme = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
let trZahtjev = 0;
async function renderTranskripti(upit: string) {
  const moj = ++trZahtjev;
  if (upit.length < 3 || filter !== 'sve') { trBox.innerHTML = ''; return; }
  const podaci = await ucitajTranskripte(import.meta.env.BASE_URL);
  if (moj !== trZahtjev) return; // stigao je noviji upit
  const pog = pretraziTranskripte(podaci, upit, 10).filter((p) => naslovi.has(p.id));
  if (pog.length && !zadnji.length) {
    none.hidden = true;
    status.textContent = `Pronađeno samo u transkriptima predavanja (${pog.length}).`;
  }
  trBox.innerHTML = pog.length
    ? `<h2 class="sr-group__title" id="sr-g-tr">Izgovoreno u predavanjima <span class="badge badge--muted">${pog.length}</span></h2>` +
      `<ol class="sr-list">` +
      pog.map((p) =>
        `<li class="sr-item"><a class="sr-link" href="${esc(saKosomCrtom(`${BASE}/predavanja/${p.id}`))}#t-${p.od}">` +
        `<span class="sr-item__title">${esc(naslovi.get(p.id)!)}</span>` +
        `<span class="sr-item__meta">Transkript · od ${vrijeme(p.od)}${p.broj > 1 ? ` · ${p.broj} mjesta` : ''}</span>` +
        `<span class="sr-item__desc">${oznaci(p.isjecak, upit)}</span></a></li>`).join('') +
      `</ol>`
    : '';
}

// … i kao prvi red u render(q), odmah poslije `const upit = q.trim();`:
renderTranskripti(upit);
```

Link `…/predavanja/<id>/#t-<sekunda>` otvara transkript na stranici predavanja, skroluje do odlomka i označava ga.
Da bi strelice ↑/↓ obuhvatile i ove rezultate, `linkovi()` promijeniti u
`[...root.querySelectorAll<HTMLAnchorElement>('.sr-link')]` (grupa je van `results`, jer se `results.innerHTML` prepisuje).
Opciono: u tekst „Pretražuje se N stavki…“ dodati „i transkripti predavanja“.

Ne uvoziti `src/lib/transkripti.ts` u klijentske skripte (eager `import.meta.glob` bi ugradio sve tekstove u JS).
