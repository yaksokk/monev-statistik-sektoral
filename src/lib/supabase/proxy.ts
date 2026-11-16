import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ProfilSingkat = { peran: "admin" | "operator"; wajib_ganti_sandi: boolean };

// Menyegarkan sesi Supabase dan membaca peran pemanggil (dipakai proxy.ts)
export async function segarkanSesi(req: NextRequest) {
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(daftar) {
          daftar.forEach(({ name, value }) => req.cookies.set(name, value));
          response = NextResponse.next({ request: req });
          daftar.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub ?? null;

  let profil: ProfilSingkat | null = null;
  if (userId) {
    const { data: baris } = await supabase
      .from("profil")
      .select("peran, wajib_ganti_sandi")
      .eq("id", userId)
      .maybeSingle();
    profil = (baris as ProfilSingkat | null) ?? null;
  }

  return {
    profil,
    lanjut: () => response,
    // Redirect harus membawa cookie sesi yang baru disegarkan
    salin(tujuan: NextResponse) {
      response.cookies.getAll().forEach((c) => tujuan.cookies.set(c));
      return tujuan;
    },
  };
}