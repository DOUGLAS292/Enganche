import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  const { id } = await params;
  const r = await query(
    `update publicaciones set estado = 'cancelada' where id = $1 and estado = 'abierta' returning id`,
    [id]
  );
  if (!r.rows[0]) {
    return NextResponse.json({ ok: false, error: "Solo se pueden cancelar ofertas abiertas." }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
