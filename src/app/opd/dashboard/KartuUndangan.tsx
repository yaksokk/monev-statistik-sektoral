import { ExternalLink, Mail } from "lucide-react";

interface Props {
  judul: string;
  tanggal: string | null; // ISO yyyy-mm-dd
  link: string | null; // null bila belum ada atau bukan https
}

function formatTanggal(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function KartuUndangan({ judul, tanggal, link }: Props) {
  const keterangan = !link
    ? "Belum dikirim admin"
    : tanggal
      ? formatTanggal(tanggal)
      : "Dari BPS";

  return (
    <section
      aria-label="Surat undangan"
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border bg-white px-4 py-2.5 shadow-sm"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <Mail className="size-5 shrink-0 text-navy-600" aria-hidden />
        <p className="min-w-0 truncate text-sm">
          <span className="font-semibold text-navy-800">{judul}</span>
          <span className="text-ink-muted"> · {keterangan}</span>
        </p>
      </div>

      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-navy-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-700"
        >
          Buka Surat
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      ) : (
        <span className="shrink-0 text-xs text-ink-muted">Belum tersedia</span>
      )}
    </section>
  );
}   