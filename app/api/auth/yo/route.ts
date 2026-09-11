import { NextResponse } from "next/server";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";

export async function GET() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: true, usuario: null });
  }

  const result = await query(
    `select id, nombre_razon_social, tipo_usuario, ciudad, ofrece, verificado
     from usuarios where id = $1`,
    [usuarioId]
  );

  return NextResponse.json({ ok: true, usuario: result.rows[0] ?? null });
}
