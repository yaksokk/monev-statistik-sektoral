import type { Presensi, SesiPembinaan, StatusKehadiran } from "@/lib/types";

export type StatusSesi = "sudah_diisi" | "terbuka" | "belum_dibuka" | "terkunci";

export type BarisRiwayat =
  | { jenis: "hadir"; sesi: SesiPembinaan; presensi: Presensi }
  | { jenis: "tidak_mengisi"; sesi: SesiPembinaan };

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

const dua = (n: number) => String(n).padStart(2, "0");

// Waktu lokal "yyyy-mm-ddTHH:mm". Panggil hanya dari useEffect atau event handler.
export function waktuSekarang(): string {
  const d = new Date();
  return `${d.getFullYear()}-${dua(d.getMonth() + 1)}-${dua(d.getDate())}T${dua(d.getHours())}:${dua(d.getMinutes())}`;
}

// Diformat dari teksnya, bukan lewat Date, supaya server dan browser menampilkan hal yang sama
export function formatWaktu(waktu: string) {
  const [tgl, jam] = waktu.split("T");
  const [tahun, bulan, hari] = tgl.split("-").map(Number);
  return { tanggal: `${hari} ${BULAN[bulan - 1]} ${tahun}`, jam: jam.replace(":", ".") };
}

export function labelSesi(sesi: SesiPembinaan) {
  return `Sesi ${sesi.urutan}: ${sesi.judul}`;
}

export function catatanWajib(status: StatusKehadiran) {
  return status !== "tepat_waktu";
}

export function statusSesi(sesi: SesiPembinaan, presensi: Presensi[], sekarang: string): StatusSesi {
  if (presensi.some((p) => p.sesiId === sesi.id)) return "sudah_diisi";
  if (sesi.akses === "belum_dibuka") return "belum_dibuka";
  if (sesi.akses === "ditutup" || sekarang > sesi.batasPengisian) return "terkunci";
  return "terbuka";
}

// Sesi terkunci yang tidak diisi muncul sebagai baris "Tidak mengisi"
export function susunRiwayat(
  sesiList: SesiPembinaan[],
  presensi: Presensi[],
  sekarang: string | null,
): BarisRiwayat[] {
  return sesiList.flatMap<BarisRiwayat>((sesi) => {
    const p = presensi.find((x) => x.sesiId === sesi.id);
    if (p) return [{ jenis: "hadir", sesi, presensi: p }];
    if (sekarang && statusSesi(sesi, presensi, sekarang) === "terkunci") {
      return [{ jenis: "tidak_mengisi", sesi }];
    }
    return [];
  });
}