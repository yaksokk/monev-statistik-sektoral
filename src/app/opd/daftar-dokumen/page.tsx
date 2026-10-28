import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST } from "@/data/dummy";
import { ambilOperator } from "@/lib/operator";
import DaftarDokumenClient from "./DaftarDokumenClient";

export default async function DaftarDokumenPage() {
  const { opd } = await ambilOperator();

  // OPD hanya melihat kegiatan yang sedang aktif (ditentukan admin)
  const kegiatan = KEGIATAN_LIST.find((k) => k.aktif);

  if (!kegiatan) {
    return (
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-ink">Daftar dokumen</h1>
        <p className="text-sm text-ink-muted">Belum ada kegiatan yang aktif.</p>
      </div>
    );
  }

  // hanya item dan dokumen milik kegiatan aktif dan OPD yang sedang login
  const item = ITEM_LIST.filter((i) => i.kegiatanId === kegiatan.id);
  const dokumen = DOKUMEN_LIST.filter(
    (d) => d.opdId === opd.id && d.kegiatanId === kegiatan.id,
  );

  return <DaftarDokumenClient opd={opd} kegiatan={kegiatan} item={item} dokumen={dokumen} />;
}