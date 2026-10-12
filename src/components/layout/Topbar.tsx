import { Menu } from "lucide-react";

interface TopbarProps {
  nama: string;
  peranLabel: string;
  onBukaMenu: () => void;
}

export function Topbar({ nama, peranLabel, onBukaMenu }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
      <button
        type="button"
        onClick={onBukaMenu}
        aria-label="Buka menu"
        className="-ml-2 rounded-md p-2 text-ink-muted transition-colors hover:bg-surface-muted lg:hidden"
      >
        <Menu className="size-5" aria-hidden="true" />
      </button>

      <div className="ml-auto text-right leading-tight">
        <p className="text-sm font-medium text-ink">{nama}</p>
        <p className="text-xs text-ink-muted">{peranLabel}</p>
      </div>
    </header>
  );
}
