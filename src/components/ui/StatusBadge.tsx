import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";

const GAYA: Record<StatusDokumen, string> = {
  belum: "bg-status-belum-bg text-status-belum-fg",
  disetujui: "bg-status-disetujui-bg text-status-disetujui-fg",
};

export function StatusBadge({ status }: { status: StatusDokumen }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${GAYA[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
