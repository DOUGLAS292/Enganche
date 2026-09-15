import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

const PORCENTAJE_COMISION = 0.03;
const DIAS_PERIODO_GRATIS_USUARIO = 30;

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{
    autor_id: string;
    estado: string;
    ganador_id: string | null;
    valor_ofertado: number;
  }>("select autor_id, estado, ganador_id, valor_ofertado from publicaciones where id = $1", [id]);
  const fila = publicacion.rows[0];
  if (!fila || fila.autor_id !== usuarioId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "en_proceso" || !fila.ganador_id) {
    return NextResponse.json(
      { ok: false, error: "Solo puedes marcar como completado un trabajo en proceso." },
      { status: 400 }
    );
  }

  const actualizada = await query(
    "update publicaciones set estado = 'completada', completada_en = now() where id = $1 and estado = 'en_proceso' returning id",
    [id]
  );
  if (!actualizada.rows[0]) {
    return NextResponse.json({ ok: false, error: "La oferta cambió de estado, intenta de nuevo." }, { status: 409 });
  }

  // Periodo de gracia por usuario (no por ciudad — decisión de Douglas,
  // sept-2026): quien paga la comisión es el elegido (fila.ganador_id), así
  // que su primer trabajo completado en toda la plataforma, sin importar la
  // ciudad, le arranca un único periodo de 30 días sin comisión. Si ya tiene
  // fecha registrada, se respeta la que ya tenía (no se reinicia el reloj
  // en cada trabajo, es un beneficio de una sola vez).
  const ganador = await query<{ comision_gratis_hasta: string | null }>(
    "select comision_gratis_hasta from usuarios where id = $1",
    [fila.ganador_id]
  );
  let gratisHasta = ganador.rows[0]?.comision_gratis_hasta ?? null;
  if (!gratisHasta) {
    const nuevaFecha = new Date(Date.now() + DIAS_PERIODO_GRATIS_USUARIO * 24 * 60 * 60 * 1000);
    await query("update usuarios set comision_gratis_hasta = $1 where id = $2", [nuevaFecha, fila.ganador_id]);
    gratisHasta = nuevaFecha.toISOString();
  }
  const enPeriodoGratis = new Date(gratisHasta).getTime() > Date.now();
  const valorComision = enPeriodoGratis ? 0 : Math.round(fila.valor_ofertado * PORCENTAJE_COMISION);

  await query(
    `insert into comisiones (publicacion_id, valor_comision, responsable_pago_id, estado)
     values ($1, $2, $3, 'pendiente')
     on conflict (publicacion_id) do nothing`,
    [id, valorComision, fila.ganador_id]
  );

  return NextResponse.json({ ok: true, valorComision, enPeriodoGratis });
}
