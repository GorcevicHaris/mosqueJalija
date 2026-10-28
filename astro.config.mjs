// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages: https://gorcevicharis.github.io/mosqueJalija/ (podfolder).
// Vercel (env VERCEL=1): sajt je na korijenu domena; SITE = vlastiti domen ako je postavljen,
// inače produkcijska adresa Vercel projekta.
const naVercelu = Boolean(process.env.VERCEL);
const vercelSite = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null;
const SITE = process.env.SITE ?? vercelSite ?? 'https://gorcevicharis.github.io';
const BASE = process.env.BASE ?? (naVercelu ? '/' : '/mosqueJalija');

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'ignore',
  output: 'static',
  // CSS je mali (~15 KB) — ugrađuje se u stranicu da ne blokira prvo iscrtavanje.
  build: { inlineStylesheets: 'always' },
  // Admin panel, privremeni prikaz objava iz baze i stare adrese /imami/… (preusmjerenja na /imam/) nisu za pretraživače.
  integrations: [sitemap({ filter: (page) => !/\/admin\/|\/obavjestenja\/prikaz\/|\/imami\//.test(page) })],
});
