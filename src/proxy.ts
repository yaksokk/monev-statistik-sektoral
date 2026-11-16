import { NextResponse, type NextRequest } from "next/server";
import { AWALAN_RUTE, BERANDA, RUTE_GANTI_SANDI } from "@/lib/akses";
import { segarkanSesi } from "@/lib/supabase/proxy";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesi = await segarkanSesi(req);
  const peran = sesi.profil?.peran;
  const wajibGanti = peran === "operator" && sesi.profil?.wajib_ganti_sandi === true;

  const alihkan = (tujuan: string) =>
    sesi.salin(NextResponse.redirect(new URL(tujuan, req.url)));

  // Sudah login tidak perlu ke halaman login
  if (pathname === "/login") {
    if (peran) return alihkan(wajibGanti ? RUTE_GANTI_SANDI : BERANDA[peran]);
    return sesi.lanjut();
  }

  // Belum login, atau akun Auth tanpa baris profil
  if (!peran) return alihkan("/login");

  // Sandi awal wajib diganti dulu
  if (wajibGanti && pathname !== RUTE_GANTI_SANDI) return alihkan(RUTE_GANTI_SANDI);

  // Peran hanya boleh masuk ke area miliknya
  const awalan = AWALAN_RUTE[peran];
  if (pathname !== awalan && !pathname.startsWith(`${awalan}/`)) {
    return alihkan(BERANDA[peran]);
  }

  return sesi.lanjut();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/opd/:path*"],
};