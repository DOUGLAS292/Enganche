import { NextResponse } from "next/server";
import { cerrarSesion } from "@/lib/auth/session";

export async function POST() {
  await cerrarSesion();
  return NextResponse.json({ ok: true });
}
