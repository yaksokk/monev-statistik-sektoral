import { NextResponse, type NextRequest } from "next/server";
import { AKUN_DUMMY } from "@/data/akun-dummy";
import { AWALAN_RUTE, BERANDA, NAMA_COOKIE } from "@/lib/akses";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const id = req.cookies.get(NAMA_COOKIE)?.value;
  const akun = AKUN_DUMMY.find((a) => a.penggunaId === id);

  // Sudah login tidak perlu ke halaman login
  if (pathname === "/login") {
    if (akun) return NextResponse.redirect(new URL(BERANDA[akun.peran], req.url));
    return NextResponse.next();
  }

  if (!akun) return NextResponse.redirect(new URL("/login", req.url));

  // Peran hanya boleh masuk ke area miliknya
  const awalan = AWALAN_RUTE[akun.peran];
  if (pathname !== awalan && !pathname.startsWith(`${awalan}/`)) {
    return NextResponse.redirect(new URL(BERANDA[akun.peran], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/opd/:path*"],
};