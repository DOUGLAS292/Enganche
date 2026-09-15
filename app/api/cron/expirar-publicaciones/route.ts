import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { enviarAvisoExpiracion } from "@/lib/whatsapp/notificaciones";

// Corre una vez al día (ver vercel.json). Hace dos cosas, en este orden:
//
// 1. Avisa por WhatsApp a los autores de ofertas que llevan 13-14 días
//    abiertas sin ninguna postulación nueva (día 13 en adelante, antes de
//    que expiren el día 15), una sola vez por oferta.
// 2. Expira (pasa a 'expirada') las que ya llegaron a 15 días sin
//    postulaciones nuevas.
//
// Protegida con CRON_SECRET para que solo Vercel (o quien tenga el
// secreto) pueda dispararla — sin esto, cualquiera podría forzar avisos o
// expiraciones desde afuera.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const porAvisar = await query<{
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

  for (const fila of porAvisar.rows) {
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

  return NextResponse.json({
    ok: true,
    avisosEnviados: porAvisar.rows.length,
    expiradas: expiradas.rows.length,
  });
}
