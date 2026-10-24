// Provjera koje stranice postoje u src/pages (pri buildu), da linkovi ne vode na 404.
const fajlovi = Object.keys(import.meta.glob('/src/pages/**/*.{astro,md,mdx}'));

/** postoji('/vaktija'), postoji('/objave/[slug]') */
export function postoji(href: string): boolean {
  const p = href === '/' ? '/index' : href.replace(/\/$/, '');
  return fajlovi.some((f) => {
    const bez = f.replace(/^\/src\/pages/, '').replace(/\.(astro|mdx?)$/, '');
    return bez === p || bez === `${p}/index`;
  });
}

/** Putanja do detalja obavještenja/objave (objave imaju svoju rutu samo ako postoji /objave/[slug]). */
export function obavjestenjeHref(tip: 'obavjestenje' | 'objava', slug: string): string {
  return tip === 'objava' && postoji('/objave/[slug]') ? `/objave/${slug}` : `/obavjestenja/${slug}`;
}
