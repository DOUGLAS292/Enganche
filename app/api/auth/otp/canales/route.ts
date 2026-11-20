import { NextResponse } from "next/server";
import { canalesConfigurados } from "@/lib/auth/canales";

// La pantalla de ingreso pregunta qué canales están activos para mostrar solo esos.
export async function GET() {
  return NextResponse.json({ ok: true, canales: canalesConfigurados() });
}
