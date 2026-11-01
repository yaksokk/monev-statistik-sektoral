import {
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  CalendarRange,
  FileText,
  Flag,
  LayoutDashboard,
  Library,
  ListChecks,
  Mail,
  Target,
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
    { label: "Monev Indikator", href: "/admin/monev-indikator", ikon: Target },
    { label: "Monev Milestone", href: "/admin/monev-milestone", ikon: Flag },
    // { label: "Kegiatan", href: "/admin/kegiatan", ikon: CalendarRange },
    { label: "Daftar Hadir", href: "/admin/daftar-hadir", ikon: CalendarCheck },
    { label: "Modul", href: "/admin/modul", ikon: Library },
    { label: "Kelola Quiz", href: "/admin/quiz", ikon: ListChecks },
    { label: "Undangan", href: "/admin/undangan", ikon: Mail },
    { label: "OPD", href: "/admin/opd", ikon: Building2 },
  ],
    operator: [
    { label: "Dashboard", href: "/opd/dashboard", ikon: LayoutDashboard },
    { label: "Daftar Hadir", href: "/opd/daftar-hadir", ikon: CalendarCheck },
    { label: "Pembinaan 1", href: "/opd/pembinaan-1", ikon: BookOpen },
    { label: "Pembinaan 2", href: "/opd/pembinaan-2", ikon: BookOpenCheck },
    { label: "Daftar Dokumen", href: "/opd/daftar-dokumen", ikon: FileText },
  ],
};