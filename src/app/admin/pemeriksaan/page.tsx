import { DOKUMEN_LIST, ITEM_LIST, KEGIATAN_LIST, OPD_LIST, TAHAP_LIST } from "@/data/dummy";
import { PemeriksaanClient } from "./PemeriksaanClient";

export default function PemeriksaanAdmin() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Pemeriksaan dokumen</h1>
      <p className="mt-1 text-ink-muted">
        Periksa dokumen yang diunggah OPD, lalu setujui atau minta revisi.
      </p>
      <div className="mt-6">
        <PemeriksaanClient
          dokumenAwal={DOKUMEN_LIST}
          opdList={OPD_LIST}
          tahapList={TAHAP_LIST}
          itemList={ITEM_LIST}
          kegiatanList={KEGIATAN_LIST}
        />
      </div>
    </div>
  );
}