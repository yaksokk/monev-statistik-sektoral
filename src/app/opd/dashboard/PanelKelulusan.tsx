import { Award, Check, Download, X } from "lucide-react";
import { AMBANG_POSTTEST } from "@/lib/dashboard";

interface Props {
  persenKehadiran: number;
  ambangKehadiran: number | null; // null bila tidak ada kegiatan aktif
  teksNilaiPost: string; // nilai atau "Belum"
  syarat: { presensi: boolean; postTest: boolean; evaluasi: boolean };
  lulus: boolean;
  linkSertifikat: string | null; // null bila syarat belum terpenuhi atau link belum ada
}

function BarisSyarat({
  label,
  nilai,
  terpenuhi,
}: {
  label: string;
  nilai: string;
  terpenuhi: boolean;
}) {
  const Ikon = terpenuhi ? Check : X;
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-4 py-3 text-sm text-ink">
      {label}
      <span
        className={`inline-flex items-center gap-1.5 font-semibold ${
          terpenuhi ? "text-status-disetujui-fg" : "text-status-revisi-fg"
        }`}
      >
        <span
          className={`flex size-4 items-center justify-center rounded-full ${
            terpenuhi ? "bg-status-disetujui-bg" : "bg-status-revisi-bg"
          }`}
        >
          <Ikon className="size-3" aria-hidden />
        </span>
        <span className="tabular">{nilai}</span>
      </span>
    </li>
  );
}

export default function PanelKelulusan({
  persenKehadiran,
  ambangKehadiran,
  teksNilaiPost,
  syarat,
  lulus,
  linkSertifikat,
}: Props) {
  // ambang mengikuti kegiatan aktif
  const teksAmbang = ambangKehadiran === null ? "sesuai ketentuan kegiatan" : `${ambangKehadiran}%`;

  return (
    <section
      aria-labelledby="judul-kelulusan"
      className="flex flex-col rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <h2 id="judul-kelulusan" className="flex items-center gap-2 text-lg font-semibold text-ink">
        <Award className="size-5 text-status-menunggu-fg" aria-hidden />
        Status Kelulusan &amp; Sertifikasi
      </h2>

      <p className="mt-3 text-sm text-ink-muted">
        Syarat kelulusan pembinaan: Kehadiran minimal {teksAmbang}, Menyelesaikan Pre-Test
        &amp; Post-Test dengan Nilai Post-Test ≥ {AMBANG_POSTTEST}, serta menyelesaikan Evaluasi
        Pendalaman.
      </p>

      <ul className="mt-4 space-y-2.5">
        <BarisSyarat
          label={ambangKehadiran === null ? "Presensi" : `Presensi Min. ${ambangKehadiran}%`}
          nilai={`${Math.round(persenKehadiran)}%`}
          terpenuhi={syarat.presensi}
        />
        <BarisSyarat
          label={`Post-Test (≥ ${AMBANG_POSTTEST})`}
          nilai={teksNilaiPost}
          terpenuhi={syarat.postTest}
        />
        <BarisSyarat
          label="Evaluasi Pendalaman Selesai"
          nilai={syarat.evaluasi ? "Selesai" : "Belum"}
          terpenuhi={syarat.evaluasi}
        />
      </ul>

      <div className="mt-auto pt-6">
        {linkSertifikat ? (
          <a
            href={linkSertifikat}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-base font-semibold text-white hover:bg-primary-hover"
          >
            <Download className="size-5" aria-hidden />
            Unduh Sertifikat Pembinaan SDI
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-line px-4 py-3.5 text-base font-semibold text-ink-muted"
          >
            <Download className="size-5" aria-hidden />
            Unduh Sertifikat Pembinaan SDI
          </button>
        )}

        {lulus && !linkSertifikat && (
          <p className="mt-2 text-center text-sm text-ink-muted">Link sertifikat belum tersedia</p>
        )}
      </div>
    </section>
  );
}