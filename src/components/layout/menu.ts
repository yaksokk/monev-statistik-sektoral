import {
  Award,
  Building2,
  CalendarRange,
  ClipboardCheck,
  LayoutDashboard,
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
    { label: "OPD", href: "/admin/opd", ikon: Building2 },
    { label: "Kegiatan", href: "/admin/kegiatan", ikon: CalendarRange },
    { label: "Nilai", href: "/admin/nilai", ikon: Award },
  ],
  operator: [{ label: "Dashboard", href: "/opd/dashboard", ikon: LayoutDashboard }],
  pimpinan: [{ label: "Rekap", href: "/pimpinan", ikon: LayoutDashboard }],
};
