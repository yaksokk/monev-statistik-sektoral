import {
  Award,
  Building2,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  type LucideIcon,
  FileText,
} from "lucide-react";
import type { Peran } from "@/lib/types";

export interface ItemMenu {
  label: string;
  href: string;
  ikon: LucideIcon;
}

export const MENU: Record<Peran, ItemMenu[]> = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", ikon: LayoutDashboard },
    { label: "Pemeriksaan", href: "/admin/pemeriksaan", ikon: ClipboardCheck },
    { label: "Kegiatan", href: "/admin/kegiatan", ikon: CalendarRange },
    { label: "Nilai", href: "/admin/nilai", ikon: Award },
    { label: "OPD", href: "/admin/opd", ikon: Building2 },
  ],
  operator: [
    { label: "Dashboard", href: "/opd/dashboard", ikon: LayoutDashboard },
    { label: "Daftar Hadir", href: "/opd/daftar-hadir", ikon: CalendarCheck },
    { label: "Modul Pembelajaran", href: "/opd/modul-pembelajaran", ikon: BookOpen },
    { label: "Pre-Test", href: "/opd/pre-test", ikon: ClipboardList },
    { label: "Post-Test", href: "/opd/post-test", ikon: ClipboardCheck },
    { label: "Evaluasi Pendalaman", href: "/opd/evaluasi-pendalaman", ikon: GraduationCap },
    { label: "Daftar Dokumen", href: "/opd/daftar-dokumen", ikon: FileText }
  ],
};