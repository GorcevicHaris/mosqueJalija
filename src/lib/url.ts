/**
 * Pravi putanju koja poštuje `base` (GitHub Pages podfolder).
 * Uvijek koristiti za interne linkove i statičke fajlove: url('/predavanja'), url('/images/x.jpg').
 *
 * Stranice dobijaju završnu kosu crtu ('/predavanja' → '/mosqueJalija/predavanja/'), jer GitHub Pages
 * adresu bez nje preusmjerava (301) — tako svaki klik štedi jedan zahtjev. Fajlovi (sa ekstenzijom)
 * ostaju kako jesu.
 */
export function saKosomCrtom(path: string): string {
  const m = path.match(/^([^?#]*)(.*)$/);
  const p = m?.[1] ?? path;
  const rest = m?.[2] ?? '';
  if (!p || p.endsWith('/') || /\.[a-z0-9]+$/i.test(p.split('/').pop() ?? '')) return path;
  return `${p}/${rest}`;
}

export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return saKosomCrtom(`${base}${clean}`) || '/';
}
