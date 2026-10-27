import {
  Award,
  Building2,
  CalendarCheck,
  CalendarRange,
  ClipboardCheck,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  type LucideIcon,
  Upload,
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
    { label: "Pre-Test", href: "/opd/pre-test", ikon: ClipboardList },
    { label: "Post-Test", href: "/opd/post-test", ikon: ClipboardCheck },
    { label: "Evaluasi Pendalaman", href: "/opd/evaluasi-pendalaman", ikon: GraduationCap },
    { label: "Unggah Dokumen", href: "/opd/unggah", ikon: Upload },
  ],
};