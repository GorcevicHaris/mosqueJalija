// Supabase klijent za admin panel — supabase-js se učitava sa CDN-a (fiksna verzija), bez npm paketa.
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../../lib/supabase/config';

export const SUPABASE_JS_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.115.0/+esm';

// Namjerno labav tip: biblioteka dolazi sa CDN-a, pa njeni TS tipovi nisu dostupni pri buildu.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SB = any;

let klijent: SB | null = null;

export async function sb(): Promise<SB> {
  if (klijent) return klijent;
  const modul = await import(/* @vite-ignore */ SUPABASE_JS_CDN);
  klijent = modul.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'implicit', // link iz e-maila radi i ako se otvori u drugom pregledaču
      storageKey: 'dzamija-admin-auth',
    },
  });
  return klijent;
}

/** Adresa admin stranice (za emailRedirectTo). */
export const adminUrl = (): string => new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, '/')}admin/`, location.origin).href;

/** Baca grešku iz { data, error } odgovora; vraća data. */
export function provjeri<T>(odg: { data: T; error: unknown }): T {
  if (odg.error) throw odg.error;
  return odg.data;
}
