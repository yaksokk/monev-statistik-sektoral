"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { waktuSekarang } from "@/lib/presensi";
import { JENIS_QUIZ, LABEL_QUIZ, cariPengaturan, soalQuiz } from "@/lib/quiz";
import type {
  HasilQuiz,
  IzinKerjaUlang,
  JenisQuiz,
  Kegiatan,
  LogPerubahanQuiz,
  Opd,
  PengaturanQuiz,
  Pengguna,
  SoalQuiz,
} from "@/lib/types";
import {
  beriIzinKerjaUlang,
  geserSoalQuiz,
  hapusSoalQuiz,
  simpanPengaturanQuiz,
  simpanSoalQuiz,
  ubahAktifSoalQuiz,
} from "./actions";
import TabQuiz, { type AksiTabQuiz, type DataSoal, type EditTerkunci } from "./TabQuiz";
import TabRekap, { type TargetIzin } from "./TabRekap";

type NamaTab = JenisQuiz | "rekap";

// Semua data berasal dari server dan sudah difilter untuk kegiatan ini. Setelah tiap aksi,
// halaman disegarkan server (revalidatePath), jadi tidak ada salinan data di state.
type Props = {
  kegiatan: Kegiatan;
  opdList: Opd[];
  penggunaList: Pengguna[];
  soalList: SoalQuiz[];
  pengaturanList: PengaturanQuiz[];
  hasilList: HasilQuiz[];
  izinList: IzinKerjaUlang[];
  logList: LogPerubahanQuiz[];
};

export default function QuizAdminClient({
  kegiatan: kg,
  opdList,
  penggunaList,
  soalList,
  pengaturanList,
  hasilList,
  izinList,
  logList,
}: Props) {
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [tab, setTab] = useState<NamaTab>("pretest");
  const [pesan, setPesan] = useState("");

  // Waktu dihitung di browser, diperbarui tiap 30 detik agar status quiz ikut berubah
    useEffect(() => {
    const awal = setTimeout(() => setSekarang(waktuSekarang()), 0);
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => {
      clearTimeout(awal);
      clearInterval(timer);
    };
  }, []);

  const arsip = !!kg.arsip;

  // Semua aksi mengembalikan teks galat, atau null bila berhasil
  async function simpanPengaturan(jenis: JenisQuiz, m: Parameters<AksiTabQuiz["simpanPengaturan"]>[0]) {
    const r = await simpanPengaturanQuiz(kg.id, jenis, m);
    if (!r.ok) return r.pesan;
    setPesan(`Pengaturan ${LABEL_QUIZ[jenis]} disimpan.`);
    return null;
  }

  async function tambahSoal(jenis: JenisQuiz, d: DataSoal) {
    const r = await simpanSoalQuiz(kg.id, jenis, null, d);
    if (!r.ok) return r.pesan;
    setPesan(`Soal ditambahkan ke ${LABEL_QUIZ[jenis]}.`);
    return null;
  }

  async function ubahSoal(jenis: JenisQuiz, id: string, d: DataSoal) {
    const r = await simpanSoalQuiz(kg.id, jenis, id, d);
    if (!r.ok) return r.pesan;
    setPesan("Soal diperbarui.");
    return null;
  }

  async function hapusSoal(id: string) {
    const r = await hapusSoalQuiz(id);
    if (!r.ok) return r.pesan;
    setPesan(
      r.waktuBukaDikosongkan
        ? "Soal dihapus. Waktu buka dikosongkan karena tidak ada soal aktif."
        : "Soal dihapus.",
    );
    return null;
  }

  async function geser(id: string, arah: -1 | 1) {
    const r = await geserSoalQuiz(id, arah);
    return r.ok ? null : r.pesan;
  }

  // Setelah quiz dibuka: hanya teks soal, pembahasan, dan kunci yang boleh berubah (opsi tetap)
  async function editTerkunci(jenis: JenisQuiz, id: string, d: EditTerkunci) {
    const s = soalList.find((x) => x.id === id);
    if (!s) return "Soal tidak ditemukan.";
    const kunciBerubah = s.kunci !== d.kunci;
    const teksBerubah = s.pertanyaan !== d.pertanyaan || s.pembahasan !== d.pembahasan;
    if (!kunciBerubah && !teksBerubah) return null;

    const r = await simpanSoalQuiz(kg.id, jenis, id, {
      pertanyaan: d.pertanyaan,
      opsi: s.opsi,
      kunci: d.kunci,
      pembahasan: d.pembahasan,
    });
    if (!r.ok) return r.pesan;
    setPesan(kunciBerubah ? "Soal diperbarui, nilai OPD dihitung ulang." : "Soal diperbarui.");
    return null;
  }

  async function ubahAktif(id: string, aktif: boolean) {
    const r = await ubahAktifSoalQuiz(id, aktif);
    if (!r.ok) return r.pesan;
    setPesan(aktif ? "Soal diaktifkan." : "Soal dinonaktifkan, nilai OPD dihitung ulang.");
    return null;
  }

  async function berikanIzin(target: TargetIzin[]) {
    const r = await beriIzinKerjaUlang(kg.id, target);
    if (!r.ok) return r.pesan;
    setPesan(`${target.length} pegawai diizinkan mengerjakan ulang.`);
    return null;
  }

  function aksiUntuk(jenis: JenisQuiz): AksiTabQuiz {
    return {
      simpanPengaturan: (m) => simpanPengaturan(jenis, m),
      tambahSoal: (d) => tambahSoal(jenis, d),
      ubahSoal: (id, d) => ubahSoal(jenis, id, d),
      hapusSoal: (id) => hapusSoal(id),
      geser: (id, arah) => geser(id, arah),
      editTerkunci: (id, d) => editTerkunci(jenis, id, d),
      ubahAktif: (id, aktif) => ubahAktif(id, aktif),
    };
  }

  const daftarTab: { id: NamaTab; label: string }[] = [
    ...JENIS_QUIZ.map((j) => ({ id: j, label: LABEL_QUIZ[j] })),
    { id: "rekap", label: "Rekap Hasil" },
  ];

  return (
    <div className="space-y-6">

      <p role="status" className="min-h-5 text-sm text-ink-muted">
        {pesan}
      </p>

      <div role="tablist" aria-label="Bagian Kelola Quiz" className="flex flex-wrap gap-1 border-b border-line">
        {daftarTab.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "rekap" ? (
          <TabRekap
            key={kg.id}
            kegiatan={kg}
            arsip={arsip}
            opdList={opdList}
            penggunaList={penggunaList}
            soalList={soalList}
            pengaturanList={pengaturanList}
            hasil={hasilList}
            izin={izinList}
            sekarang={sekarang}
            onIzin={berikanIzin}
          />
        ) : (
          <TabQuiz
            key={`${kg.id}:${tab}`}
            jenis={tab}
            kegiatan={kg}
            arsip={arsip}
            totalPegawai={penggunaList.length}
            pengaturan={cariPengaturan(pengaturanList, kg.id, tab)}
            soal={soalQuiz(soalList, kg.id, tab)}
            hasil={hasilList.filter((h) => h.quizId === tab)}
            log={logList.filter((l) => l.quizId === tab)}
            sekarang={sekarang}
            aksi={aksiUntuk(tab)}
          />
        )}
      </div>

      {arsip && tab === "rekap" && (
        <p className="text-sm text-ink-muted">
          Kegiatan diarsipkan, jadi rekap hanya bisa dilihat.{" "}
          <Link href="/admin/kegiatan" className="font-medium text-primary underline">
            Kelola Kegiatan
          </Link>
        </p>
      )}
    </div>
  );
}