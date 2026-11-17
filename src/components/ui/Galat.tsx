export function Galat({ pesan }: { pesan: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className="text-sm text-status-revisi-fg">
      {pesan}
    </p>
  );
}