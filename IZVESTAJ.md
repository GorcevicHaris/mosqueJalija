# Izvještaj — sajt Džamije na Jaliji

## Ukratko

Za **Džamiju na Jaliji (Jalija 69, Novi Pazar)** napravljen je kompletan sajt po uzoru na arapdzamija.rs.
Ima sve sekcije uzora i niz dodataka. Postoji admin panel iz kojeg urednici mijenjaju sadržaj bez
pristupa kodu.

- **Javni sajt (Vercel):** https://dzamija-na-jaliji.vercel.app/
- **Admin panel:** https://dzamija-na-jaliji.vercel.app/admin/
- **Stara adresa (GitHub Pages):** https://gorcevicharis.github.io/mosqueJalija/ automatski preusmjerava na istu stranicu na Vercel-u, pa svi stari i podijeljeni linkovi vode na Vercel.
- **Repozitorij:** https://github.com/GorcevicHaris/mosqueJalija (javan)
- **Baza:** Supabase projekat `dzamija-na-jaliji` (Frankfurt, besplatni plan)

Rezultati provjere (dva kruga testiranja):
- build sa bazom i bez nje: 124 stranice, 0 grešaka i upozorenja;
- `astro check`: 0 grešaka, 0 upozorenja;
- 0 pokvarenih linkova;
- 0 grešaka pristupačnosti (axe, 35 tipova stranica, obje teme);
- 0 grešaka u konzoli na svih 124 stranice (360, 768 i 1280 px).

Lighthouse na mobilnom:

| Kategorija | Ocjena |
|---|---|
| Performanse | 94–98 |
| Pristupačnost | 100 |
| Dobre prakse | 100 |
| SEO | 100 |

Na objavljenom sajtu, poslije svih izmjena, provjereno je i:
- svih 124 stranice na širini telefona;
- 230 internih linkova;
- 27 kombinacija filtera predavanja (brojevi se tačno poklapaju sa podacima);
- admin prijava i prava.

Sve je prošlo. Detalji: `docs/QA-izvjestaj.md`.

**YouTube kanal:** u zadatku je umjesto linka stajalo „[UBACI LINK]“. Korišten je kanal koji si dao u
razgovoru: https://www.youtube.com/@D%C5%BEamijanaJaliji (ID kanala `UCyw1ppQVijYlaQ6BicgZTVg`).

## Šta sajt ima

### Stranice
| Stranica | Sadržaj |
|---|---|
| **Početna** | Kaligrafija Bismille, naslovna fotografija, današnja vaktija sa odbrojavanjem, „Danas u džamiji“, najnovija predavanja i obavještenja, ajet/hadis dana, upis i Pitaj imama, donacije |
| **O džamiji, Galerija** | Historija sa izvorima (vakuf, gradnja, otvaranje 8. 3. 2024.), činjenice i 16 fotografija sa zaslugama |
| **Predavanja (81)** | Filteri po imamu, kategoriji, seriji i godini; pretraga bez dijakritika; sortiranje; „Učitaj još“. Svi filteri su u URL-u, pa se link može podijeliti |
| **Stranica predavanja** | Jednostavna: naslov, video i ispod njega **cijeli transkript** sa vremenskim oznakama (klik premota video), dugme **Bosanski / English** (prevod transkripta), prethodni/sljedeći dio serije |
| **Hutbe** | 36 džumanskih hutbi |
| **Imami (8)** | Profil sa fotografijom, biografijom (sa izvorima) i svim predavanjima |
| **Vaktija** | Računa se lokalno i kalibrisana je prema vaktija.ba (Novi Pazar); mjesečna tabela, štampa, CSV |
| **Islamski kalendar** | Hidžretski datumi i važni dani sa odbrojavanjem |
| **Obavještenja / Objave** | Iz baze; novo obavještenje se na sajtu vidi odmah |
| **Mekteb, Online upis, Raspored, Pitaj imama** | Jednostavne stranice u jednoj koloni: online prijava za mekteb, halke i Školu Kur'ana, sedmični raspored, pitanja imamu sa objavljenim odgovorima |
| **Dove, Kur'an i hadisi, Pravila ponašanja, Učenje Kur'ana, Mediji** | Isto kao na uzoru |
| **Islamski alati** | Kibla kompas (koristi senzor telefona), digitalni tesbih, zekat kalkulator, ramazanska imsakija, podsjetnik za namaz i vaktija u kalendaru telefona |
| **Donacije** | IPS QR kod za uplatu (pojavi se kad se unese račun), kopiranje podataka |
| **Kontakt** | Google Maps mapa i navigacija; poruke se spremaju u bazu, a admin ih čita u inboxu |
| **Pretraga** | Pretražuje cijeli sajt, uključujući izgovoreni tekst svih predavanja |
| **RSS, aplikacija** | RSS za predavanja i obavještenja; sajt se može instalirati na telefon kao aplikacija |

### Admin panel (`/admin`)
U adminu se mijenja **sve** što je sadržaj sajta:
- **traka na vrhu sajta** za hitna obavještenja (npr. dženaza, promjena termina); pojavi se odmah;
- obavještenja i objave sa slikama;
- podaci o džamiji: kontakt, donacije, džuma, društvene mreže, opis, historija i činjenice, naslovna fotografija;
- imami: dodavanje novih, biografija, fotografija;
- galerija;
- dove, ajeti i hadisi;
- **predavanja:** sakrivanje bilo kog videa, ručno dodavanje videa preko YouTube linka, ispravke
  (imam, kategorija, serija, naslov), kategorije i serije;
- **transkripti:** ispravka bilo koje rečenice, na bosanskom i na engleskom, uz „vrati original“;
- **mekteb:** programi za online upis, sedmični raspored;
- **kartice na stranicama:** 14 pravila ponašanja, „Šta djeca uče“, koraci i izvori za učenje Kur'ana;
- **tekstovi stranica:** početna, podnožje, donacije, kontakt, mekteb, pravila, učenje Kur'ana, dove,
  Kur'an i hadisi, mediji, galerija i svi islamski alati;
- inbox za poruke, prijave za upis (sa izvozom u CSV) i pitanja imamu (odgovor i objava);
- urednici, za administratora.

Samo dvije stvari se ne mijenjaju kroz admin, i to namjerno:
- **meni i dizajn sajta**, jer su dio koda;
- **novi videi**: dolaze automatski sa YouTube kanala svakog ponedjeljka, a admin ih može sakriti
  ili dodati ručno.

Kad se nešto sačuva u adminu, nova obavještenja se na sajtu vide odmah. Ostale izmjene se pojavljuju
za ~15–20 minuta, jer se sajt automatski obnavlja iz baze svakih 15 minuta.

Prijava ide samo preko linka na e-mail, bez lozinke. Ulaz je dugme „Admin prijava“ u podnožju sajta, „Admin“ u gornjoj traci i „Admin prijava“ u meniju na telefonu.

**Sigurnost:**
- svaka tabela ima RLS pravila, a Supabase sigurnosna provjera ne prijavljuje upozorenja;
- javnost samo čita sadržaj i šalje obrasce, uz ograničenje 5 poruka na sat po adresi;
- lične podatke iz poruka, prijava i pitanja vide samo urednici.

### Predavanja, transkripti i slike
- **81 video** sa kanala (75 + 6 Shorts), automatski raspoređenih:

  | Kategorija | Broj |
  |---|---|
  | Hutbe | 36 |
  | Tefsir | 25 |
  | Predavanja | 8 |
  | Kratki video | 6 |
  | Učenje Kur'ana | 3 |
  | Halka hadisa | 2 |
  | Ostalo | 1 |

  Serije: Tefsir sure Jusuf (25 dijelova), Duhovna opskrba vjernika (5), Sura El-Kijame (2),
  Djela koja uvode u Džennet (2).
- **Novi videi** se povlače automatski svakog ponedjeljka (GitHub Action).
- **Transkripti:** YouTube nema titlove za ove videe, pa su svi transkribovani lokalno modelom Whisper
  large-v3-turbo (~121.000 riječi), a zatim pažljivo lektorisani: pravopis, ijekavica, imena, islamski
  izrazi. Na sajtu su označeni kao „automatski transkript“.
- **Arapski dijelovi** (početak i kraj hutbe, ajeti, dove, hadisi) su posebno transkribovani na
  arapskom (Whisper large-v3, `-l ar`), ručno provjereni i prikazani zdesna nalijevo, sa harekatima i
  prevodom na bosanski i engleski. Ukupno je 351 arapski segment u 78 videa. Poznate formule i ajeti
  su provjereni prema originalu (sura:ajet).
- **Engleski prevod** cijelih transkripata (dugme „Bosanski | English“), za svih 81 videa.
- **Fotografije:** svih 8 predavača ima portret, izrezan iz kadrova sa YouTube kanala džamije.
  Galerija i naslovna fotografija su iz izvještaja Mešihata sa otvaranja i iz dron-snimaka sa kanala.
- **Logo:** urađen prema stvarnom izgledu džamije: vitka bijela munara sa drvenim kioskom i kupastim
  krovom, kuća-džamija sa crvenim krovom i doksatom, u osmokrakoj zvijezdi. Postojeći logo nije pronađen.

## Odluke koje sam donio
1. **Astro + GitHub Pages + Supabase.** Sajt je statički (brz, siguran, besplatan), a baza služi samo
   za admin i obrasce. Ako baza nije dostupna, sajt i dalje radi sa posljednjom verzijom podataka.
2. **Repozitorij je postao javan** (na tvoje odobrenje), jer GitHub Pages na besplatnom planu ne radi sa
   privatnim repozitorijem. U repozitoriju nema tajni: javni Supabase ključ je javan po dizajnu, a podatke
   štite RLS pravila.
3. **Ijekavica**, kao na uzoru i na kanalu džamije.
4. **Ništa nije izmišljeno.** Nepoznati podaci (e-mail, telefon, račun, vrijeme džume) prikazani su kao
   jasna oznaka „Podatak nedostaje“.
5. **Niko nije označen kao „imam džamije“**, jer to nijedan izvor ne potvrđuje. Hfz. Admir ef. Jašarević
   je naveden kao hatib i predavač (drži 62 od 81 predavanja).
6. Lični brojevi telefona predavača sa plakata za upis **nisu objavljeni**.
7. Prevodi ajeta, hadisa i dova su urađeni po ustaljenim prevodima, sa tačnim izvorima.
8. Sedmični raspored je prepisan iz stvarnih Instagram objava džemata (oktobar 2026.), sa izvorom.
9. **Jednostavan raspored stranica** (na tvoj zahtjev): sadržaj ide u jednoj koloni, odozgo prema
   dolje, sa kraćim tekstom i manjim naslovima kartica. Kartice u mreži ostale su samo za liste
   (predavanja, imami, alati).
10. **Sve mape vode na Google Maps** (ugrađena mapa, navigacija, izvor adrese).

## Prijava u admin i šta je podešeno

Već podešeno:
- **Supabase prijava:** Site URL i redirect adrese za `/mosqueJalija/admin/` (javni sajt) i
  `localhost:4330` (razvoj).
- **Prvi administrator:** harisgorcevic1000@gmail.com.
- **Prijava bez lozinke:** samo link na e-mail (opcija sa lozinkom je uklonjena). U Supabase-u su
  ipak postavljena stroga pravila za lozinke (12+ znakova, slova, brojevi, simboli), za slučaj da se
  lozinke ikad uključe.
- **Ulaz u admin:** dugme „Admin prijava“ u podnožju, „Admin“ u gornjoj traci (desktop) i „Admin
  prijava“ na dnu menija na telefonu. Nije u glavnom meniju, a Google ga ne indeksira.

**Provjereno:** nalog harisgorcevic1000@gmail.com se uspješno prijavio linkom iz e-maila. U bazi je
potvrđeno da ima prava urednika i admina: vidi listu urednika i može da mijenja obavještenja, podatke o
džamiji, raspored i imame (testirano u transakciji koja je poništena). Javnost ne može ni čitati
poruke ni mijenjati sadržaj.

Kako se prijaviti: „Admin prijava“ → upiši e-mail → „Pošalji link za prijavu“ → otvori link iz
e-maila na istom uređaju.

Šta još treba uraditi ti:
1. **Ostali urednici (imam, sekretar).** Supabase-ov ugrađeni e-mail servis šalje samo članovima tvog
   Supabase tima (najviše ~2 e-maila na sat). Da bi im link za prijavu stizao, imaš dvije opcije:
   - **(a)** Dodaj ih kao članove svog Supabase tima (Organization → Team → Invite).
   - **(b)** Podesi besplatni SMTP (npr. Resend ili Brevo) u Authentication → Emails → SMTP Settings.
     Tada prijava linkom radi za sve, a u e-mail šablon se može dodati i šestocifreni kod
     (`{{ .Token }}`). Bez SMTP-a Supabase ne dozvoljava izmjenu šablona.

   U oba slučaja tu adresu dodaj i u adminu, u sekciji „Urednici“.
2. **Vlastiti domen:** kupi domen, pa ga dodaj u Vercel → Settings → Domains (uputstvo u `README.md`).
   Javi mi domen, da ga dodam i u Supabase prijavu.
3. **Deploy Hook:** link je bio vidljiv u razgovoru. Preporuka je da u Vercel → Settings → Git → Deploy
   Hooks napraviš novi i staviš ga u GitHub secret `VERCEL_DEPLOY_HOOK`.

## Šta treba da mi dostavite (džemat)

Sve od ovoga se može unijeti i **direktno u admin panelu**.

### Najvažnije
1. **Kontakt:** zvanični e-mail i telefon džamije.
2. **Donacije:** primalac, banka, broj računa / IBAN. Kad se unesu, sajt sam pravi IPS QR kod za uplatu.
3. **Vrijeme džume** (zimi i ljeti) i vrijeme klanjanja sabaha u džamiji.
4. **Imam džamije:** ime i potvrda uloge (da li je to hfz. Admir ef. Jašarević), kratka biografija.
5. **Dozvole za fotografije:**
   - Galerija i naslovna fotografija su sa sajta Mešihata IZ u Srbiji (otvaranje 2024.), pa treba
     njihova dozvola ili vaše fotografije.
   - Portreti su kadrovi iz vaših videa, pa treba saglasnost predavača.
   - Lista po fotografiji: `docs/slike.md`.

### Sadržaj
6. **Bolje fotografije za dva predavača:** Dženan ef. Kamešničanin i Ferid Fijuljanin (sadašnji
   kadrovi su mutni).
7. **Predavači.** Biografije su istražene i nezavisno provjerene prema stanju u oktobru 2026, a svaka
   tvrdnja ima izvor (tabela: `docs/provjera-imama.md`). Potvrdite:
   - titulu hfz. Abdurahmana ef. Kujevića. Na sajtu je bez „muftija“, jer je Mešihat 19. 2. 2025.
     ukinuo regionalne muftije; danas vodi Vakufsku direkciju;
   - studije hfz. Admira ef. Jašarevića (izvor je samo njegov Instagram) i da li je on imam džamije;
   - da li je hfz. Ferid Fijuljanin imam u Berlinu;
   - sadašnju funkciju Dženana ef. Kamešničanina;
   - osnovne podatke o Muhamedu Metjahiću i Edinu ef. Salihoviću. O njima nema pouzdanih izvora,
     pa su navedeni samo podaci sa kanala.
8. **Mekteb:** dani, termini, uzrasti; potvrda sedmičnog rasporeda halki.
9. **Historija:** kapacitet, arhitekta/izvođač, arapski naziv (ako postoji).
10. Koja je **Facebook stranica** zvanična (pronađene su dvije).
11. **Pregled** prevoda ajeta, hadisa i dova od strane imama.

### Provjera predavanja i transkripata
- `tb5geb6Gxcg` „Ne moraš učiniti svako dobro djelo…“ je označeno kao **predavanje**, a možda je hutba.
  `zOmGidryvss` i `43grkcWOjiQ` nemaju opis, pa provjerite kategoriju.
- 6 kratkih videa od 12. 12. 2025. i „Poklon umra“ **nemaju imama**.
- Datum je datum objave na YouTube-u. Hutbe su obično održane dan ranije.
- **Arapski u transkriptima:** imam treba da presluša 6 mjesta označenih za provjeru: drugi dio hutbe
  u `FBOlD4Vc82E` i `voLOTKD84Vg`, sura El-Felek u `-QKGCdrGiRQ`, En-Neml 19 u `Dnqhzz-b4gw` i ilahija u
  `fZ_cV_h1pcc`. Početak `0NxaZJg1zQA` (0:00–1:09) nije bilo moguće prepoznati. Detalji su u
  `docs/lektura-transkripata.md`.
- **Transkripti:** 253 mjesta su označena kao `[nejasno]`, a sporna mjesta po videu (sa vremenom) su
  u `docs/lektura-transkripata.md`. Preporuka je da imam presluša ta mjesta. Ispravke idu u
  `data/transkripti-lektura/<id>.json`.
- Ispravke predavanja: u adminu (sekcija „Ispravke predavanja“) ili u `data/predavanja-ispravke.json`.

## Dokumentacija
| Fajl | Sadržaj |
|---|---|
| `README.md` | Pokretanje, deploy, osvježavanje videa, admin, transkripcija |
| `docs/ARHITEKTURA.md` | Struktura projekta |
| `docs/analiza-uzora.md` | Analiza arapdzamija.rs |
| `docs/istrazivanje.md` | Podaci o džamiji, sa izvorima |
| `docs/supabase.md` | Baza, sigurnost, admin, urednici |
| `docs/predavanja-podaci.md` | Kako se obrađuju videi |
| `docs/transkripcija.md` | Transkripcija novih videa |
| `docs/lektura-transkripata.md` | Lektura i sporna mjesta |
| `docs/vaktija.md` | Kalibracija vaktije |
| `docs/funkcionalnosti.md` | Opis funkcija |
| `docs/dodaci.md` | Opis dodatnih funkcija |
| `docs/alati.md` | Islamski alati |
| `docs/obrasci.md` | Javni obrasci |
| `docs/slike.md` | Izvori fotografija |
| `docs/logo.md` | Logo i pravila korištenja |
| `docs/QA-izvjestaj.md` | Rezultati testiranja |
