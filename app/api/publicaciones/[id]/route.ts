import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;

  const result = await query(
    `select
       p.id, p.tipo_trabajo, p.nivel_sistema, p.sistema_o_proyecto, p.cantidad,
       p.tiempo_entrega, p.valor_ofertado, p.ciudad, p.region, p.estado, p.creado_en,
       p.autor_id,
       u.nombre_razon_social as autor_nombre, u.rating_promedio as autor_rating,
       u.trabajos_completados as autor_trabajos, u.verificado as autor_verificado
     from publicaciones p
     join usuarios u on u.id = p.autor_id
     where p.id = $1`,
    [id]
  );

  const publicacion = result.rows[0];
  if (!publicacion) {
    return NextResponse.json({ ok: false, error: "No encontrada." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, publicacion });
}
