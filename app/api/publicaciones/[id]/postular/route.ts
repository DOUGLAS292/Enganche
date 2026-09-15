import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { formatCOP } from "@/lib/format";

const DIAS_GRACIA_COMISION = 7;

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

  // Una comisión vencida (más de 7 días sin marcarla pagada) o rechazada
  // por el admin (el pago que marcó no llegó de verdad) bloquea postularse
  // a ofertas nuevas hasta que se ponga al día — no bloquea publicar ni
  // usar el resto de la app, solo tomar trabajo nuevo. La rechazada
  // bloquea de inmediato, sin esperar los 7 días, porque ya hubo un
  // intento de pago cuestionado. Se excluyen las comisiones en $0
  // (periodo de gracia del usuario): esas no tienen botón de "marcar
  // pagada" porque no hay nada que pagar, así que nunca deben bloquear.
  const comisionVencida = await query<{ valor_comision: number; sistema_o_proyecto: string; estado: string }>(
    `select c.valor_comision, p.sistema_o_proyecto, c.estado
     from comisiones c
     join publicaciones p on p.id = c.publicacion_id
     where c.responsable_pago_id = $1
       and c.valor_comision > 0
       and (
         c.estado = 'rechazada'
         or (c.estado = 'pendiente' and now() - c.creado_en >= interval '${DIAS_GRACIA_COMISION} days')
       )
     order by c.creado_en asc
     limit 1`,
    [usuarioId]
  );
  const deuda = comisionVencida.rows[0];
  if (deuda) {
    const motivo =
      deuda.estado === "rechazada"
        ? `El pago que marcaste de ${formatCOP(deuda.valor_comision)} de "${deuda.sistema_o_proyecto}" fue rechazado`
        : `Tienes una comisión sin pagar hace más de ${DIAS_GRACIA_COMISION} días (${formatCOP(deuda.valor_comision)} de "${deuda.sistema_o_proyecto}")`;
    return NextResponse.json(
      {
        ok: false,
        error: `${motivo}. Márcala como pagada para poder postularte a nuevas ofertas.`,
      },
      { status: 403 }
    );
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
  // inactividad que usa la auto-expiración, y también el aviso de
  // "postulantes esperando" (vuelve a contar desde este postulante nuevo).
  await query(
    `update publicaciones
       set ultima_actividad_en = now(), aviso_expiracion_enviado = false, aviso_postulantes_enviado = false
     where id = $1`,
    [id]
  );

  return NextResponse.json({ ok: true });
}
