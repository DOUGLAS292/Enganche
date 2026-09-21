import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

// Se llama justo después del registro (y se puede reintentar luego desde el
// perfil) para guardar la ubicación GPS del usuario una sola vez — sirve de
// base para avisar por cercanía sin depender de que comparta el GPS cada
// vez que abre el feed.
export async function POST(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return NextResponse.json({ ok: false, error: "Coordenadas inválidas." }, { status: 400 });
  }

  await query("update usuarios set ubicacion = ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography where id = $3", [
    lng,
    lat,
    usuarioId,
  ]);

  return NextResponse.json({ ok: true });
}
