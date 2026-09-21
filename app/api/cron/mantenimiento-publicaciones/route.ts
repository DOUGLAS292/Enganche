import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enviarAvisoExpiracion, enviarAvisoPostulantesPendientes } from "@/lib/whatsapp/notificaciones";

function coincideSecreto(recibido: string, esperado: string): boolean {
  const bufRecibido = Buffer.from(recibido);
  const bufEsperado = Buffer.from(esperado);
  if (bufRecibido.length !== bufEsperado.length) return false;
  return timingSafeEqual(bufRecibido, bufEsperado);
}

const DIAS_ESPERA_POSTULANTES = 3;

// Corre una vez al día (ver vercel.json). Hace tres cosas, en este orden:
//
// 1. Avisa por WhatsApp a los autores de ofertas que llevan 13-14 días
//    abiertas sin ninguna postulación nueva (antes de que expiren el día 15).
// 2. Expira (pasa a 'expirada') las que ya llegaron a 15 días sin
//    postulaciones nuevas.
// 3. Avisa a los autores que tienen postulantes pendientes hace 3 días o
//    más y todavía no han elegido a nadie — el otro lado del problema:
//    no es que falten postulantes, es que el autor no decide.
//
// Protegida con CRON_SECRET para que solo Vercel (o quien tenga el
// secreto) pueda dispararla.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || !auth || !coincideSecreto(auth, `Bearer ${secret}`)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const porAvisarExpiracion = await query<{
    id: string;
    sistema_o_proyecto: string;
    celular: string;
    dias_inactiva: number;
  }>(
    `select p.id, p.sistema_o_proyecto, u.celular,
            floor(extract(epoch from (now() - p.ultima_actividad_en)) / 86400)::int as dias_inactiva
     from publicaciones p
     join usuarios u on u.id = p.autor_id
     where p.estado = 'abierta'
       and p.aviso_expiracion_enviado = false
       and now() - p.ultima_actividad_en >= interval '13 days'
       and now() - p.ultima_actividad_en < interval '15 days'`
  );

  for (const fila of porAvisarExpiracion.rows) {
    await enviarAvisoExpiracion(fila.celular, fila.sistema_o_proyecto, fila.dias_inactiva);
    await query("update publicaciones set aviso_expiracion_enviado = true where id = $1", [fila.id]);
  }

  const expiradas = await query<{ id: string }>(
    `update publicaciones
       set estado = 'expirada'
     where estado = 'abierta'
       and now() - ultima_actividad_en >= interval '15 days'
     returning id`
  );

  const porAvisarPostulantes = await query<{
    id: string;
    sistema_o_proyecto: string;
    celular: string;
    dias_esperando: number;
    postulantes_pendientes: number;
  }>(
    `select p.id, p.sistema_o_proyecto, u.celular,
            floor(extract(epoch from (now() - min(po.creado_en))) / 86400)::int as dias_esperando,
            count(po.id)::int as postulantes_pendientes
     from publicaciones p
     join usuarios u on u.id = p.autor_id
     join postulaciones po on po.publicacion_id = p.id and po.estado = 'pendiente'
     where p.estado = 'abierta'
       and p.aviso_postulantes_enviado = false
     group by p.id, p.sistema_o_proyecto, u.celular
     having now() - min(po.creado_en) >= interval '${DIAS_ESPERA_POSTULANTES} days'`
  );

  for (const fila of porAvisarPostulantes.rows) {
    await enviarAvisoPostulantesPendientes(fila.celular, fila.sistema_o_proyecto, fila.dias_esperando, fila.postulantes_pendientes);
    await query("update publicaciones set aviso_postulantes_enviado = true where id = $1", [fila.id]);
  }

  // Limpieza de tablas que solo existen para controlar tasa/OTP a corto
  // plazo — sin esto crecen indefinidamente con más usuarios y terminan
  // haciendo cada chequeo de límite más lento de lo necesario.
  const limpiezaRateLimits = await query<{ id: string }>(
    "delete from rate_limits where creado_en < now() - interval '2 days' returning id"
  );
  const limpiezaOtpIp = await query<{ id: string }>(
    "delete from otp_solicitudes_ip where creado_en < now() - interval '2 days' returning id"
  );
  const limpiezaOtps = await query<{ celular: string }>(
    "delete from otps where expira_en < now() returning celular"
  );

  return NextResponse.json({
    ok: true,
    avisosExpiracionEnviados: porAvisarExpiracion.rows.length,
    expiradas: expiradas.rows.length,
    avisosPostulantesEnviados: porAvisarPostulantes.rows.length,
    rateLimitsBorrados: limpiezaRateLimits.rows.length,
    otpIpBorrados: limpiezaOtpIp.rows.length,
    otpsExpiradosBorrados: limpiezaOtps.rows.length,
  });
}
