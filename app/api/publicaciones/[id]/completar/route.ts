import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

const PORCENTAJE_COMISION_DEFECTO = 0.03;
const DIAS_ARRANQUE_EN_FRIO = 30;

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
    ciudad: string;
    region: string | null;
    valor_ofertado: number;
  }>("select autor_id, estado, ganador_id, ciudad, region, valor_ofertado from publicaciones where id = $1", [id]);
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

  // Arranque en frío: registra la ciudad la primera vez que se completa un trabajo ahí,
  // con 30 días sin comisión desde ese momento (ver spec §2, "Arranque en frío por ciudad").
  await query(
    `insert into ciudades_piloto (ciudad, region, fecha_lanzamiento, fecha_activacion_comision, porcentaje_comision)
     values ($1, $2, now(), now() + interval '${DIAS_ARRANQUE_EN_FRIO} days', $3)
     on conflict (ciudad) do nothing`,
    [fila.ciudad, fila.region, PORCENTAJE_COMISION_DEFECTO]
  );

  const ciudadPiloto = await query<{ porcentaje_comision: string; fecha_activacion_comision: string | null }>(
    "select porcentaje_comision, fecha_activacion_comision from ciudades_piloto where ciudad = $1",
    [fila.ciudad]
  );
  const configCiudad = ciudadPiloto.rows[0];
  const enPeriodoGratis =
    !configCiudad?.fecha_activacion_comision || new Date(configCiudad.fecha_activacion_comision).getTime() > Date.now();
  const porcentaje = configCiudad ? Number(configCiudad.porcentaje_comision) : PORCENTAJE_COMISION_DEFECTO;
  const valorComision = enPeriodoGratis ? 0 : Math.round(fila.valor_ofertado * porcentaje);

  await query(
    `insert into comisiones (publicacion_id, valor_comision, responsable_pago_id, estado)
     values ($1, $2, $3, 'pendiente')
     on conflict (publicacion_id) do nothing`,
    [id, valorComision, fila.ganador_id]
  );

  return NextResponse.json({ ok: true, valorComision, enPeriodoGratis });
}
