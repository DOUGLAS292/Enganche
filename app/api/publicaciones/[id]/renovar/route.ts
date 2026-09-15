import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

// Renovar reinicia el contador de los 15 días de inactividad y, si la
// oferta ya había expirado, la vuelve a abrir (mismo botón sirve para
// "todavía la necesito" antes o después de expirar).
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; estado: string }>(
    "select autor_id, estado from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "abierta" && fila.estado !== "expirada") {
    return NextResponse.json({ ok: false, error: "Solo puedes renovar una oferta abierta o expirada." }, { status: 400 });
  }

  await query(
    `update publicaciones
       set estado = 'abierta', ultima_actividad_en = now(), aviso_expiracion_enviado = false
     where id = $1`,
    [id]
  );

  return NextResponse.json({ ok: true });
}
