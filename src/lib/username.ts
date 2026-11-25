// Dipakai di klien dan server: jangan impor "server-only" di sini.
export const DOMAIN_AKUN = "bps.mitra.internal";
const SUFIKS = `@${DOMAIN_AKUN}`;

export const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;
export const PESAN_USERNAME =
  "Username 3-30 karakter: huruf kecil, angka, titik, garis bawah, atau tanda hubung (tanpa spasi dan @).";

export function bersihkanUsername(x: string): string {
  return x.trim().toLowerCase();
}

export function usernameValid(username: string): boolean {
  return USERNAME.test(username);
}

export function usernameKeEmail(username: string): string {
  return `${bersihkanUsername(username)}${SUFIKS}`;
}

// Email dengan domain akun aplikasi ditampilkan sebagai username; selain itu apa adanya
export function emailKeUsername(email: string): string {
  const e = email.toLowerCase();
  return e.endsWith(SUFIKS) ? e.slice(0, -SUFIKS.length) : email;
}