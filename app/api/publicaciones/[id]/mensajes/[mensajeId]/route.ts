import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string; mensajeId: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id, mensajeId } = await params;

  // Solo se puede borrar el propio mensaje, y solo dentro de la misma
  // publicación al que pertenece — no importa si la oferta se reabrió
  // después, el mensaje sigue siendo del emisor original.
  const borrado = await query(
    "delete from mensajes where id = $1 and publicacion_id = $2 and emisor_id = $3 returning id",
    [mensajeId, id, usuarioId]
  );
  if (!borrado.rows[0]) {
    return NextResponse.json({ ok: false, error: "No se pudo borrar ese mensaje." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
