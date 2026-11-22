import { createBrowserClient } from "@supabase/ssr";

// Klien browser (kunci anon memang publik; akses dibatasi RLS dan kebijakan Storage)
export function buatKlienBrowser() {
  return createBrowserClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
  );
}