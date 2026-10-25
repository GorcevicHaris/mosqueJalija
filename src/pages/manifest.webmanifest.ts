// Web manifest se generiše da bi putanje pratile base (GitHub Pages podfolder ili korijen domena na Vercel-u).
import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
  const B = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const manifest = {
  "name": "Džamija na Jaliji",
  "short_name": "Jalija",
  "description": "Vaktija, predavanja, hutbe, obavještenja i islamski kalendar Džamije na Jaliji.",
  "lang": "sr-Latn",
  "dir": "ltr",
  "start_url": `${B}`,
  "scope": `${B}`,
  "id": `${B}`,
  "display": "standalone",
  "orientation": "any",
  "theme_color": "#0c3b2e",
  "background_color": "#f7f1e3",
  "categories": [
    "education",
    "lifestyle"
  ],
  "icons": [
    {
      "src": `${B}favicon.svg`,
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    },
    {
      "src": `${B}icon-192.png`,
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": `${B}icon-512.png`,
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Vaktija",
      "short_name": "Vaktija",
      "url": `${B}vaktija/`
    },
    {
      "name": "Predavanja",
      "short_name": "Predavanja",
      "url": `${B}predavanja/`
    },
    {
      "name": "Islamski kalendar",
      "short_name": "Kalendar",
      "url": `${B}kalendar/`
    },
    {
      "name": "Pretraga",
      "short_name": "Pretraga",
      "url": `${B}pretraga/`
    }
  ]
};
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/manifest+json; charset=utf-8' },
  });
};
