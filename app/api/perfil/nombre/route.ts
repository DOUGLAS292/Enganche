import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function PATCH(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nombre = String(body?.nombre ?? "").trim();
  if (nombre.length < 2 || nombre.length > 120) {
    return NextResponse.json({ ok: false, error: "El nombre debe tener entre 2 y 120 caracteres." }, { status: 400 });
  }

  await query("update usuarios set nombre_razon_social = $1 where id = $2", [nombre, usuarioId]);

  return NextResponse.json({ ok: true, nombre });
}
