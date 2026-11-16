import "server-only";
import { createClient } from "@supabase/supabase-js";

// Klien dengan service role: MELEWATI RLS. Hanya dipakai di route handler server
// setelah pemanggil dipastikan admin (lihat pastikanAdmin di src/lib/api-admin.ts).
// Kunci dibaca dari env server (tanpa NEXT_PUBLIC_) dan tidak boleh sampai ke kode klien.
export function buatKlienAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const kunci = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !kunci) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  }
  return createClient(url, kunci, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}