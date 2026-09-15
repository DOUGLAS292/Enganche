import { NextResponse } from "next/server";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { confirmarComisionPorId } from "@/lib/pagos/comision";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }

  const { id } = await params;

  const confirmada = await confirmarComisionPorId(id);
  if (!confirmada) {
    return NextResponse.json({ ok: false, error: "No se pudo confirmar la comisión." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
