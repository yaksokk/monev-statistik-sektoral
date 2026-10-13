"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  buka: boolean;
  onTutup: () => void;
  judul: string;
  children: ReactNode;
};

export function Dialog({ buka, onTutup, judul, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (buka && !d.open) d.showModal();
    if (!buka && d.open) d.close();
  }, [buka]);

  return (
    <dialog
      ref={ref}
      onClose={onTutup}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-card border border-line bg-surface p-0 text-ink shadow-card backdrop:bg-black/40"
    >
      {buka && (
        <div className="space-y-4 p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{judul}</h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
