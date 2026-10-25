// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://gorcevicharis.github.io/mosqueJalija/
// Za vlastiti domen: postaviti SITE na domen i BASE na '/'.
const SITE = process.env.SITE ?? 'https://gorcevicharis.github.io';
const BASE = process.env.BASE ?? '/mosqueJalija';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  output: 'static',
  // CSS je mali (~15 KB) — ugrađuje se u stranicu da ne blokira prvo iscrtavanje.
  build: { inlineStylesheets: 'always' },
  // Admin panel i privremeni prikaz objava iz baze nisu za pretraživače.
  integrations: [sitemap({ filter: (page) => !/\/admin\/|\/obavjestenja\/prikaz\//.test(page) })],
});
