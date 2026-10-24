// RSS 2.0: 50 najnovijih predavanja → /predavanja.xml
import type { APIRoute } from 'astro';
import { predavanjaFeed } from '../lib/extras/rss';

export const GET: APIRoute = ({ site }) =>
  new Response(predavanjaFeed(site), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
