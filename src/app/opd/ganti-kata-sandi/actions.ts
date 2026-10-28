"use server";

import { AKUN_DUMMY } from "@/data/akun-dummy";
import { ambilOperator } from "@/lib/operator";

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

  const akun = AKUN_DUMMY.find((a) => a.penggunaId === pengguna.id);
  if (!akun) return gagal("Akun tidak ditemukan. Silakan masuk kembali.");

  if (akun.sandi !== lama) return gagal("Kata sandi lama salah.");
  if (baru.length < MIN_PANJANG) return gagal(`Kata sandi baru minimal ${MIN_PANJANG} karakter.`);
  if (baru === lama) return gagal("Kata sandi baru harus berbeda dari yang lama.");
  if (baru !== konfirmasi) return gagal("Konfirmasi kata sandi tidak cocok.");

  // DUMMY: hanya mengubah data di memori server (hilang saat server restart).
  // Ganti dengan update ke database saat backend siap.
  akun.sandi = baru;

  return { status: "berhasil", pesan: "Kata sandi berhasil diganti." };
}