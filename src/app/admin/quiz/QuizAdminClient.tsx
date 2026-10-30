"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { waktuSekarang } from "@/lib/presensi";
import {
  JENIS_QUIZ,
  LABEL_QUIZ,
  cariPengaturan,
  soalAktif,
  soalBisaDiubah,
  soalQuiz,
  statusWaktuQuiz,
  type MasukanPengaturan,
} from "@/lib/quiz";
import type {
  HasilQuiz,
  IzinKerjaUlang,
  JenisQuiz,
  Kegiatan,
  LogPerubahanQuiz,
  Opd,
  PengaturanQuiz,
  SoalQuiz,
} from "@/lib/types";
import TabQuiz, { type AksiTabQuiz, type DataSoal } from "./TabQuiz";
import TabRekap, { type TargetIzin } from "./TabRekap";
import { kolomInput } from "./ui";

// Dummy, belum ada login. Ganti dengan nama admin dari sesi nanti
const NAMA_ADMIN = "Admin BPS";

type NamaTab = JenisQuiz | "rekap";

const angka = (id: string) => Number(id.replace(/\D/g, ""));

type Props = {
  kegiatanId: string;
  kegiatanAwal: Kegiatan[];
  opdList: Opd[];
  soalAwal: SoalQuiz[];
  pengaturanAwal: PengaturanQuiz[];
  hasilAwal: HasilQuiz[];
  izinAwal: IzinKerjaUlang[];
  logAwal: LogPerubahanQuiz[];
};

export default function QuizAdminClient({
  kegiatanId,
  kegiatanAwal,
  opdList,
  soalAwal,
  pengaturanAwal,
  hasilAwal,
  izinAwal,
  logAwal,
}: Props) {
  const router = useRouter();
  const [soalList, setSoalList] = useState(soalAwal);
  const [pengaturanList, setPengaturanList] = useState(pengaturanAwal);
  const [hasilList, setHasilList] = useState(hasilAwal);
  const [izinList, setIzinList] = useState(izinAwal);
  const [logList, setLogList] = useState(logAwal);
  const [sekarang, setSekarang] = useState<string | null>(null);
  const [tab, setTab] = useState<NamaTab>("pretest");
  const [pesan, setPesan] = useState("");

  // Waktu dihitung di browser, diperbarui tiap 30 detik agar status quiz ikut berubah
  useEffect(() => {
    setSekarang(waktuSekarang());
    const timer = setInterval(() => setSekarang(waktuSekarang()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const kegiatan = kegiatanAwal.find((k) => k.id === kegiatanId);
  if (!kegiatan) return null;
  const kg: Kegiatan = kegiatan;

  const arsip = !!kg.arsip;
  const soalKegiatan = soalList.filter((s) => s.kegiatanId === kg.id);
  const pengaturanKegiatan = pengaturanList.filter((p) => p.kegiatanId === kg.id);
  const hasilKegiatan = hasilList.filter((h) => h.kegiatanId === kg.id);
  const izinKegiatan = izinList.filter((i) => i.kegiatanId === kg.id);

  function bolehUbahSoal(jenis: JenisQuiz) {
    if (arsip || sekarang === null) return false;
    const jumlah = hasilKegiatan.filter((h) => h.quizId === jenis).length;
    return soalBisaDiubah(cariPengaturan(pengaturanList, kg.id, jenis), jumlah, sekarang);
  }

  function catatLog(
    entri: Omit<LogPerubahanQuiz, "id" | "kegiatanId" | "admin" | "waktu">[],
  ) {
    if (sekarang === null || entri.length === 0) return;
    const awal = logList.reduce((m, l) => Math.max(m, angka(l.id)), 0);
    setLogList((prev) => [
      ...prev,
      ...entri.map((e, i) => ({
        ...e,
        id: `log-${awal + i + 1}`,
        kegiatanId: kg.id,
        admin: NAMA_ADMIN,
        waktu: sekarang,
      })),
    ]);
  }

  function simpanPengaturan(jenis: JenisQuiz, m: MasukanPengaturan) {
    if (arsip || sekarang === null) return;
    const lama = cariPengaturan(pengaturanList, kg.id, jenis);
    // batas akhir pertama sudah lewat: sejak itu hanya OPD berizin yang boleh mulai
    const sudahTutup = !!lama && statusWaktuQuiz(lama, sekarang) === "ditutup";
    const baru: PengaturanQuiz = {
      id: jenis,
      kegiatanId: kg.id,
      judul: lama?.judul ?? `${LABEL_QUIZ[jenis]} ${kg.nama}`,
      durasiMenit: m.durasiMenit,
      waktuBuka: m.waktuBuka,
      batasAkhir: m.batasAkhir,
      hanyaBerizin: lama?.hanyaBerizin || sudahTutup || undefined,
    };
    setPengaturanList((prev) =>
      lama
        ? prev.map((p) => (p.kegiatanId === kg.id && p.id === jenis ? baru : p))
        : [...prev, baru],
    );
    setPesan(`Pengaturan ${LABEL_QUIZ[jenis]} disimpan.`);
  }

  function tambahSoal(jenis: JenisQuiz, d: DataSoal) {
    if (!bolehUbahSoal(jenis)) return;
    const no = soalList.reduce((m, s) => Math.max(m, angka(s.id)), 0) + 1;
    const urutan = soalQuiz(soalList, kg.id, jenis).length + 1;
    setSoalList((prev) => [
      ...prev,
      { ...d, id: `soal-${no}`, kegiatanId: kg.id, quizId: jenis, urutan, aktif: true },
    ]);
    setPesan(`Soal ditambahkan ke ${LABEL_QUIZ[jenis]}.`);
  }

  function ubahSoal(jenis: JenisQuiz, id: string, d: DataSoal) {
    if (!bolehUbahSoal(jenis)) return;
    setSoalList((prev) => prev.map((s) => (s.id === id ? { ...s, ...d } : s)));
    setPesan("Soal diperbarui.");
  }

  function hapusSoal(jenis: JenisQuiz, id: string) {
    if (!bolehUbahSoal(jenis)) return;
    const sisaAktif = soalAktif(soalQuiz(soalList, kg.id, jenis)).filter((s) => s.id !== id).length;
    setSoalList((prev) => {
      const sisa = prev.filter((s) => s.id !== id);
      const urutan = new Map(
        soalQuiz(sisa, kg.id, jenis).map((s, i) => [s.id, i + 1] as [string, number]),
      );
      return sisa.map((s) => (urutan.has(s.id) ? { ...s, urutan: urutan.get(s.id)! } : s));
    });
    // quiz tanpa soal aktif tidak boleh punya waktu buka
    const lama = cariPengaturan(pengaturanList, kg.id, jenis);
    const kosongkan = sisaAktif === 0 && !!lama?.waktuBuka;
    if (kosongkan) {
      setPengaturanList((prev) =>
        prev.map((p) => (p.kegiatanId === kg.id && p.id === jenis ? { ...p, waktuBuka: null } : p)),
      );
    }
    setPesan(kosongkan ? "Soal dihapus. Waktu buka dikosongkan karena tidak ada soal aktif." : "Soal dihapus.");
  }

  function geser(jenis: JenisQuiz, id: string, arah: -1 | 1) {
    if (!bolehUbahSoal(jenis)) return;
    const daftar = soalQuiz(soalList, kg.id, jenis);
    const i = daftar.findIndex((s) => s.id === id);
    const j = i + arah;
    if (i < 0 || j < 0 || j >= daftar.length) return;
    const a = daftar[i];
    const b = daftar[j];
    setSoalList((prev) =>
      prev.map((s) => (s.id === a.id ? { ...s, urutan: b.urutan } : s.id === b.id ? { ...s, urutan: a.urutan } : s)),
    );
  }

  function ubahKunci(jenis: JenisQuiz, id: string, kunci: number) {
    if (arsip) return;
    const s = soalList.find((x) => x.id === id);
    if (!s || s.kunci === kunci) return;
    setSoalList((prev) => prev.map((x) => (x.id === id ? { ...x, kunci } : x)));
    catatLog([{ quizId: jenis, jenis: "kunci", soalId: id, kunciLama: s.kunci, kunciBaru: kunci }]);
    setPesan("Kunci dikoreksi, nilai OPD dihitung ulang.");
  }

  function ubahAktif(jenis: JenisQuiz, id: string, aktif: boolean) {
    if (arsip) return;
    setSoalList((prev) => prev.map((x) => (x.id === id ? { ...x, aktif } : x)));
    catatLog([{ quizId: jenis, jenis: aktif ? "aktifkan" : "nonaktif", soalId: id }]);
    setPesan(aktif ? "Soal diaktifkan." : "Soal dinonaktifkan, nilai OPD dihitung ulang.");
  }

  function berikanIzin(target: TargetIzin[]) {
    if (arsip || sekarang === null || target.length === 0) return;
    const kunci = new Set(target.map((t) => `${t.opdId}:${t.jenis}`));
    const cocok = (opdId: string, quizId: string) => kunci.has(`${opdId}:${quizId}`);

    setHasilList((prev) => prev.filter((h) => !(h.kegiatanId === kg.id && cocok(h.opdId, h.quizId))));
    setIzinList((prev) => [
      ...prev.filter((i) => !(i.kegiatanId === kg.id && cocok(i.opdId, i.quizId))),
      ...target.map((t) => ({
        kegiatanId: kg.id,
        quizId: t.jenis,
        opdId: t.opdId,
        diberikanPada: sekarang,
        admin: NAMA_ADMIN,
      })),
    ]);
    catatLog(target.map((t) => ({ quizId: t.jenis, jenis: "izin_ulang" as const, opdId: t.opdId })));

    const ditutup = new Set(
      target
        .map((t) => t.jenis)
        .filter((j) => statusWaktuQuiz(cariPengaturan(pengaturanList, kg.id, j), sekarang) === "ditutup"),
    );
    if (ditutup.size > 0) {
      setPengaturanList((prev) =>
        prev.map((p) => (p.kegiatanId === kg.id && ditutup.has(p.id) ? { ...p, hanyaBerizin: true } : p)),
      );
    }
    setPesan(`${target.length} OPD diizinkan mengerjakan ulang.`);
  }

  function aksiUntuk(jenis: JenisQuiz): AksiTabQuiz {
    return {
      simpanPengaturan: (m) => simpanPengaturan(jenis, m),
      tambahSoal: (d) => tambahSoal(jenis, d),
      ubahSoal: (id, d) => ubahSoal(jenis, id, d),
      hapusSoal: (id) => hapusSoal(jenis, id),
      geser: (id, arah) => geser(jenis, id, arah),
      ubahKunci: (id, kunci) => ubahKunci(jenis, id, kunci),
      ubahAktif: (id, aktif) => ubahAktif(jenis, id, aktif),
    };
  }

  const daftarTab: { id: NamaTab; label: string }[] = [
    ...JENIS_QUIZ.map((j) => ({ id: j, label: LABEL_QUIZ[j] })),
    { id: "rekap", label: "Rekap Hasil" },
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-sm space-y-1.5">
        <label htmlFor="pilih-kegiatan" className="text-sm font-medium text-ink">
          Kegiatan
        </label>
        <select
          id="pilih-kegiatan"
          value={kg.id}
          onChange={(e) => router.push(`/admin/quiz?kegiatan=${e.target.value}`)}
          className={kolomInput}
        >
          {kegiatanAwal.map((k) => (
            <option key={k.id} value={k.id}>
              {k.nama}
              {k.arsip ? " (arsip)" : k.aktif ? " (aktif)" : ""}
            </option>
          ))}
        </select>
      </div>

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
            soalList={soalKegiatan}
            pengaturanList={pengaturanKegiatan}
            hasil={hasilKegiatan}
            izin={izinKegiatan}
            sekarang={sekarang}
            onIzin={berikanIzin}
          />
        ) : (
          <TabQuiz
            key={`${kg.id}:${tab}`}
            jenis={tab}
            kegiatan={kg}
            arsip={arsip}
            totalOpd={opdList.length}
            pengaturan={cariPengaturan(pengaturanList, kg.id, tab)}
            soal={soalQuiz(soalList, kg.id, tab)}
            hasil={hasilKegiatan.filter((h) => h.quizId === tab)}
            log={logList.filter((l) => l.kegiatanId === kg.id && l.quizId === tab)}
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