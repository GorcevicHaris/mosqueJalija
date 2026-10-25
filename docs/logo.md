# Logo — Džamija na Jaliji

Originalni vektorski znak i lockup za sajt. Fajlovi su u `public/logo/`, a Astro komponenta je u
`src/components/ui/Logo.astro`. Ovim nisu dirani postojeći fajlovi sajta. Integraciju radi orkestrator
(koraci su u odjeljku 6).

## 1. Kako džamija izgleda (istraživanje)

Pregledane su fotografije sa svečanog otvaranja 8. 3. 2024. i javne profilne slike na mrežama. Fotografije
su korištene samo kao referenca i nisu kopirane u projekat.

| Izvor | Šta pokazuje |
|---|---|
| https://mesihat.org/2024/03/08/svecano-otvorena-dzamija-na-jaliji/ (naslovna `dzamija-jalija.jpg` + galerija od ~30 fotografija) | snimak iz drona cijele zgrade i munare, krupni planovi vrha munare, unutrašnjost |
| https://sandzak.tv/svecano-otvorena-dzamija-na-jaliji/ | ista naslovna fotografija; tekst kaže da zgrada ima „4 kata“ |
| YouTube kanal https://www.youtube.com/@D%C5%BEamijanaJaliji (avatar kanala, og:image) | **fotografija** zgrade iz drona, a ne logo |
| Facebook stranica https://www.facebook.com/p/D%C5%BEamija-na-Jaliji-61557235081713/ (og:image) | **fotografija** vrha munare, a ne logo |
| Instagram https://www.instagram.com/dzamija_na_jaliji/ | javni og:image nije dostupan bez prijave |

**Postojeći logo nije pronađen.** Na YouTubeu i Facebooku profilne slike su fotografije zgrade i munare.
Raniji istraživač je zabilježio „stilizovanu kupolu“ na plakatima, ali takav znak nije pronađen ni na
jednom javnom kanalu. Uz to, **džamija nema kupolu**, pa bi kupola na znaku bila pogrešna.

**Arhitektura (prema fotografijama):**

- **Tip: kuća-džamija** u tradicionalnom osmansko-balkanskom (novopazarsko-sarajevskom) stambenom
  stilu. Volumen je kubičan, bijeli, sa **četvorovodnim krovom od crvenog crijepa** i širokom strehom.
  **Nema kupole.**
- **Doksat (erker):** na prednjoj fasadi lijevi dio gornjih spratova je istaknut i ima **vlastiti mali
  krović od crijepa** ispod glavne strehe. Na njemu su **tri visoka prozora s polukružnim lukom**, a
  ispod njih red pravougaonih prozora. Doksat nose drvene konzole (kijaci).
- Desni dio fasade ima lučne prozore na vrhu i pravougaone ispod njih. Nad ulazom je **mala
  nadstrešnica od crijepa**. Prizemlje je obloženo svijetlim kamenom (sokl).
- Zgrada ima 4 etaže, s tamnim (drvenim) okvirima prozora.
- **Munara (jedna)** stoji uz lijevi zadnji ugao zgrade. **Stablo je vitko, bijelo i cilindrično**, s
  profilisanim prstenom. Iznad prstena je **zatvoreno drveno šerefe** (smeđe, vertikalne daske), pa
  **otvoreni drveni fenjer** sa stubovima i zvučnicima. Na vrhu je **visok, oštar, kupasti
  (osmougaoni) drveni krov** sa strehom, a na njemu **alem od 3–4 nanizane kugle, bez polumjeseca**.
- Unutrašnjost ima tirkizni tepih, drvene mušebak-rešetke s motivom osmokrake zvijezde (girih), drveni
  mihrab i mimber, bijele zidove i lučne prozore.

## 2. Dizajnerska ideja

- **Okvir: osmokraka zvijezda (hatam)**, ista kao `StarEmblem` i ornamenti sajta. Time znak ostaje u
  postojećem vizuelnom jeziku. Polje je tamni smaragd, a rub zlatan, uz tanku unutrašnju zlatnu liniju.
  U donjem kraku je mala zlatna rozeta (osmokraka zvijezda s probojem).
- **Unutra je prepoznatljiva silueta OVE zgrade**, a ne generička džamija s kupolom:
  - munara lijevo, u krem boji, sa zlatnim drvenim dijelovima: alem od kugli, kupasti krov s
    povijenom strehom, fenjer sa 3 stuba, zatvoreno šerefe i profilisani prsten;
  - kuća-džamija s **niskim četvorovodnim zlatnim krovom**, **doksat s vlastitim krovićem i 3 lučna
    prozora**, desni dio s lučnim prozorima, nadstrešnica nad ulazom i diskretne konzole ispod
    doksata;
  - zlatna linija tla.
- Boje odgovaraju materijalima: krem = bijeli malter, zlatna = crijep i drvo munare, smaragd = boja
  brenda.
- Namjerno **nema polumjeseca na alemu** (ni stvarna munara ga nema) i **nema arapskog teksta**.
  Arapski naziv džamije nije potvrđen.
- **Tri nivoa detalja:** pun crtež (≥ 40 px), pojednostavljen (24–40 px) i poseban **favicon crtan na
  mreži 32×32** (2 jedinice = 1 px na 16 px). Favicon zato ostaje oštar na 16 i 32 px. Na faviconu nema
  zvijezde jer bi na 16 px bila samo šum: ostaje munara s fenjerom, krov, zid s tri prozora i vrata, na
  smaragdnoj pločici.
- **Wordmark:** „Džamija na Jaliji“ je u Fraunces (opsz 96, wght 560, SOFT 40), a „NOVI PAZAR“ u
  Manrope 700 s razmakom slova 0,3 em, u zlatnoj boji, uz tanku zlatnu liniju. U samostalnim SVG
  fajlovima tekst je pretvoren u putanje, pa ne zavise od fonta. Komponenta koristi živi tekst
  (`var(--font-serif)`, `var(--font-sans)`).

Pregled je iteriran pet puta (veličine 16/32/64/128/512 px na kremu, smaragdu i tamnoj pozadini):
pojednostavljen je doksat, uklonjeni su „zubi“ konzola, dodata je rozeta, a favicon je prebačen na
pikselsku mrežu i dobio je tanje stablo munare.

## 3. Fajlovi (`public/logo/`)

| Fajl | Namjena |
|---|---|
| `logo-znak.svg` | glavni znak (kvadrat, providna pozadina; smaragdno polje + zlatni rub, radi na svijetloj i tamnoj pozadini) |
| `logo-znak-inverse.svg` | znak za smaragdne zone (bez polja, svjetlija zlatna `#d8b25a`) |
| `logo-znak-mono.svg` | jednobojni znak (`currentColor`; za pečat, vez, gravuru, štampu u jednoj boji) |
| `logo-horizontalni.svg` | znak + „Džamija na Jaliji“ + „NOVI PAZAR“ (tekst kao putanje), za svijetlu pozadinu |
| `logo-horizontalni-inverse.svg` | isto, krem tekst, za smaragdnu pozadinu |
| `favicon.svg` | favicon (pločica 32×32, puna pozadina) |
| `favicon.ico` | ICO sa 16, 32 i 48 px (PNG unutar ICO) |
| `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | rasterski favicon |
| `apple-touch-icon-180.png` | iOS ikona (neprovidna) |
| `icon-192.png`, `icon-512.png` | PWA ikone, **maskable-safe**: puna smaragdna pozadina, znak u centralnih 76 % |
| `icon-maskable.svg` | vektorski izvor PWA ikone |
| `logo-znak-512.png`, `logo-znak-1024.png` | rasterski znak, providna pozadina (dokumenti, mreže, JSON-LD `logo`) |
| `og-logo-1200x630.png` | slika za dijeljenje: smaragd s blagim gradijentom, suptilna mreža osmokrakih zvijezda, tanak zlatni okvir, znak i wordmark |

Komponenta: `src/components/ui/Logo.astro`.

## 4. Boje

| Uloga | Hex |
|---|---|
| Smaragd (polje, pozadine) | `#0c3b2e` |
| Zlatna (rub, krovovi, drvo munare) | `#c9a24a` |
| Svjetlija zlatna (na smaragdu) | `#d8b25a` |
| Krem (zidovi, munara) | `#f7f1e3` |
| Tekst wordmarka (svijetla pozadina) | `#0c3b2e` |
| „NOVI PAZAR“ (svijetla pozadina) | `#8a6a22` |

U komponenti se boje čitaju iz tokena teme: polje iz `--inverse-bg` (u tamnoj temi je tamnije), zlatna
iz `--color-accent-bright` (u `.theme-inverse` iz `--inverse-accent`), tekst iz `--color-text`, a „Novi
Pazar“ iz `--color-accent`. Sve se može prepisati varijablama `--logo-field`, `--logo-gold`,
`--logo-cream`, `--logo-ink` i `--logo-city`. Polje namjerno **ne koristi `--color-primary`**, jer je ono u
tamnoj temi svijetla menta (`#52c49b`) i znak bi izgubio kontrast s krem zgradom.

## 5. Pravila upotrebe

- Ne mijenjati proporcije, ne rotirati, ne dodavati sjene ni efekte, ne mijenjati boje izvan palete.
- Zaštitni prostor oko znaka je najmanje 1/8 njegove širine.
- Minimalna veličina punog znaka je 24 px. **Ispod 24 px koristiti samo favicon.**
- Horizontalni lockup koristiti od 32 px visine naviše. Ispod toga ide samo znak.
- Na smaragdnoj ili tamnoj pozadini koristiti `inverse` varijantu (ili `logo-*-inverse.svg`).
- Na fotografijama znak ide na mirnu, tamnu površinu, nikad preko detaljne slike.
- Na znak se ne dodaje polumjesec, kupola ni arapski tekst, osim ako džamija ne potvrdi tačan arapski
  naziv.

### Komponenta `Logo.astro`

```astro
---
import Logo from '../ui/Logo.astro';
---
<Logo />                                    <!-- znak 44 px, role="img", title "Džamija na Jaliji" -->
<Logo variant="horizontalni" size={48} />   <!-- znak + živi tekst -->
<Logo size={52} inverse />                  <!-- za .theme-inverse / smaragd -->
<Logo size={42} decorative />               <!-- unutar linka koji već ima tekst: aria-hidden -->
```

Props: `variant?: 'znak' | 'horizontalni'`, `size?: number` (visina znaka u px; ispod 40 px se
automatski crta pojednostavljena verzija), `inverse?: boolean`, `decorative?: boolean`, `class?: string`.

## 6. Integracija (za orkestratora)

**A. Zamjena fajlova u `public/`** (putanje na sajtu ostaju iste; base je `/mosqueJalija/`):

```sh
cp public/logo/favicon.svg               public/favicon.svg
cp public/logo/favicon.ico               public/favicon.ico
cp public/logo/apple-touch-icon-180.png  public/apple-touch-icon.png
cp public/logo/icon-192.png              public/icon-192.png
cp public/logo/icon-512.png              public/icon-512.png
cp public/logo/og-logo-1200x630.png      public/og-image.png
```

`manifest.webmanifest` može ostati kakav jest: nazivi su isti, a ikone su sigurne za `"any maskable"`.
`BaseLayout.astro` (redovi 93–95) već upućuje na `favicon.svg`, `favicon.ico` i `apple-touch-icon.png`,
pa nije potrebna promjena. Preporuka je da se u JSON-LD (`BaseLayout.astro`, red 58)
`logo: url('/favicon.svg')` zamijeni sa `url('/logo/logo-znak-512.png')`, jer Google za `logo` traži
raster od najmanje 112 px.

**B. Zamjena `StarEmblem` sa `<Logo />`:**

- `src/components/layout/Header.astro`, red 39: umjesto `<StarEmblem size={42} class="brand__emblem" />`
  staviti `<Logo size={42} decorative class="brand__emblem" />`. Import je
  `import Logo from '../ui/Logo.astro';`. Tekst brenda pored znaka ostaje, a `decorative` sprečava da
  čitač ekrana dvaput pročita naziv.
- `src/components/layout/Footer.astro`, red 56 (footer je `.theme-inverse`): umjesto
  `<StarEmblem size={52} />` staviti `<Logo size={52} inverse decorative />`.
- `src/pages/404.astro`, red 11: `<Logo size={90} />` (nije u linku, pa ostaje `role="img"` s naslovom).
- `src/pages/index.astro`, red 180 (ornament u luku, `aria-hidden` kontejner):
  `<Logo size={150} inverse decorative />`. Red 75 (mali znak uz naslov vaktije) može ostati
  `StarEmblem`, jer je to čisto dekorativna zvijezda, a ne logo.
- `StarEmblem.astro` ostaje za ornamente; ne treba ga brisati.

**C. Opcionalno:** za print ili PDF materijale koristiti `logo-horizontalni.svg`, a za mreže (avatar)
`logo-znak-1024.png` ili `icon-512.png`.
