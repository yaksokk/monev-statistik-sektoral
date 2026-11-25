import { NextResponse, type NextRequest } from "next/server";
import { AWALAN_RUTE, BERANDA} from "@/lib/akses";
import { segarkanSesi } from "@/lib/supabase/proxy";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sesi = await segarkanSesi(req);
  const peran = sesi.profil?.peran;

  const alihkan = (tujuan: string) =>
    sesi.salin(NextResponse.redirect(new URL(tujuan, req.url)));

  // Sudah login tidak perlu ke halaman login
  if (pathname === "/login") {
    return sesi.lanjut();
  }

  // Belum login, atau akun Auth tanpa baris profil
  if (!peran) return alihkan("/login");


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