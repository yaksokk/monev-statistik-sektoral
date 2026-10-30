import type { Kegiatan, Presensi, SesiPembinaan, StatusKehadiran } from "@/lib/types";

// Status sesi menurut waktu saja
export type StatusSesi = "belum_dibuka" | "dibuka" | "ditutup";

// Status sesi dari sisi satu OPD: ditambah "sudah diisi"
export type StatusSesiOpd = "sudah_diisi" | "terbuka" | "belum_dibuka" | "terkunci";

export type BarisRiwayat =
  | { jenis: "hadir"; sesi: SesiPembinaan; presensi: Presensi }
  | { jenis: "tidak_mengisi"; sesi: SesiPembinaan };

// Nilai awal ambang saat kegiatan baru dibuat; ambang berlaku diambil dari Kegiatan.ambangKehadiran
export const AMBANG_KEHADIRAN_AWAL = 75;

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

// Sesi milik satu kegiatan, urut sesuai urutan pembuatan
export function sesiKegiatan(sesiList: SesiPembinaan[], kegiatanId: string) {
  return sesiList.filter((s) => s.kegiatanId === kegiatanId).sort((a, b) => a.urutan - b.urutan);
}

// Dihitung dari waktu, tidak disimpan. Format waktu yyyy-mm-ddTHH:mm bisa dibandingkan sebagai teks
export function statusSesi(sesi: SesiPembinaan, sekarang: string): StatusSesi {
  if (sesi.waktuBuka && sekarang < sesi.waktuBuka) return "belum_dibuka";
  if (sesi.batasPengisian && sekarang > sesi.batasPengisian) return "ditutup";
  return "dibuka";
}

// presensi = kehadiran satu OPD
export function statusSesiOpd(
  sesi: SesiPembinaan,
  presensi: Presensi[],
  sekarang: string,
): StatusSesiOpd {
  if (presensi.some((p) => p.sesiId === sesi.id)) return "sudah_diisi";
  const status = statusSesi(sesi, sekarang);
  if (status === "belum_dibuka") return "belum_dibuka";
  return status === "ditutup" ? "terkunci" : "terbuka";
}

// Penyebut = semua sesi kegiatan. Hanya hadir tepat waktu dan terlambat yang dihitung hadir.
// sesiList = sesi satu kegiatan; presensi boleh berisi data semua OPD dan kegiatan.
export function hitungKehadiran(opdId: string, sesiList: SesiPembinaan[], presensi: Presensi[]) {
  const hadir = sesiList.filter((s) =>
    presensi.some(
      (p) =>
        p.opdId === opdId &&
        p.sesiId === s.id &&
        (p.status === "tepat_waktu" || p.status === "terlambat"),
    ),
  ).length;
  const total = sesiList.length;
  return { hadir, total, persen: total === 0 ? 0 : (hadir * 100) / total };
}

export function apakahLulusKehadiran(persen: number, kegiatan: Pick<Kegiatan, "ambangKehadiran">) {
  return persen >= kegiatan.ambangKehadiran;
}

// Sesi ditutup yang tidak diisi muncul sebagai baris "Tidak mengisi"
export function susunRiwayat(
  sesiList: SesiPembinaan[],
  presensi: Presensi[],
  sekarang: string | null,
): BarisRiwayat[] {
  return sesiList.flatMap<BarisRiwayat>((sesi) => {
    const p = presensi.find((x) => x.sesiId === sesi.id);
    if (p) return [{ jenis: "hadir", sesi, presensi: p }];
    if (sekarang && statusSesi(sesi, sekarang) === "ditutup") {
      return [{ jenis: "tidak_mengisi", sesi }];
    }
    return [];
  });
}