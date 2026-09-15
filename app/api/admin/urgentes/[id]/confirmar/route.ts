import { NextResponse } from "next/server";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { confirmarImpulsoUrgentePorId } from "@/lib/pagos/urgente";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const confirmado = await confirmarImpulsoUrgentePorId(id);
  if (!confirmado) {
    return NextResponse.json({ ok: false, error: "No se pudo confirmar la solicitud." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
