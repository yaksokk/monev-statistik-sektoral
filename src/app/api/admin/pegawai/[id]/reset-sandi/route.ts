import { NextResponse } from "next/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";
import { UUID, bacaJson, jawab, pastikanAdmin, sandiValid } from "@/lib/api-admin";

type Konteks = { params: Promise<{ id: string }> };

// Reset sandi: admin mengetik sandi sementara; pegawai wajib menggantinya saat login berikutnya
export async function POST(req: Request, { params }: Konteks) {
  const cek = await pastikanAdmin();
  if ("galat" in cek) return cek.galat;

  const { id } = await params;
  if (!UUID.test(id)) return jawab("ID pegawai tidak valid.", 400);

  const b = await bacaJson(req);
  if (!b) return jawab("Permintaan tidak valid.", 400);
  const sandi = typeof b.sandi === "string" ? b.sandi : "";
  const galatSandi = sandiValid(sandi);
  if (galatSandi) return jawab(galatSandi, 400);

  try {
    const admin = buatKlienAdmin();

    const { data: profil } = await admin.from("profil").select("id, peran").eq("id", id).maybeSingle();
    if (!profil) return jawab("Pegawai tidak ditemukan.", 404);
    if (profil.peran !== "operator") return jawab("Hanya sandi akun pegawai yang bisa direset.", 403);

    // Penanda dulu, baru sandi: bila sandi gagal diganti, pegawai paling buruk diminta ganti sandi lagi
    const { error: galatProfil } = await admin
      .from("profil")
      .update({ wajib_ganti_sandi: true })
      .eq("id", id);
    if (galatProfil) {
      console.error("Set wajib_ganti_sandi gagal:", id, galatProfil.message);
      return jawab("Gagal mereset kata sandi.", 500);
    }

    const { error: galatAuth } = await admin.auth.admin.updateUserById(id, { password: sandi });
    if (galatAuth) {
      if (galatAuth.code === "weak_password") return jawab("Kata sandi terlalu lemah.", 400);
      console.error("Reset sandi gagal:", id, galatAuth.code, galatAuth.message);
      return jawab("Gagal mereset kata sandi.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/pegawai/[id]/reset-sandi:", e);
    return jawab("Terjadi kesalahan di server.", 500);
  }
}