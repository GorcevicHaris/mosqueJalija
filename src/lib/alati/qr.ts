/**
 * Mali QR enkoder (ISO/IEC 18004) bez zavisnosti — bajt mod (UTF-8), nivo korekcije M ili L,
 * verzije 1–40, automatski izbor maske po pravilima kazni iz standarda.
 * Napisan za ovaj sajt (algoritam po uzoru na javno opisane postupke, npr. Project Nayuki).
 *
 * Upotreba: const m = qrMatrica('tekst'); const svg = qrSvg(m);
 */

export type NivoKorekcije = 'L' | 'M';

// Indeks = verzija (0 se ne koristi).
const ECC_PO_BLOKU: Record<NivoKorekcije, number[]> = {
  L: [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  M: [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
};
const BROJ_BLOKOVA: Record<NivoKorekcije, number[]> = {
  L: [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  M: [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
};
const FORMAT_NIVO: Record<NivoKorekcije, number> = { L: 1, M: 0 };

const bit = (x: number, i: number) => ((x >>> i) & 1) !== 0;

function sirovihModula(v: number): number {
  let r = (16 * v + 128) * v + 64;
  if (v >= 2) {
    const n = Math.floor(v / 7) + 2;
    r -= (25 * n - 10) * n - 55;
    if (v >= 7) r -= 36;
  }
  return r;
}

const podatkovnihKodnihRijeci = (v: number, e: NivoKorekcije) =>
  Math.floor(sirovihModula(v) / 8) - ECC_PO_BLOKU[e][v] * BROJ_BLOKOVA[e][v];

// ---- Reed–Solomon nad GF(256), polinom 0x11D ----
function gfMul(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}
function rsDjelilac(stepen: number): number[] {
  const r = new Array<number>(stepen).fill(0);
  r[stepen - 1] = 1;
  let root = 1;
  for (let i = 0; i < stepen; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j], root);
      if (j + 1 < r.length) r[j] ^= r[j + 1];
    }
    root = gfMul(root, 0x02);
  }
  return r;
}
function rsOstatak(data: number[], djelilac: number[]): number[] {
  const r = djelilac.map(() => 0);
  for (const b of data) {
    const f = b ^ (r.shift() as number);
    r.push(0);
    djelilac.forEach((c, i) => (r[i] ^= gfMul(c, f)));
  }
  return r;
}

/** Vraća matricu modula: matrica[y][x] === true znači tamni modul. */
export function qrMatrica(tekst: string, nivo: NivoKorekcije = 'M'): boolean[][] {
  const bajtovi = Array.from(new TextEncoder().encode(tekst));

  // 1) najmanja verzija u koju stane sadržaj
  let v = 1;
  for (; v <= 40; v++) {
    const cc = v < 10 ? 8 : 16;
    if (4 + cc + bajtovi.length * 8 <= podatkovnihKodnihRijeci(v, nivo) * 8) break;
  }
  if (v > 40) throw new Error('Sadržaj je predugačak za QR kod.');

  // 2) niz bitova: mod (0100), dužina, podaci, terminator, dopuna
  const bb: number[] = [];
  const dodaj = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1);
  };
  dodaj(0b0100, 4);
  dodaj(bajtovi.length, v < 10 ? 8 : 16);
  bajtovi.forEach((b) => dodaj(b, 8));
  const kapacitet = podatkovnihKodnihRijeci(v, nivo) * 8;
  dodaj(0, Math.min(4, kapacitet - bb.length));
  dodaj(0, (8 - (bb.length % 8)) % 8);
  for (let p = 0xec; bb.length < kapacitet; p ^= 0xec ^ 0x11) dodaj(p, 8);
  const podaci: number[] = [];
  for (let i = 0; i < bb.length; i += 8) {
    let b = 0;
    for (let j = 0; j < 8; j++) b = (b << 1) | bb[i + j];
    podaci.push(b);
  }

  // 3) blokovi + korekcija grešaka + preplitanje
  const nb = BROJ_BLOKOVA[nivo][v];
  const eccLen = ECC_PO_BLOKU[nivo][v];
  const sirovo = Math.floor(sirovihModula(v) / 8);
  const kratkih = nb - (sirovo % nb);
  const kratkaDuz = Math.floor(sirovo / nb);
  const djel = rsDjelilac(eccLen);
  const blokovi: number[][] = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const dat = podaci.slice(k, k + kratkaDuz - eccLen + (i < kratkih ? 0 : 1));
    k += dat.length;
    const ecc = rsOstatak(dat, djel);
    if (i < kratkih) dat.push(0);
    blokovi.push(dat.concat(ecc));
  }
  const kodne: number[] = [];
  for (let i = 0; i < blokovi[0].length; i++) {
    blokovi.forEach((b, j) => {
      if (i !== kratkaDuz - eccLen || j >= kratkih) kodne.push(b[i]);
    });
  }

  // 4) funkcijski obrasci
  const size = v * 4 + 17;
  const mod: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const fun: boolean[][] = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const postavi = (x: number, y: number, d: boolean) => {
    mod[y][x] = d;
    fun[y][x] = true;
  };
  for (let i = 0; i < size; i++) {
    postavi(6, i, i % 2 === 0);
    postavi(i, 6, i % 2 === 0);
  }
  const tragac = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++)
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) postavi(x, y, d !== 2 && d !== 4);
      }
  };
  tragac(3, 3);
  tragac(size - 4, 3);
  tragac(3, size - 4);
  if (v > 1) {
    const n = Math.floor(v / 7) + 2;
    const korak = Math.floor((v * 8 + n * 3 + 5) / (n * 4 - 4)) * 2;
    const poz = [6];
    for (let p = size - 7; poz.length < n; p -= korak) poz.splice(1, 0, p);
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) postavi(poz[i] + dx, poz[j] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
  }
  const crtajFormat = (maska: number) => {
    const data = (FORMAT_NIVO[nivo] << 3) | maska;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    for (let i = 0; i <= 5; i++) postavi(8, i, bit(bits, i));
    postavi(8, 7, bit(bits, 6));
    postavi(8, 8, bit(bits, 7));
    postavi(7, 8, bit(bits, 8));
    for (let i = 9; i < 15; i++) postavi(14 - i, 8, bit(bits, i));
    for (let i = 0; i < 8; i++) postavi(size - 1 - i, 8, bit(bits, i));
    for (let i = 8; i < 15; i++) postavi(8, size - 15 + i, bit(bits, i));
    postavi(8, size - 8, true);
  };
  crtajFormat(0);
  if (v >= 7) {
    let rem = v;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (v << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const c = bit(bits, i);
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      postavi(a, b, c);
      postavi(b, a, c);
    }
  }

  // 5) raspored podataka (cik-cak)
  let k = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < size; vert++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const gore = ((right + 1) & 2) === 0;
        const y = gore ? size - 1 - vert : vert;
        if (!fun[y][x] && k < kodne.length * 8) {
          mod[y][x] = bit(kodne[k >>> 3], 7 - (k & 7));
          k++;
        }
      }
    }
  }

  // 6) maska sa najmanjom kaznom
  const maskaFn = (m: number, x: number, y: number): boolean => {
    switch (m) {
      case 0: return (x + y) % 2 === 0;
      case 1: return y % 2 === 0;
      case 2: return x % 3 === 0;
      case 3: return (x + y) % 3 === 0;
      case 4: return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
      case 5: return ((x * y) % 2) + ((x * y) % 3) === 0;
      case 6: return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
      default: return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
    }
  };
  const primijeni = (m: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (!fun[y][x] && maskaFn(m, x, y)) mod[y][x] = !mod[y][x];
  };
  let najbolja = 0;
  let najmanje = Infinity;
  for (let m = 0; m < 8; m++) {
    primijeni(m);
    crtajFormat(m);
    const p = kazna(mod);
    if (p < najmanje) {
      najmanje = p;
      najbolja = m;
    }
    primijeni(m); // XOR vraća stanje
  }
  primijeni(najbolja);
  crtajFormat(najbolja);
  return mod;
}

function kazna(m: boolean[][]): number {
  const n = m.length;
  let p = 0;
  const linija = (get: (i: number) => boolean) => {
    let run = 1;
    for (let i = 1; i <= n; i++) {
      if (i < n && get(i) === get(i - 1)) run++;
      else {
        if (run >= 5) p += 3 + (run - 5);
        run = 1;
      }
    }
    // obrazac nalik tragaču 1:1:3:1:1 sa 4 svijetla modula sa strane
    const a = [true, false, true, true, true, false, true];
    for (let i = 0; i + 7 <= n; i++) {
      let ok = true;
      for (let j = 0; j < 7 && ok; j++) if (get(i + j) !== a[j]) ok = false;
      if (!ok) continue;
      const svijetlo = (s: number, e: number) => {
        for (let t = s; t < e; t++) if (t >= 0 && t < n && get(t)) return false;
        return true;
      };
      if (svijetlo(i - 4, i) || svijetlo(i + 7, i + 11)) p += 40;
    }
  };
  for (let y = 0; y < n; y++) linija((i) => m[y][i]);
  for (let x = 0; x < n; x++) linija((i) => m[i][x]);
  let tamnih = 0;
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      if (m[y][x]) tamnih++;
      if (x < n - 1 && y < n - 1) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) p += 3;
      }
    }
  const ukupno = n * n;
  p += Math.floor(Math.abs(tamnih * 20 - ukupno * 10) / ukupno) * 10;
  return p;
}

/** SVG (string) sa tihom zonom od 4 modula; tamni moduli su `currentColor` na bijeloj podlozi. */
export function qrSvg(m: boolean[][], opts: { naslov?: string; tiha?: number } = {}): string {
  const q = opts.tiha ?? 4;
  const n = m.length + q * 2;
  let d = '';
  for (let y = 0; y < m.length; y++) {
    let x = 0;
    while (x < m.length) {
      if (!m[y][x]) {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < m.length && m[y][x + w]) w++;
      d += `M${x + q} ${y + q}h${w}v1h-${w}z`;
      x += w;
    }
  }
  const t = opts.naslov ? `<title>${opts.naslov.replace(/[<&>]/g, '')}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges" role="img"${opts.naslov ? '' : ' aria-hidden="true"'}>${t}<rect width="${n}" height="${n}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}
