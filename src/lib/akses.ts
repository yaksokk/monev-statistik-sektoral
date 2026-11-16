import type { Peran } from "@/lib/types";

export const BERANDA: Record<Peran, string> = {
  admin: "/admin/dashboard",
  operator: "/opd/dashboard",
};

export const AWALAN_RUTE: Record<Peran, string> = {
  admin: "/admin",
  operator: "/opd",
};

// Operator dengan wajib_ganti_sandi hanya boleh membuka halaman ini
export const RUTE_GANTI_SANDI = "/opd/ganti-kata-sandi";