import { ambilBabSelesaiSemua, ambilBabModul, ambilModul } from "@/lib/data/modul";
import { ambilDaftarOpd, ambilPegawaiOpd } from "@/lib/data/opd";
import ModulAdminClient from "./ModulAdminClient";

export default async function KelolaModulPage() {
  const [opdList, semuaPegawai, modul] = await Promise.all([
    ambilDaftarOpd(),
    ambilPegawaiOpd(),
    ambilModul(),
  ]);
  const babList = modul ? await ambilBabModul(modul.id) : [];

  // Urut per OPD lalu nama, supaya daftar di Pantauan stabil
  const namaOpd = new Map(opdList.map((o) => [o.id, o.nama]));
  const pegawaiList = semuaPegawai
    .filter((p) => p.peran === "operator" && p.opdId)
    .sort(
      (a, b) =>
        (namaOpd.get(a.opdId!) ?? "").localeCompare(namaOpd.get(b.opdId!) ?? "", "id") ||
        a.nama.localeCompare(b.nama, "id"),
    );

  const selesaiList = await ambilBabSelesaiSemua(new Map(pegawaiList.map((p) => [p.id, p.opdId!])));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Kelola Modul</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Atur modul dan bab beserta link materi, lalu pantau pegawai yang sudah menyelesaikan tiap bab.
        </p>
      </header>

      <ModulAdminClient
        opdList={opdList}
        pegawaiList={pegawaiList}
        modul={modul ?? undefined}
        babList={babList}
        selesaiList={selesaiList}
      />
    </div>
  );
}