// Slike: smanjivanje u pregledaču (najviše 1600 px, WebP), upload u bucket "slike", brisanje.
import { BUCKET_SLIKE, SUPABASE_URL } from '../../lib/supabase/config';
import type { SB } from './sb';

export const MAX_BAJTOVA = 5 * 1024 * 1024; // isto kao file_size_limit bucketa
const MAX_ULAZ = 40 * 1024 * 1024;

async function ucitajSliku(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // rezerva za starije pregledače
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return Object.assign(img, { width: img.naturalWidth, height: img.naturalHeight });
    } catch {
      throw new Error('Format slike nije podržan. Pošaljite JPG, PNG ili WebP.');
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }
  }
}

const uBlob = (c: HTMLCanvasElement, tip: string, kvalitet: number) =>
  new Promise<Blob | null>((r) => c.toBlob(r, tip, kvalitet));

/** Smanjuje sliku na najviše `maxDim` px (duža strana) i pretvara u WebP (ili JPEG ako WebP nije podržan). */
export async function pripremiSliku(file: File, maxDim = 1600): Promise<Blob> {
  if (!file.type.startsWith('image/') && !/\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name))
    throw new Error(`"${file.name}" nije slika.`);
  if (file.size > MAX_ULAZ) throw new Error(`"${file.name}" je prevelika (više od 40 MB).`);
  const slika = await ucitajSliku(file);
  const k = Math.min(1, maxDim / Math.max(slika.width, slika.height));
  const w = Math.max(1, Math.round(slika.width * k));
  const h = Math.max(1, Math.round(slika.height * k));
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Pregledač ne može obraditi sliku.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(slika, 0, 0, w, h);
  if ('close' in slika && typeof slika.close === 'function') slika.close();

  for (const kvalitet of [0.85, 0.72, 0.6]) {
    let blob = await uBlob(c, 'image/webp', kvalitet);
    if (!blob || blob.type !== 'image/webp') blob = await uBlob(c, 'image/jpeg', kvalitet);
    if (blob && blob.size <= MAX_BAJTOVA) return blob;
  }
  throw new Error('Slika je prevelika i poslije smanjivanja (najviše 5 MB).');
}

const nasumicno = () => Math.random().toString(36).slice(2, 8);

/** Smanji + otpremi. Vraća javni URL. */
export async function otpremiSliku(klijent: SB, file: File, folder: string, maxDim = 1600): Promise<string> {
  const blob = await pripremiSliku(file, maxDim);
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const putanja = `${folder}/${new Date().getFullYear()}/${Date.now().toString(36)}-${nasumicno()}.${ext}`;
  const { error } = await klijent.storage.from(BUCKET_SLIKE).upload(putanja, blob, {
    contentType: blob.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return klijent.storage.from(BUCKET_SLIKE).getPublicUrl(putanja).data.publicUrl as string;
}

/** Putanja u bucketu iz javnog URL-a (null ako slika nije iz našeg bucketa). */
export function putanjaIzUrla(url: string | null | undefined): string | null {
  if (!url || !SUPABASE_URL || !url.startsWith(SUPABASE_URL)) return null;
  const m = url.match(new RegExp(`/storage/v1/object/public/${BUCKET_SLIKE}/([^?#]+)`));
  return m ? m[1].split('/').map(decodeURIComponent).join('/') : null;
}

/** Briše fajl iz bucketa (tiho — greška pri brisanju stare slike ne smije oboriti snimanje). */
export async function ukloniSliku(klijent: SB, url: string | null | undefined): Promise<void> {
  const putanja = putanjaIzUrla(url);
  if (!putanja) return;
  try {
    const { error } = await klijent.storage.from(BUCKET_SLIKE).remove([putanja]);
    if (error) console.warn('Brisanje slike nije uspjelo:', error);
  } catch (e) {
    console.warn('Brisanje slike nije uspjelo:', e);
  }
}
