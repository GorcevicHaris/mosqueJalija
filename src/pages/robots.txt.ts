// robots.txt se generiše da bi putanje i sitemap pratili site + base (GitHub Pages ili Vercel/domen).
import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const B = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const sitemap = new URL(`${B}sitemap-index.xml`, site).href;
  const tekst = `User-agent: *
Allow: /
Disallow: ${B}admin/
Disallow: ${B}obavjestenja/prikaz/

Sitemap: ${sitemap}
`;
  return new Response(tekst, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
