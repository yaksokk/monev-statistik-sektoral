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
  { penggunaId: "usr-op-02", email: "monita.disdikbud@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-03", email: "keisya.dinkes@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-04", email: "arya.dinkes@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-05", email: "silvana.dinsos@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-06", email: "laode.dinsos@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-07", email: "arturito.dkp@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-08", email: "marya.dkp@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-09", email: "samuel.diskominfo@monev.test", sandi: "operator123", peran: "operator" },
  { penggunaId: "usr-op-10", email: "dina.diskominfo@monev.test", sandi: "operator123", peran: "operator" },
];