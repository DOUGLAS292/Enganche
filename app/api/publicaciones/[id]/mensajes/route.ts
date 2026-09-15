import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

async function obtenerAcceso(id: string, usuarioId: string): Promise<{ autorId: string; ganadorId: string } | null> {
  const result = await query<{ autor_id: string; ganador_id: string | null }>(
    "select autor_id, ganador_id from publicaciones where id = $1",
    [id]
  );
  const fila = result.rows[0];
  if (!fila || !fila.ganador_id) return null;
  if (usuarioId !== fila.autor_id && usuarioId !== fila.ganador_id) return null;
  return { autorId: fila.autor_id, ganadorId: fila.ganador_id };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const acceso = await obtenerAcceso(id, usuarioId);
  if (!acceso) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  // El chat es personal entre el autor y el ganador ACTUAL — si la oferta
  // se reabrió y se eligió a alguien distinto antes, esos mensajes son de
  // otra persona y no deben verse aquí.
  const result = await query(
    `select m.id, m.emisor_id, m.contenido, m.creado_en, u.nombre_razon_social as emisor_nombre
     from mensajes m
     join usuarios u on u.id = m.emisor_id
     where m.publicacion_id = $1 and m.ganador_id = $2
     order by m.creado_en asc
     limit 200`,
    [id, acceso.ganadorId]
  );

  // Marca como leído hasta ahora: abrir el chat es lo que hace desaparecer
  // el aviso de "mensajes nuevos" en el resto de la app.
  await query(
    `insert into mensajes_leidos (usuario_id, publicacion_id, leido_hasta)
     values ($1, $2, now())
     on conflict (usuario_id, publicacion_id) do update set leido_hasta = now()`,
    [usuarioId, id]
  );

  return NextResponse.json({ ok: true, mensajes: result.rows });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const acceso = await obtenerAcceso(id, usuarioId);
  if (!acceso) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const contenido = String(body?.contenido ?? "").trim();
  if (!contenido) {
    return NextResponse.json({ ok: false, error: "Escribe un mensaje." }, { status: 400 });
  }

  // Se etiqueta con el ganador actual: si la oferta se reabre y se elige a
  // otra persona más adelante, este mensaje sigue perteneciendo a esta
  // ronda, no a la nueva.
  await query("insert into mensajes (publicacion_id, emisor_id, contenido, ganador_id) values ($1, $2, $3, $4)", [
    id,
    usuarioId,
    contenido,
    acceso.ganadorId,
  ]);

  return NextResponse.json({ ok: true });
}
