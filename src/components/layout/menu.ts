import {
  Award,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Mail,
  type LucideIcon,
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
    { label: "Daftar Hadir", href: "/admin/daftar-hadir", ikon: CalendarCheck },
    { label: "Undangan", href: "/admin/undangan", ikon: Mail },
    { label: "Nilai", href: "/admin/nilai", ikon: Award },
    { label: "OPD", href: "/admin/opd", ikon: Building2 },
  ],
  operator: [
    { label: "Dashboard", href: "/opd/dashboard", ikon: LayoutDashboard },
    { label: "Daftar Hadir", href: "/opd/daftar-hadir", ikon: CalendarCheck },
    { label: "Pembinaan 1", href: "/opd/pembinaan-1", ikon: BookOpen },
    { label: "Pembinaan 2", href: "/opd/pembinaan-2", ikon: BookOpenCheck },
    { label: "Evaluasi Pendalaman", href: "/opd/evaluasi-pendalaman", ikon: GraduationCap },
    { label: "Daftar Dokumen", href: "/opd/daftar-dokumen", ikon: FileText },
  ],
};