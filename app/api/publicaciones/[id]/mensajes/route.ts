import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

async function verificarAcceso(id: string, usuarioId: string): Promise<boolean> {
  const result = await query<{ autor_id: string; ganador_id: string | null }>(
    "select autor_id, ganador_id from publicaciones where id = $1",
    [id]
  );
  const fila = result.rows[0];
  if (!fila || !fila.ganador_id) return false;
  return usuarioId === fila.autor_id || usuarioId === fila.ganador_id;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  if (!(await verificarAcceso(id, usuarioId))) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const result = await query(
    `select m.id, m.emisor_id, m.contenido, m.creado_en, u.nombre_razon_social as emisor_nombre
     from mensajes m
     join usuarios u on u.id = m.emisor_id
     where m.publicacion_id = $1
     order by m.creado_en asc
     limit 200`,
    [id]
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

  if (!(await verificarAcceso(id, usuarioId))) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const contenido = String(body?.contenido ?? "").trim();
  if (!contenido) {
    return NextResponse.json({ ok: false, error: "Escribe un mensaje." }, { status: 400 });
  }

  await query("insert into mensajes (publicacion_id, emisor_id, contenido) values ($1, $2, $3)", [
    id,
    usuarioId,
    contenido,
  ]);

  return NextResponse.json({ ok: true });
}
