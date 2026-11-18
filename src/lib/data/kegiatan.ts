import "server-only";
import { buatKlienServer } from "@/lib/supabase/server";
import type { ItemDokumen, Kegiatan } from "@/lib/types";

type BarisKegiatan = {
  id: string;
  nama: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  tenggat: string;
  status: "draf" | "aktif" | "arsip";
  bobot: number;
  ambang_kehadiran: number;
  pretest_aktif: boolean;
  posttest_aktif: boolean;
};

type BarisItem = { id: string; kegiatan_id: string; nama: string };

type BarisRingkasan = {
  kegiatan_id: string;
  jumlah_item: number;
  jumlah_sesi: number;
  jumlah_soal: number;
  hasil_pretest: number;
  hasil_posttest: number;
  berdata: boolean;
};

export type RingkasanKegiatan = {
  kegiatanId: string;
  jumlahItem: number;
  jumlahSesi: number;
  jumlahSoal: number;
  hasilPretest: number; // jumlah OPD yang sudah mengerjakan
  hasilPosttest: number;
  berdata: boolean; // true = tidak boleh dihapus
};

// snake_case database -> camelCase types.ts. Kolom status dipecah jadi aktif/arsip (draf = keduanya false)
export function petakanKegiatan(b: BarisKegiatan): Kegiatan {
  return {
    id: b.id,
    nama: b.nama,
    tanggalMulai: b.tanggal_mulai,
    tanggalSelesai: b.tanggal_selesai,
    tenggat: b.tenggat,
    aktif: b.status === "aktif",
    arsip: b.status === "arsip",
    bobot: b.bobot,
    ambangKehadiran: b.ambang_kehadiran,
    preTestAktif: b.pretest_aktif,
    postTestAktif: b.posttest_aktif,
  };
}

export function petakanItem(b: BarisItem): ItemDokumen {
  return { id: b.id, kegiatanId: b.kegiatan_id, nama: b.nama };
}

// Sesi admin: RLS mengizinkan admin membaca semua kegiatan
export async function ambilDaftarKegiatan(): Promise<Kegiatan[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kegiatan")
    .select(
      "id, nama, tanggal_mulai, tanggal_selesai, tenggat, status, bobot, ambang_kehadiran, pretest_aktif, posttest_aktif",
    )
    .order("tanggal_mulai")
    .order("dibuat_pada");
  if (error) throw new Error(`Gagal membaca kegiatan: ${error.message}`);
  return (data as BarisKegiatan[]).map(petakanKegiatan);
}

export async function ambilItemDokumen(): Promise<ItemDokumen[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("item_dokumen")
    .select("id, kegiatan_id, nama")
    .order("kegiatan_id")
    .order("urutan");
  if (error) throw new Error(`Gagal membaca item dokumen: ${error.message}`);
  return (data as BarisItem[]).map(petakanItem);
}

export async function ambilRingkasanKegiatan(): Promise<RingkasanKegiatan[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("ringkasan_kegiatan");
  if (error) throw new Error(`Gagal membaca ringkasan kegiatan: ${error.message}`);
  return (data as BarisRingkasan[]).map((b) => ({
    kegiatanId: b.kegiatan_id,
    jumlahItem: b.jumlah_item,
    jumlahSesi: b.jumlah_sesi,
    jumlahSoal: b.jumlah_soal,
    hasilPretest: b.hasil_pretest,
    hasilPosttest: b.hasil_posttest,
    berdata: b.berdata,
  }));
}

// Id item yang sudah punya dokumen disetujui
export async function ambilIdItemBerdata(): Promise<string[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase.rpc("daftar_item_berdata");
  if (error) throw new Error(`Gagal membaca data item: ${error.message}`);
  return (data as { item_id: string }[]).map((b) => b.item_id);
}

const KOLOM_KEGIATAN =
  "id, nama, tanggal_mulai, tanggal_selesai, tenggat, status, bobot, ambang_kehadiran, pretest_aktif, posttest_aktif";

// Kegiatan berstatus aktif (paling banyak satu). Pegawai dan admin sama-sama bisa membacanya lewat RLS
export async function ambilKegiatanAktif(): Promise<Kegiatan | null> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("kegiatan")
    .select(KOLOM_KEGIATAN)
    .eq("status", "aktif")
    .maybeSingle();
  if (error) throw new Error(`Gagal membaca kegiatan aktif: ${error.message}`);
  return data ? petakanKegiatan(data as BarisKegiatan) : null;
}

export async function ambilItemKegiatan(kegiatanId: string): Promise<ItemDokumen[]> {
  const supabase = await buatKlienServer();
  const { data, error } = await supabase
    .from("item_dokumen")
    .select("id, kegiatan_id, nama")
    .eq("kegiatan_id", kegiatanId)
    .order("urutan");
  if (error) throw new Error(`Gagal membaca item dokumen: ${error.message}`);
  return (data as BarisItem[]).map(petakanItem);
}