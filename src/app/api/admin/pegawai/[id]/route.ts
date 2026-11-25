import { NextResponse } from "next/server";
import { buatKlienAdmin } from "@/lib/supabase/admin";
import {
  PESAN_USERNAME,
  bersihkanUsername,
  usernameKeEmail,
  usernameValid,
} from "@/lib/username";
import { UUID, bacaJson, jawab, pastikanAdmin, sandiValid, teks } from "@/lib/api-admin"; 

type Konteks = { params: Promise<{ id: string }> };

const BUCKET = "dokumen-opd";

// Ubah nama dan email pegawai (profil dan akun Auth tetap sama)
export async function PATCH(req: Request, { params }: Konteks) {
  const cek = await pastikanAdmin();
  if ("galat" in cek) return cek.galat;

  const { id } = await params;
  if (!UUID.test(id)) return jawab("ID pegawai tidak valid.", 400);

  const b = await bacaJson(req);
  if (!b) return jawab("Permintaan tidak valid.", 400);

  const nama = teks(b.nama);
  const username = bersihkanUsername(teks(b.username));
  if (!nama || !username) return jawab("Semua kolom wajib diisi.", 400);
  if (nama.length > 150) return jawab("Nama terlalu panjang.", 400);
  if (!usernameValid(username)) return jawab(PESAN_USERNAME, 400);
  const email = usernameKeEmail(username);

  try {
    const admin = buatKlienAdmin();

    const { data: lama } = await admin
      .from("profil")
      .select("id, nama, email, peran")
      .eq("id", id)
      .maybeSingle();
    if (!lama) return jawab("Pegawai tidak ditemukan.", 404);
    if (lama.peran !== "operator") return jawab("Hanya akun pegawai yang bisa diubah.", 403);

    const emailBerubah = email !== String(lama.email).toLowerCase();
    if (!emailBerubah && nama === lama.nama) return NextResponse.json({ ok: true });

    // Profil dulu: indeks unik email memberi pesan duplikat yang jelas
    const { error: galatProfil } = await admin.from("profil").update({ nama, email }).eq("id", id);
    if (galatProfil) {
      if (galatProfil.code === "23505") return jawab("Username ini sudah dipakai.", 409);
      console.error("Update profil gagal:", galatProfil.code, galatProfil.message);
      return jawab("Gagal menyimpan perubahan.", 500);
    }

    if (emailBerubah) {
      const { error: galatAuth } = await admin.auth.admin.updateUserById(id, {
        email,
        email_confirm: true,
      });
      if (galatAuth) {
        // Kembalikan profil agar email di profil dan di Auth tetap sama
        const { error: galatKembali } = await admin
          .from("profil")
          .update({ nama: lama.nama, email: lama.email })
          .eq("id", id);
        if (galatKembali) console.error("Pengembalian profil gagal:", id, galatKembali.message);

        const sudahAda =
          galatAuth.code === "email_exists" || /already|registered/i.test(galatAuth.message);
        if (sudahAda) return jawab("Username ini sudah dipakai.", 409);
        console.error("updateUserById gagal:", galatAuth.code, galatAuth.message);
        return jawab("Gagal mengubah email akun.", 500);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("PATCH /api/admin/pegawai/[id]:", e);
    return jawab("Terjadi kesalahan di server.", 500);
  }
}

// Hapus semua file di bucket pada folder <id pegawai>/. Mengembalikan pesan galat, atau null bila berhasil.
// Hapus semua file di bucket pada folder (termasuk sub-folder). Mengembalikan pesan galat, atau null bila berhasil.
async function hapusFolderStorage(
  admin: ReturnType<typeof buatKlienAdmin>,
  folder: string,
  kedalaman = 0,
): Promise<string | null> {
  if (kedalaman > 3) return "Struktur folder terlalu dalam.";
  const bucket = admin.storage.from(BUCKET);
  for (let putaran = 0; putaran < 100; putaran++) {
    const { data, error } = await bucket.list(folder, { limit: 100 });
    if (error) return error.message;
    if (!data || data.length === 0) return null;

    for (const sub of data.filter((f) => !f.id)) {
      const g = await hapusFolderStorage(admin, `${folder}/${sub.name}`, kedalaman + 1);
      if (g) return g;
    }
    const berkas = data.filter((f) => f.id).map((f) => `${folder}/${f.name}`);
    if (berkas.length > 0) {
      const { error: galatHapus } = await bucket.remove(berkas);
      if (galatHapus) return galatHapus.message;
    }
  }
  return "Terlalu banyak berkas.";
}

// Hapus akun pegawai: file di Storage dulu, lalu akun Auth (profil dan semua datanya ikut terhapus)
export async function DELETE(_req: Request, { params }: Konteks) {
  const cek = await pastikanAdmin();
  if ("galat" in cek) return cek.galat;

  const { id } = await params;
  if (!UUID.test(id)) return jawab("ID pegawai tidak valid.", 400);

  try {
    const admin = buatKlienAdmin();

    const { data: profil } = await admin.from("profil").select("id, peran").eq("id", id).maybeSingle();
    if (!profil) return jawab("Pegawai tidak ditemukan.", 404);
    if (profil.peran !== "operator") return jawab("Hanya akun pegawai yang bisa dihapus.", 403);

    const galatStorage = await hapusFolderStorage(admin, id);
    if (galatStorage) {
      console.error("Hapus file Storage gagal:", id, galatStorage);
      return jawab("Gagal menghapus file pegawai. Akun belum dihapus, coba lagi.", 500);
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      console.error("deleteUser gagal:", id, error.message);
      return jawab("Gagal menghapus akun.", 500);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/pegawai/[id]:", e);
    return jawab("Terjadi kesalahan di server.", 500);
  }
}