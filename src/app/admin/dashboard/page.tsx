import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_LABEL, type StatusDokumen } from "@/lib/types";

export default function DashboardAdmin() {
  const semuaStatus = Object.keys(STATUS_LABEL) as StatusDokumen[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-primary">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Ringkasan kelengkapan dokumen seluruh OPD.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {semuaStatus.map((s) => (
          <StatusBadge key={s} status={s} />
        ))}
      </div>
    </div>
  );
}
