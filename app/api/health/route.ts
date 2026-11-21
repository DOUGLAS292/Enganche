import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query<{ postgis_version: string; now: string }>(
      "select postgis_version() as postgis_version, now() as now"
    );
    return NextResponse.json({ ok: true, db: result.rows[0] });
  } catch (error) {
    // El detalle del error (host, versión, etc.) se queda en los registros del servidor.
    console.error("[Enganche] Falló el chequeo de salud:", error);
    return NextResponse.json({ ok: false, error: "No se pudo conectar con la base de datos." }, { status: 500 });
  }
}
