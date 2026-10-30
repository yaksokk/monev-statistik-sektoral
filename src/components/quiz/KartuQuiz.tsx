import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { formatNilai, hitungHasil, soalAktif, statusQuiz } from "@/lib/quiz";
import type { HasilQuiz, PengaturanQuiz, SoalQuiz } from "@/lib/types";

interface Props {
  nama: string; // "Pre-Test" atau "Post-Test"
  deskripsi: string;
  href: string; // halaman pengerjaan dan hasil quiz
  pengaturan: PengaturanQuiz | undefined; // undefined = admin belum mengatur quiz ini
  soalList: SoalQuiz[];
  hasil: HasilQuiz | null;
  sekarang: string; // yyyy-mm-ddTHH:mm
  diizinkan?: boolean; // OPD punya izin kerjakan ulang dari admin
  prasyarat?: { terpenuhi: boolean; pesan: string };
}

const KELAS_TOMBOL =
  "mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover";

export default function KartuQuiz({
  nama,
  deskripsi,
  href,
  pengaturan,
  soalList,
  hasil,
  sekarang,
  diizinkan = true,
  prasyarat,
}: Props) {
  const status = pengaturan
    ? statusQuiz(pengaturan, hasil !== null, sekarang, diizinkan)
    : "belum_dibuka";
  const pesanSyarat = prasyarat && !prasyarat.terpenuhi ? prasyarat.pesan : null;
  const idJudul = `judul-${nama.toLowerCase().replace(/\s+/g, "-")}`;

  let pesan: string | null = pesanSyarat;
  if (!pesan && status === "belum_dibuka") pesan = `${nama} belum dibuka oleh admin.`;
  if (!pesan && status === "terkunci") pesan = `${nama} sudah ditutup dan tidak bisa dikerjakan lagi.`;

  const ringkasan = hasil ? hitungHasil(soalList, hasil.jawaban) : null;

  return (
    <section
      aria-labelledby={idJudul}
      className="rounded-card border border-line bg-surface p-5 shadow-card"
    >
      <h2 id={idJudul} className="flex items-center gap-2 text-lg font-semibold text-ink">
        <ClipboardList className="size-5 text-navy-500" aria-hidden />
        {nama}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{deskripsi}</p>

      {ringkasan ? (
        <>
          <dl className="mt-4 grid max-w-md gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-primary-soft p-4">
              <dt className="text-sm text-ink-muted">Nilai</dt>
              <dd className="tabular text-3xl font-semibold text-primary">
                {formatNilai(ringkasan.nilai)}
              </dd>
            </div>
            <div className="rounded-lg bg-status-disetujui-bg p-4">
              <dt className="text-sm text-status-disetujui-fg">Jawaban benar</dt>
              <dd className="tabular text-3xl font-semibold text-status-disetujui-fg">
                {ringkasan.benar}
                <span className="text-base font-normal"> dari {ringkasan.total}</span>
              </dd>
            </div>
          </dl>
          <Link href={href} className={KELAS_TOMBOL}>
            Lihat Hasil &amp; Review
          </Link>
        </>
      ) : (
        <>
          {pengaturan && (
            <p className="tabular mt-4 text-sm text-ink">
              {soalAktif(soalList).length} soal · {pengaturan.durasiMenit} menit · hanya bisa dikerjakan satu
              kali
            </p>
          )}
          {pesan ? (
            <p className="mt-3 rounded-lg bg-surface-muted px-3 py-2 text-sm text-ink-muted">
              {pesan}
            </p>
          ) : (
            <Link href={href} className={KELAS_TOMBOL}>
              Mulai Mengerjakan
            </Link>
          )}
        </>
      )}
    </section>
  );
}