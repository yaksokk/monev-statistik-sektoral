import "server-only";
import { NextResponse } from "next/server";
import { ambilPengguna } from "@/lib/pengguna";

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const EMAIL = /^\S+@\S+\.\S+$/;
export const SANDI_MIN = 8;
export const SANDI_MAKS = 72; // batas bcrypt

export function jawab(pesan: string, status: number) {
  return NextResponse.json({ pesan }, { status });
}

// Untuk route handler: balas 401/403 (bukan redirect).
// Pemakaian: const cek = await pastikanAdmin(); if ("galat" in cek) return cek.galat;
export async function pastikanAdmin() {
  const data = await ambilPengguna();
  if (!data) return { galat: jawab("Belum login.", 401) } as const;
  if (data.pengguna.peran !== "admin") {
    return { galat: jawab("Hanya admin yang boleh melakukan ini.", 403) } as const;
  }
  return { admin: data.pengguna } as const;
}

// Hanya menerima application/json: permintaan lintas situs lewat <form> ditolak
export async function bacaJson(req: Request): Promise<Record<string, unknown> | null> {
  if (!req.headers.get("content-type")?.includes("application/json")) return null;
  try {
    const badan: unknown = await req.json();
    return badan && typeof badan === "object" && !Array.isArray(badan)
      ? (badan as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function teks(x: unknown): string {
  return typeof x === "string" ? x.trim() : "";
}

export function sandiValid(sandi: string): string | null {
  if (sandi.length < SANDI_MIN) return `Kata sandi minimal ${SANDI_MIN} karakter.`;
  if (sandi.length > SANDI_MAKS) return `Kata sandi maksimal ${SANDI_MAKS} karakter.`;
  return null;
}