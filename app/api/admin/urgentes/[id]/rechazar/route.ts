import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const actualizada = await query(
    `update impulsos_urgentes
       set estado = 'rechazada'
     where id = $1 and estado = 'pendiente'
     returning id`,
    [id]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "No se pudo rechazar la solicitud." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
