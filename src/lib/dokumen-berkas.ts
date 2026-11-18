// Aturan berkas dokumen; dipakai klien (sebelum unggah) dan server action (validasi ulang)

export const BUCKET_DOKUMEN = "dokumen-opd";
export const MAKS_MB = 2;
export const MAKS_BYTE = MAKS_MB * 1024 * 1024;

export const MIME_EKSTENSI: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function ekstensiDari(nama: string): string | null {
  const e = /\.([a-z0-9]+)$/i.exec(nama.trim())?.[1].toLowerCase();
  return e && Object.hasOwn(MIME_EKSTENSI, e) ? e : null;
}

export function cekBerkas(nama: string, ukuran: number): string | null {
  if (!ekstensiDari(nama)) return "Format harus PDF, JPG, atau PNG.";
  if (ukuran <= 0) return "File kosong.";
  if (ukuran > MAKS_BYTE) return `Ukuran file maksimal ${MAKS_MB} MB.`;
  return null;
}

// <id pegawai>/<id item>/<uuid>.<ext>; nama asli hanya disimpan di kolom nama_file
export function buatPathDokumen(penggunaId: string, itemId: string, ext: string): string {
  return `${penggunaId}/${itemId}/${crypto.randomUUID()}.${ext}`;
}

// Kedua id harus sudah divalidasi sebagai UUID sebelum dipakai di sini
export function polaPathDokumen(penggunaId: string, itemId: string): RegExp {
  return new RegExp(`^${penggunaId}/${itemId}/[0-9a-f-]{36}\\.(pdf|jpg|jpeg|png)$`, "i");
}