import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verificarFirmaWebhook } from "@/lib/wompi";
import { confirmarComisionPorId } from "@/lib/pagos/comision";
import { confirmarImpulsoUrgentePorId } from "@/lib/pagos/urgente";

type EventoWompi = {
  event?: string;
  data?: { transaction?: { status?: string; payment_link_id?: string | null } };
  timestamp?: number | string;
  signature?: { properties?: string[]; checksum?: string };
};

// Endpoint público (sin sesión) — Wompi no manda cookies ni auth de
// usuario, así que la única defensa es verificar el checksum firmado.
// Sin esa verificación, cualquiera con la URL podría "aprobar" pagos.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as EventoWompi | null;
  if (!body || !verificarFirmaWebhook(body)) {
    return NextResponse.json({ ok: false, error: "Firma inválida." }, { status: 401 });
  }

  const transaccion = body.data?.transaction;
  const linkId = transaccion?.payment_link_id;
  if (transaccion?.status !== "APPROVED" || !linkId) {
    // No es un pago aprobado (o no viene de un link nuestro) — se
    // responde 200 igual para que Wompi no siga reintentando el evento.
    return NextResponse.json({ ok: true });
  }

  const comision = await query<{ id: string }>(
    "select id from comisiones where wompi_link_id = $1",
    [linkId]
  );
  if (comision.rows[0]) {
    await confirmarComisionPorId(comision.rows[0].id);
    return NextResponse.json({ ok: true });
  }

  const impulso = await query<{ id: string }>(
    "select id from impulsos_urgentes where wompi_link_id = $1",
    [linkId]
  );
  if (impulso.rows[0]) {
    await confirmarImpulsoUrgentePorId(impulso.rows[0].id);
  }

  return NextResponse.json({ ok: true });
}
