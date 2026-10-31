import { formatWaktu } from "@/lib/presensi";
import type { Kegiatan } from "@/lib/types";
import PilihKegiatan from "./PilihKegiatan";

// "2026-10-01" -> "1 Okt 2026" (diformat dari teks, aman untuk server dan browser)
const tanggal = (iso: string) => formatWaktu(`${iso}T00:00`).tanggal;

function labelDropdown(k: Kegiatan) {
  if (k.arsip) return `${k.nama} (Arsip)`;
  if (k.aktif) return `${k.nama} (Aktif)`;
  return k.nama;
}

export default function HeaderKegiatan({
  kegiatan,
  daftar,
}: {
  kegiatan: Kegiatan | undefined; // undefined = belum ada kegiatan aktif
  daftar: Kegiatan[];
}) {
  return (
    <section
      aria-label="Kegiatan"
      className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <div className="min-w-0">
        {kegiatan ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{kegiatan.nama}</h2>
              {kegiatan.arsip && (
                <span className="rounded-full bg-status-belum-bg px-2.5 py-1 text-xs font-medium text-status-belum-fg">
                  Arsip
                </span>
              )}
              {kegiatan.aktif && (
                <span className="rounded-full bg-status-disetujui-bg px-2.5 py-1 text-xs font-medium text-status-disetujui-fg">
                  Aktif
                </span>
              )}
            </div>
            <p className="tabular mt-1 text-sm text-ink-muted">
              {tanggal(kegiatan.tanggalMulai)} – {tanggal(kegiatan.tanggalSelesai)}
              {kegiatan.arsip && " · Kegiatan arsip, hanya bisa dilihat"}
            </p>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-ink">Belum ada kegiatan aktif</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Aktifkan kegiatan di Kelola Kegiatan, atau pilih kegiatan lain untuk dilihat.
            </p>
          </>
        )}
      </div>

      {daftar.length > 0 && (
        <PilihKegiatan
          terpilihId={kegiatan?.id ?? null}
          daftar={daftar.map((k) => ({ id: k.id, label: labelDropdown(k) }))}
        />
      )}
    </section>
  );
}