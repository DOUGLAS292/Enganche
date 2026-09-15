import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { enviarAvisoComisionRechazada } from "@/lib/whatsapp/notificaciones";
import { formatCOP } from "@/lib/format";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const actualizada = await query<{
    valor_comision: number;
    responsable_pago_id: string;
    sistema_o_proyecto: string;
  }>(
    `update comisiones c
       set estado = 'rechazada'
     from publicaciones p
     where c.id = $1 and c.estado = 'marcada_pagada' and p.id = c.publicacion_id
     returning c.valor_comision, c.responsable_pago_id, p.sistema_o_proyecto`,
    [id]
  );
  const fila = actualizada.rows[0];
  if (!fila) {
    return NextResponse.json({ ok: false, error: "No se pudo rechazar la comisión." }, { status: 400 });
  }

  const info = await query<{ celular: string }>("select celular from usuarios where id = $1", [fila.responsable_pago_id]);
  const responsable = info.rows[0];
  if (responsable) {
    await enviarAvisoComisionRechazada(responsable.celular, fila.sistema_o_proyecto, formatCOP(fila.valor_comision));
  }

  return NextResponse.json({ ok: true });
}
