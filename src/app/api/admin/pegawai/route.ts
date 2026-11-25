import { NextResponse } from "next/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";
import {
  EMAIL,
  UUID,
  bacaJson,
  jawab,
  pastikanAdmin,
  sandiValid,
  teks,
} from "@/lib/api-admin";

// Buat akun pegawai: akun Auth (email terkonfirmasi, sandi awal dari admin) lalu baris profil.
// Bila profil gagal disimpan, akun Auth dibatalkan.
export async function POST(req: Request) {
  const cek = await pastikanAdmin();
  if ("galat" in cek) return cek.galat;

  const b = await bacaJson(req);
  if (!b) return jawab("Permintaan tidak valid.", 400);

  const nama = teks(b.nama);
  const email = teks(b.email).toLowerCase();
  const sandi = typeof b.sandi === "string" ? b.sandi : "";
  const opdId = teks(b.opdId);

  if (!nama || !email || !opdId) return jawab("Semua kolom wajib diisi.", 400);
  if (nama.length > 150) return jawab("Nama terlalu panjang.", 400);
  if (email.length > 254 || !EMAIL.test(email)) return jawab("Format email belum benar.", 400);
  if (!UUID.test(opdId)) return jawab("OPD tidak valid.", 400);
  const galatSandi = sandiValid(sandi);
  if (galatSandi) return jawab(galatSandi, 400);

  try {
    const admin = buatKlienAdmin();

    const { data: opd } = await admin.from("opd").select("id").eq("id", opdId).maybeSingle();
    if (!opd) return jawab("OPD tidak ditemukan.", 404);

    const { data: dibuat, error: galatAuth } = await admin.auth.admin.createUser({
      email,
      password: sandi,
      email_confirm: true,
    });
    if (galatAuth || !dibuat.user) {
      const sudahAda =
        galatAuth?.code === "email_exists" || /already|registered/i.test(galatAuth?.message ?? "");
      if (sudahAda) return jawab("Email ini sudah dipakai.", 409);
      if (galatAuth?.code === "weak_password") return jawab("Kata sandi terlalu lemah.", 400);
      console.error("createUser gagal:", galatAuth?.code, galatAuth?.message);
      return jawab("Gagal membuat akun.", 500);
    }

    const idBaru = dibuat.user.id;
    const { error: galatProfil } = await admin.from("profil").insert({
      id: idBaru,
      nama,
      email,
      peran: "operator",
      opd_id: opdId,
      wajib_ganti_sandi: false,
    });

    if (galatProfil) {
      const { error: galatBatal } = await admin.auth.admin.deleteUser(idBaru);
      if (galatBatal) console.error("Pembatalan akun Auth gagal:", idBaru, galatBatal.message);
      if (galatProfil.code === "23505") return jawab("Email ini sudah dipakai.", 409);
      console.error("Insert profil gagal:", galatProfil.code, galatProfil.message);
      return jawab("Gagal menyimpan data pegawai.", 500);
    }

    return NextResponse.json({ pegawai: { id: idBaru, nama, email, opdId } }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/pegawai:", e);
    return jawab("Terjadi kesalahan di server.", 500);
  }
}