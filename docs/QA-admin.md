# QA admin panela (telefon i računar) — 28. 10. 2026.

Prijava vlasnika: „admin panel na telefonu ne radi kako treba, bukvalno me odvede npr. u galeriju i ne mogu
da uređujem, već je vidim kao običan user“.

Provjereno u `astro dev` sa razvojnim mock-om (`/admin/?qa-mock`, vidi `docs/supabase.md` → „QA: admin bez
prijave“): lažna sesija urednika + baza u memoriji (javni sadržaj pročitan anonimno sa REST-a, privatne tabele
izmišljene). Ekrani 375×812 (mobilni, dodir) i 1280×900, svijetla i tamna tema. Ništa nije upisano u pravu bazu.

## Uzrok problema na telefonu

1. **Javni meni sajta na admin stranici.** Na ekranu užem od 960 px admin nije imao svoju navigaciju osim
   neupadljivog padajućeg polja „Odjeljak“, a odmah iznad je bio javni hamburger-meni sajta (☰), pretraga,
   „Doniraj“, traka i podnožje. Tap na ☰ → „Galerija“ vodi na javnu `/galerija/` — urednik je tada
   „običan posjetilac“. Na računaru se to nije dešavalo jer je lijevo stalno vidljiva lista odjeljaka.
2. **Dugme „Nazad“ napuštalo admin.** Promjena odjeljka i otvaranje forme nisu pravili unos u istoriji
   (`history.replaceState`), pa je sistemsko „Nazad“ na telefonu (ili pokret prevlačenja) izlazilo iz
   `/admin/` na prethodnu javnu stranicu — npr. `/galerija/` sa koje je urednik došao.

## Popravke (zajedničke)

- Na `/admin/` je javna navigacija sakrivena (topbar, traka, meni, pretraga, lokacija, Doniraj, podnožje);
  ostaju logo i promjena teme. `AdminApp.astro` postavlja `data-adm-stranica` na `<html>`.
- Telefon/tablet: ljepljiva traka **„☰ Odjeljak: …“** ispod zaglavlja (uvijek vidljiva pri skrolovanju), otvara
  ladicu (`<dialog>`) sa svim odjeljcima po grupama, brojačima Inboxa i linkom „Otvori javni sajt u novoj
  kartici“. Na dugmetu je ukupan broj novih stavki u Inboxu.
- Istorija (`src/components/admin/istorija.ts`): svaki odjeljak je unos u istoriji, otvorena forma još jedan.
  „Nazad“ zatvara formu (uz pitanje ako ima nesačuvanih izmjena — „Ne“ ostavlja formu otvorenu), pa vraća na
  prethodni odjeljak; tek iz prvog odjeljka izlazi sa admina. Isto za prečice (Predavanja → Dodaj video / Uredi
  podatke).
- Duge forme: dugmad **Sačuvaj / Odustani** su ljepljiva na dnu ekrana u svim formama (CRUD, Ispravke,
  Transkripti, Podaci o džamiji).
- Obavijest (toast) na telefonu je iznad ljepljive trake (ne prekriva „Sačuvaj“) i sklanja se tapom.
- Dodirni ciljevi ≥ 44 px na ekranima na dodir (ikonice ↑ ↓ ✕, mala dugmad, kvadratići, ▶ u transkriptu).
- Prelazak na drugi odjeljak na telefonu vraća prikaz na vrh odjeljka.
- Filteri lista više ne zamjenjuju opcije pri svakom fokusu (na iPhone-u je to moglo zatvoriti izbornik).

## Po odjeljcima

Za svaki: lista se učitava, „+ Novo“ i „Uredi“ otvaraju formu, nema horizontalnog skrola na 375 px, „Sačuvaj“
radi (toast), „Nazad“/„Odustani“ vraća na listu, greške (RLS, mreža, istekla sesija, 500) se prikazuju razumljivo.

| Odjeljak | Stanje | Napomena |
|---|---|---|
| Obavještenja i objave | OK + popravljeno (navigacija, ljepljivo Sačuvaj) | validacija obaveznih polja + fokus na prvo neispravno; pregled; slika |
| Aktivnosti (više slika) | OK | otpremanje 3 slike odjednom (smanjenje → WebP), ← → redoslijed, ✕, „naslovna“; greška 413 uz polje; objava bez teksta i slika odbijena |
| Citati i pouke | OK | arapski tekst RTL, slika |
| Galerija | OK + popravljeno | ovo je bio odjeljak iz prijave: sad ostaje u adminu; jedna slika (Izaberi sliku…) i „Dodaj više slika…“; ↑ ↓; brisanje |
| Imami i predavači (bio) | OK | spoj `imami` + `imami_bio`, izvori (niz), fotografija |
| Podaci o džamiji | OK | uklj. **Donacije e-mail/telefon** (provjera e-maila), ljepljivo „Sačuvaj“ |
| Dove | OK | ↑ ↓ (provjereno), brisanje, arapski RTL |
| Ajeti i hadisi | OK | |
| Predavanja (sakrij/dodaj/ispravke) | OK + popravljeno | Sakrij/Prikaži; „+ Dodaj video“ → Dodani videi (YouTube link); „Uredi podatke“ → Ispravke; „Nazad“ vraća na Predavanja |
| Dodani videi | OK | provjera YouTube linka i trajanja |
| Ispravke predavanja | OK + popravljeno | forma ulazi u istoriju (Nazad je zatvara), ljepljivo Sačuvaj, pitanje za nesačuvane izmjene |
| Transkripti | popravljeno | **arapski segmenti (`jezik: "ar"`)**: polje RTL, `lang="ar"`, arapski font, bedž „arapski“ (i „provjeriti“), prevod prikazan ispod (samo za čitanje); `/transkripti/<id>.json` sad šalje i `ar`/`arEn`; ▶ 44 px; Nazad zatvara urednik |
| Kategorije, Serije | OK | sistemske i YouTube stavke se ne brišu (poruka) |
| Programi upisa | OK | |
| Kartice stranica | OK | redoslijed unutar stranice |
| Tekstovi stranica | OK | |
| Sedmični raspored | OK | |
| Traka na vrhu sajta | OK | pregled; provjera teksta i linka (`javascript:` odbijen) |
| Inbox — Poruke | OK + popravljeno | „Odgovori e-mailom“: `mailto:` bez kodiranog `@` (pouzdanije u mail aplikacijama na telefonu) |
| Inbox — Prijave + CSV | OK | status, bilješka, CSV (`;`, BOM) |
| Inbox — Pitanja | novo (0007) | filter Neodgovorena/Javna/Privatne/Sakrivena; bedževi; javno: „Sakrij sa sajta“; privatno: „Objavi odgovor (anonimno)“ (traži odgovor); brojač ne broji sakrivena |
| Urednici | OK | samo administrator (urednik ne vidi odjeljak; `?odjeljak=urednici` vraća na Obavještenja) |

## Pitaj imama (javno / privatno)

- Migracija `supabase/migrations/0007_pitanja_javna_privatna.sql` (orkestrator je primjenjuje).
- Obrazac: izbor „Javno pitanje — vidjeće ga svi“ / „Privatna poruka — vidi je samo imam“ (obavezan izbor,
  greška u sažetku), ime opciono za javno / obavezno za privatno, e-mail samo kod privatnog, napomena o
  privatnosti po izboru. Provjereno sa lažnim REST odgovorom u pregledaču (bez upisa u bazu): javno pitanje se
  odmah pojavi na vrhu liste (istaknuto), „Čeka odgovor“; filter Sva/Odgovorena/Čekaju odgovor.

## Preostalo (ne može se provjeriti bez prave prijave / baze)

- Prava prijava (magic link / kod) na telefonu, posebno kad se link otvori u ugrađenom pregledaču Gmail-a
  (sesija ostaje u tom pregledaču — tada upisati kod iz e-maila u pregledaču gdje je admin otvoren).
- RLS i storage politike nad pravom bazom (mock ih ne oponaša); migracija 0007 nije testirana lokalno
  (nema Postgres-a / PGlite-a u okruženju) — poslije primjene provjeriti `get_advisors` i jedan anonimni
  `GET /rest/v1/pitanja_javna`.
- Brisanje slika iz skladišta: mock vraća blob URL-ove, pa `ukloniSliku` tu ne prepoznaje putanju (u pravom
  bucketu radi kao ranije).
- Prevod arapskog segmenta (`prevod`) se u adminu samo prikazuje; ispravka prevoda traži proširenje
  `transkript_ispravke` (npr. jezik `bs-prevod`).
- Logo u zaglavlju i dalje vodi na početnu (namjerno; „Otvori sajt ↗“ i link u ladici otvaraju novu karticu).
