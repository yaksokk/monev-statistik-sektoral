import { Suspense } from "react";
import Link from "next/link";
import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, OPD_LIST, TAHAP_LIST } from "@/data/dummy";
import DaftarDokumenClient, { type BarisDokumen } from "./DaftarDokumenClient";

type SearchParams = Promise<{ kegiatan?: string }>;

export default function HalamanDokumenPimpinan({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dokumen OPD</h1>
      <p className="mt-1 text-ink-muted">
        Pantau dokumen yang masih kurang, perlu revisi, dan sudah lengkap.
      </p>

      {/* isi bergantung pada ?kegiatan=, jadi dialirkan di balik Suspense */}
      <Suspense fallback={<p className="mt-6 text-sm text-ink-muted">Memuat dokumen…</p>}>
        <IsiDokumen searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function IsiDokumen({ searchParams }: { searchParams: SearchParams }) {
  const { kegiatan: kegiatanParam } = await searchParams;
  const kegiatan = KEGIATAN_LIST.find((k) => k.id === kegiatanParam) ?? KEGIATAN_LIST[0];

  // gabungkan dokumen dengan nama OPD, tahap, dan item
  const dokumenBaris: BarisDokumen[] = [];
  for (const d of DOKUMEN_LIST) {
    if (d.kegiatanId !== kegiatan.id) continue;
    const opd = OPD_LIST.find((o) => o.id === d.opdId);
    const item = ITEM_LIST.find((i) => i.id === d.itemId);
    const tahap = TAHAP_LIST.find((t) => t.id === d.tahapId);
    if (!opd || !item || !tahap) continue;

    dokumenBaris.push({
      id: d.id,
      opdId: opd.id,
      opdNama: opd.nama,
      opdSingkatan: opd.singkatan,
      tahapId: tahap.id,
      tahapNama: tahap.nama,
      itemNama: item.nama,
      status: d.status,
      namaFile: d.namaFile,
      diunggahPada: d.diunggahPada,
      catatanRevisi: d.catatanRevisi,
    });
  }

  return (
    <>
      {/* pilih kegiatan */}
      <div className="mt-6 flex flex-wrap gap-2">
        {KEGIATAN_LIST.map((k) => {
          const aktif = k.id === kegiatan.id;
          return (
            <Link
              key={k.id}
              href={`/pimpinan/dokumen?kegiatan=${k.id}`}
              aria-current={aktif ? "page" : undefined}
              className={
                aktif
                  ? "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                  : "rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink-muted hover:bg-surface-muted"
              }
            >
              {k.nama}
            </Link>
          );
        })}
      </div>

      <DaftarDokumenClient
        key={kegiatan.id}
        dokumen={dokumenBaris}
        tahap={TAHAP_LIST.map((t) => ({ id: t.id, nama: t.nama }))}
        tenggat={kegiatan.tenggat}
      />
    </>
  );
}