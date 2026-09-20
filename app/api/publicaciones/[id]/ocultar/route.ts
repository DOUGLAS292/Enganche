import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

// Solo esconde la tarjeta de "Mis publicaciones" para el autor — no borra
// nada del historial real (postulaciones, mensajes, calificaciones siguen
// intactos). Por eso solo aplica a ofertas canceladas: las demás siguen
// teniendo valor activo (abiertas, en proceso) o informativo (completadas)
// para quien las publicó.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const actualizada = await query(
    "update publicaciones set oculta_por_autor = true where id = $1 and autor_id = $2 and estado = 'cancelada' returning id",
    [id, usuarioId]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "Solo puedes quitar de tu vista una oferta cancelada." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
