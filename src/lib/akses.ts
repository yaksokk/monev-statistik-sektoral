import type { Peran } from "@/lib/types";

export const NAMA_COOKIE = "sesi_monev";

export const BERANDA: Record<Peran, string> = {
  admin: "/admin/dashboard",
  operator: "/opd/dashboard",
};

export const AWALAN_RUTE: Record<Peran, string> = {
  admin: "/admin",
  operator: "/opd",
};