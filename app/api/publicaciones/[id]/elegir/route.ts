import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const postulanteId = String(body?.postulanteId ?? "");
  if (!postulanteId) {
    return NextResponse.json({ ok: false, error: "Falta el postulante." }, { status: 400 });
  }

  const publicacion = await query<{ autor_id: string; estado: string }>(
    "select autor_id, estado from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "abierta") {
    return NextResponse.json(
      { ok: false, error: "Esta oferta ya no está abierta para elegir postulante." },
      { status: 400 }
    );
  }

  const postulacion = await query(
    "select 1 from postulaciones where publicacion_id = $1 and postulante_id = $2 and estado = 'pendiente'",
    [id, postulanteId]
  );
  if (!postulacion.rows[0]) {
    return NextResponse.json({ ok: false, error: "Ese postulante ya no está disponible." }, { status: 400 });
  }

  const actualizada = await query(
    "update publicaciones set estado = 'en_proceso', ganador_id = $1 where id = $2 and estado = 'abierta' returning id",
    [postulanteId, id]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "La oferta cambió de estado, intenta de nuevo." }, { status: 409 });
  }

  await query(
    "update postulaciones set estado = 'elegida', notificado = false where publicacion_id = $1 and postulante_id = $2",
    [id, postulanteId]
  );

  return NextResponse.json({ ok: true });
}
