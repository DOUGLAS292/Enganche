import { NextResponse } from "next/server";
import { obtenerClavesVapid } from "@/lib/push/vapid";

// Clave pública (la que el navegador necesita para suscribirse). No es secreta.
export async function GET() {
  return NextResponse.json({ ok: true, clave: obtenerClavesVapid().publica });
}
