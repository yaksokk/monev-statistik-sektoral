"use server";

import { redirect } from "next/navigation";
import { ambilOperator } from "@/lib/operator";
import { buatKlienServer } from "@/lib/supabase/server";

export type StateGantiSandi = {
  status: "diam" | "gagal" | "berhasil";
  pesan: string | null;
};

const MIN_PANJANG = 8;

const gagal = (pesan: string): StateGantiSandi => ({ status: "gagal", pesan });

export async function gantiKataSandi(
  _: StateGantiSandi,
  data: FormData,
): Promise<StateGantiSandi> {
  const { pengguna } = await ambilOperator();

  const lama = String(data.get("sandiLama") ?? "");
  const baru = String(data.get("sandiBaru") ?? "");
  const konfirmasi = String(data.get("konfirmasi") ?? "");

  if (!lama || !baru || !konfirmasi) return gagal("Semua kolom wajib diisi.");
  if (baru.length < MIN_PANJANG) return gagal(`Kata sandi baru minimal ${MIN_PANJANG} karakter.`);
  if (baru === lama) return gagal("Kata sandi baru harus berbeda dari yang lama.");
  if (baru !== konfirmasi) return gagal("Konfirmasi kata sandi tidak cocok.");

  const supabase = await buatKlienServer();

  // Supabase tidak memeriksa sandi lama saat updateUser, jadi diverifikasi dengan login ulang
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? pengguna.email;
  const { error: eLama } = await supabase.auth.signInWithPassword({ email, password: lama });
  if (eLama) {
    return gagal(
      eLama.status === 429
        ? "Terlalu banyak percobaan. Coba lagi beberapa saat lagi."
        : "Kata sandi lama salah.",
    );
  }

  const { error: eBaru } = await supabase.auth.updateUser({ password: baru });
  if (eBaru) {
    if (eBaru.code === "weak_password") return gagal("Kata sandi baru terlalu lemah.");
    if (eBaru.code === "same_password") return gagal("Kata sandi baru harus berbeda dari yang lama.");
    return gagal("Gagal menyimpan kata sandi. Coba lagi.");
  }

  if (pengguna.wajibGantiSandi) {
    const { error: eTandai } = await supabase.rpc("tandai_sandi_diganti");
    if (eTandai) {
      return gagal("Kata sandi sudah diganti, tetapi status akun belum diperbarui. Coba simpan sekali lagi.");
    }
    redirect("/opd/dashboard");
  }

  return { status: "berhasil", pesan: "Kata sandi berhasil diganti." };
}