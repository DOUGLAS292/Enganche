import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; estado: string }>(
    "select autor_id, estado from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila) {
    return NextResponse.json({ ok: false, error: "Oferta no encontrada." }, { status: 404 });
  }
  if (fila.autor_id === usuarioId) {
    return NextResponse.json({ ok: false, error: "No puedes postularte a tu propia oferta." }, { status: 400 });
  }
  if (fila.estado !== "abierta") {
    return NextResponse.json({ ok: false, error: "Esta oferta ya no está abierta." }, { status: 400 });
  }

  try {
    await query(
      "insert into postulaciones (publicacion_id, postulante_id, estado) values ($1, $2, 'pendiente')",
      [id, usuarioId]
    );
  } catch (err) {
    const codigo = err instanceof Error && "code" in err ? (err as { code?: string }).code : undefined;
    if (codigo === "23505") {
      return NextResponse.json({ ok: false, error: "Ya te habías postulado a esta oferta." }, { status: 409 });
    }
    throw err;
  }

  // Una postulación nueva reinicia el contador de los 15 días de
  // inactividad que usa la auto-expiración.
  await query(
    "update publicaciones set ultima_actividad_en = now(), aviso_expiracion_enviado = false where id = $1",
    [id]
  );

  return NextResponse.json({ ok: true });
}
