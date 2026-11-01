import { OPD_LIST, PENGGUNA_LIST } from "@/data/dummy";
import { BAB_LIST, BAB_SELESAI_LIST, MODUL_LIST } from "@/data/modul";
import ModulAdminClient from "./ModulAdminClient";

export default function KelolaModulPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Modul</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur modul dan bab beserta link materi, lalu pantau OPD yang sudah menyelesaikan tiap bab.
        </p>
      </header>

      <ModulAdminClient
        opdList={OPD_LIST}
        pegawaiList={PENGGUNA_LIST.filter((p) => p.peran === "operator" && p.opdId)}
        modulAwal={MODUL_LIST}
        babAwal={BAB_LIST}
        selesaiAwal={BAB_SELESAI_LIST}
      />
    </div>
  );
}