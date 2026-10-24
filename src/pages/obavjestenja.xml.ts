// RSS 2.0: obavještenja i objave (bez primjera sa placeholder: true) → /obavjestenja.xml
import type { APIRoute } from 'astro';
import { obavjestenjaFeed } from '../lib/extras/rss';

export const GET: APIRoute = ({ site }) =>
  new Response(obavjestenjaFeed(site), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
