import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string }>("select autor_id from publicaciones where id = $1", [id]);
  if (!publicacion.rows[0] || publicacion.rows[0].autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const result = await query(
    `select
       po.postulante_id, po.estado, po.creado_en,
       u.nombre_razon_social, u.ciudad, u.rating_promedio, u.trabajos_completados, u.verificado
     from postulaciones po
     join usuarios u on u.id = po.postulante_id
     where po.publicacion_id = $1
     order by po.creado_en asc`,
    [id]
  );

  return NextResponse.json({ ok: true, postulantes: result.rows });
}
