/**
 * iCalendar (.ics, RFC 5545) i CSV izvoz — bez zavisnosti, radi u pregledaču.
 * Vremena se upisuju kao lokalno vrijeme sa TZID=Europe/Belgrade (uz VTIMEZONE blok sa pravilima
 * za CET/CEST), pa ih kalendar na telefonu prikazuje ispravno i nakon promjene ljetnog računanja vremena.
 */

export const TZID = 'Europe/Belgrade';

export interface IcsDogadjaj {
  uid: string;
  pocetak: Date;
  trajanjeMin?: number;
  naslov: string;
  opis?: string;
  mjesto?: string;
  /** Podsjetnik (VALARM) toliko minuta prije početka; null = bez podsjetnika, 0 = u trenutku početka. */
  podsjetnikMin?: number | null;
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const fmtLokalno = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZID,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

/** Date → "20261025T051200" (lokalno vrijeme u Europe/Belgrade). */
export function lokalnoIcs(d: Date): string {
  const p = Object.fromEntries(fmtLokalno.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}${p.month}${p.day}T${p.hour}${p.minute}${p.second}`;
}

/** Date → "20261025T031200Z" */
export const utcIcs = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Escape teksta po RFC 5545. */
export const escIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Presavija red na najviše 75 okteta (UTF-8), nastavak počinje razmakom. */
export function presavij(red: string): string {
  const enc = new TextEncoder();
  if (enc.encode(red).length <= 75) return red;
  const out: string[] = [];
  let tekuci = '';
  let duz = 0;
  for (const ch of red) {
    const b = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74;
    if (duz + b > limit) {
      out.push(tekuci);
      tekuci = '';
      duz = 0;
    }
    tekuci += ch;
    duz += b;
  }
  out.push(tekuci);
  return out.join('\r\n ');
}

export function napraviIcs(dogadjaji: IcsDogadjaj[], nazivKalendara: string): string {
  const sada = utcIcs(new Date());
  const linije = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dzamija na Jaliji//Alati//SR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escIcs(nazivKalendara)}`,
    `X-WR-TIMEZONE:${TZID}`,
    ...VTIMEZONE,
  ];
  for (const e of dogadjaji) {
    linije.push(
      'BEGIN:VEVENT',
      `UID:${e.uid}`,
      `DTSTAMP:${sada}`,
      `DTSTART;TZID=${TZID}:${lokalnoIcs(e.pocetak)}`,
      `DURATION:PT${e.trajanjeMin ?? 15}M`,
      `SUMMARY:${escIcs(e.naslov)}`,
    );
    if (e.opis) linije.push(`DESCRIPTION:${escIcs(e.opis)}`);
    if (e.mjesto) linije.push(`LOCATION:${escIcs(e.mjesto)}`);
    linije.push('TRANSP:TRANSPARENT');
    if (e.podsjetnikMin !== null && e.podsjetnikMin !== undefined) {
      linije.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escIcs(e.naslov)}`,
        `TRIGGER:${e.podsjetnikMin > 0 ? `-PT${e.podsjetnikMin}M` : 'PT0M'}`,
        'END:VALARM',
      );
    }
    linije.push('END:VEVENT');
  }
  linije.push('END:VCALENDAR');
  return linije.map(presavij).join('\r\n') + '\r\n';
}

/** CSV sa ";" kao separatorom (Excel sa srpskim/regionalnim postavkama) i BOM-om za UTF-8. */
export function napraviCsv(redovi: (string | number)[][]): string {
  const polje = (v: string | number) => {
    const s = String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\uFEFF' + redovi.map((r) => r.map(polje).join(';')).join('\r\n') + '\r\n';
}

/** Pokreće preuzimanje fajla generisanog u pregledaču (ništa se ne šalje na server). */
export function preuzmi(sadrzaj: string, imeFajla: string, tip: string): void {
  const blob = new Blob([sadrzaj], { type: tip });
  const href = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = imeFajla;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 4000);
}
