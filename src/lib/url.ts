/**
 * Pravi putanju koja poštuje `base` (GitHub Pages podfolder).
 * Uvijek koristiti za interne linkove i statičke fajlove: url('/predavanja'), url('/images/x.jpg').
 */
export function url(path = '/'): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}` || '/';
}
