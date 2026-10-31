import { formatWaktu } from "@/lib/presensi";
import type { Kegiatan } from "@/lib/types";

// "2026-10-01" -> "1 Okt 2026" (diformat dari teks, aman untuk server dan browser)
const tanggal = (iso: string) => formatWaktu(`${iso}T00:00`).tanggal;

export default function HeaderKegiatan({
  kegiatan,
}: {
  kegiatan: Kegiatan | undefined; // undefined = belum ada kegiatan aktif
}) {
  return (
    <section
      aria-label="Kegiatan"
      className="mt-6 rounded-card border border-line bg-surface p-5 shadow-card"
    >
      {kegiatan ? (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-ink">{kegiatan.nama}</h2>
            <span className="rounded-full bg-status-disetujui-bg px-2.5 py-1 text-xs font-medium text-status-disetujui-fg">
              Aktif
            </span>
          </div>
          <p className="tabular mt-1 text-sm text-ink-muted">
            {tanggal(kegiatan.tanggalMulai)} – {tanggal(kegiatan.tanggalSelesai)}
          </p>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-ink">Belum ada kegiatan aktif</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Aktifkan kegiatan di Kelola Kegiatan.
          </p>
        </>
      )}
    </section>
  );
}