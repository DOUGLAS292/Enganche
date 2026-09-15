import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { enviarAvisoSolicitudUrgente } from "@/lib/whatsapp/notificaciones";
import { formatCOP } from "@/lib/format";

const VALOR_URGENTE = 18000;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; estado: string; sistema_o_proyecto: string }>(
    "select autor_id, estado, sistema_o_proyecto from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "abierta") {
    return NextResponse.json({ ok: false, error: "Solo puedes marcar como urgente una oferta abierta." }, { status: 400 });
  }

  const creado = await query<{ id: string }>(
    `insert into impulsos_urgentes (publicacion_id, solicitado_por_id, valor)
     values ($1, $2, $3)
     on conflict (publicacion_id) do nothing
     returning id`,
    [id, usuarioId, VALOR_URGENTE]
  );
  if (!creado.rows[0]) {
    return NextResponse.json({ ok: false, error: "Ya hay una solicitud de urgente para esta oferta." }, { status: 409 });
  }

  const admins = await query<{ celular: string }>("select celular from usuarios where es_admin = true");
  await Promise.all(
    admins.rows.map((admin) => enviarAvisoSolicitudUrgente(admin.celular, fila.sistema_o_proyecto, formatCOP(VALOR_URGENTE)))
  );

  return NextResponse.json({ ok: true, valor: VALOR_URGENTE });
}
