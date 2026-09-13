import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

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
    "select valor_comision, estado, responsable_pago_id, creado_en, confirmada_en from comisiones where publicacion_id = $1",
    [id]
  );

  return NextResponse.json({ ok: true, comision: result.rows[0] ?? null });
}

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const actualizada = await query(
    `update comisiones
       set estado = 'marcada_pagada'
     where publicacion_id = $1 and responsable_pago_id = $2 and estado = 'pendiente'
     returning id`,
    [id, usuarioId]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "No se pudo marcar como pagada." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
