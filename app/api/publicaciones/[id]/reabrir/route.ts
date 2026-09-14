import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; estado: string; ganador_id: string | null }>(
    "select autor_id, estado, ganador_id from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "en_proceso") {
    return NextResponse.json({ ok: false, error: "Solo puedes reabrir una oferta en proceso." }, { status: 400 });
  }

  const actualizada = await query(
    `update publicaciones
       set estado = 'abierta', ganador_id = null, veces_reabierta = veces_reabierta + 1
     where id = $1 and estado = 'en_proceso'
     returning id`,
    [id]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "La oferta cambió de estado, intenta de nuevo." }, { status: 409 });
  }

  if (fila.ganador_id) {
    await query(
      "update postulaciones set estado = 'rechazada', notificado = false where publicacion_id = $1 and postulante_id = $2 and estado = 'elegida'",
      [id, fila.ganador_id]
    );
  }

  return NextResponse.json({ ok: true });
}
