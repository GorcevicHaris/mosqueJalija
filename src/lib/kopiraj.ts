// Kopiranje teksta u međuspremnik. Bez zavisnosti — sigurno za klijentske skripte.

/** Sinhrono kopiranje (skriveni textarea + execCommand) — radi i kad klik odmah otvara novu karticu. */
export function kopirajSinhrono(text: string): boolean {
  const prije = document.activeElement as HTMLElement | null;
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '0';
  ta.style.left = '0';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length); // iOS
  let ok = false;
  try {
    // execCommand je zastario, ali je jedina sinhrona rezerva (stari pregledači, http, iOS)
    const cmd = 'execCommand';
    ok = (document as unknown as Record<string, (c: string) => boolean>)[cmd]('copy');
  } catch {
    ok = false;
  }
  ta.remove();
  prije?.focus?.({ preventScroll: true });
  return ok;
}

/** Clipboard API, a ako nije dostupan ili odbije — sinhrona rezerva. */
export async function kopirajTekst(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* probaj rezervu */ }
  return kopirajSinhrono(text);
}
