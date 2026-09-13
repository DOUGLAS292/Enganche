import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

const DIAS_GARANTIA = 30;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; ganador_id: string | null }>(
    "select autor_id, ganador_id from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || (usuarioId !== fila.autor_id && usuarioId !== fila.ganador_id)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const result = await query(
    "select id, descripcion, estado, fecha_reporte, fecha_resolucion from garantias where publicacion_id = $1 order by fecha_reporte desc",
    [id]
  );

  return NextResponse.json({ ok: true, garantias: result.rows });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{
    autor_id: string;
    ganador_id: string | null;
    estado: string;
    completada_en: string | null;
  }>("select autor_id, ganador_id, estado, completada_en from publicaciones where id = $1", [id]);
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "completada" || !fila.ganador_id || !fila.completada_en) {
    return NextResponse.json(
      { ok: false, error: "Solo puedes reportar garantía en un trabajo completado." },
      { status: 400 }
    );
  }
  const diasTranscurridos = (Date.now() - new Date(fila.completada_en).getTime()) / (1000 * 60 * 60 * 24);
  if (diasTranscurridos > DIAS_GARANTIA) {
    return NextResponse.json({ ok: false, error: "Ya pasaron los 30 días de garantía para este trabajo." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const descripcion = String(body?.descripcion ?? "").trim();
  if (!descripcion) {
    return NextResponse.json({ ok: false, error: "Describe el problema." }, { status: 400 });
  }

  await query(
    `insert into garantias (publicacion_id, reportado_por_id, reportado_contra_id, descripcion, estado)
     values ($1, $2, $3, $4, 'abierto')`,
    [id, usuarioId, fila.ganador_id, descripcion]
  );

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const garantiaId = String(body?.garantiaId ?? "");
  const nuevoEstado = String(body?.estado ?? "");
  if (!garantiaId || !["atendido", "no_atendido"].includes(nuevoEstado)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
  }

  const actualizada = await query(
    `update garantias
       set estado = $1, fecha_resolucion = now()
     where id = $2 and publicacion_id = $3 and reportado_por_id = $4 and estado = 'abierto'
     returning id`,
    [nuevoEstado, garantiaId, id, usuarioId]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "No se pudo actualizar ese reporte." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
