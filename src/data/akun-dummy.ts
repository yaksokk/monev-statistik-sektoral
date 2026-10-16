import type { Peran } from "@/lib/types";

export type AkunDummy = {
  penggunaId: string;
  email: string;
  sandi: string;
  peran: Peran;
};

// Hanya untuk demo, ganti dengan autentikasi backend nanti
export const AKUN_DUMMY: AkunDummy[] = [
  { penggunaId: "usr-admin", email: "admin@monev.test", sandi: "admin123", peran: "admin" },
  { penggunaId: "usr-op-01", email: "operator@monev.test", sandi: "operator123", peran: "operator" },
];