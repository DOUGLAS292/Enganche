import { query } from "@/lib/db";
import { enviarAvisoUrgenteConfirmado, enviarAvisoOfertaUrgenteCerca } from "@/lib/whatsapp/notificaciones";

const RADIO_AVISO_METROS = 15000;

// Compartida entre la confirmación manual del admin y el webhook de
// Wompi: confirma el impulso y dispara el aviso a los postulantes
// cercanos — el mismo efecto sin importar quién (o qué) confirmó el pago.
export async function confirmarImpulsoUrgentePorId(impulsoId: string): Promise<boolean> {
  const actualizada = await query<{ publicacion_id: string }>(
    `update impulsos_urgentes
       set estado = 'confirmada', confirmada_en = now()
     where id = $1 and estado != 'confirmada'
     returning publicacion_id`,
    [impulsoId]
  );
  const impulso = actualizada.rows[0];
  if (!impulso) return false;

  const publicacion = await query<{
    autor_id: string;
    tipo_trabajo: string;
    sistema_o_proyecto: string;
    ciudad: string;
  }>(
    "select autor_id, tipo_trabajo, sistema_o_proyecto, ciudad from publicaciones where id = $1",
    [impulso.publicacion_id]
  );
  const pub = publicacion.rows[0];
  if (!pub) return true;

  const autor = await query<{ celular: string }>("select celular from usuarios where id = $1", [pub.autor_id]);
  if (autor.rows[0]) {
    await enviarAvisoUrgenteConfirmado(autor.rows[0].celular, pub.sistema_o_proyecto);
  }

  // Avisa a quienes califican y están cerca: por ubicación si la oferta la
  // tiene guardada, y siempre también por coincidencia de ciudad (igual
  // que el feed) para no dejar fuera a quien no comparte GPS.
  const destinatarios = await query<{ celular: string }>(
    `select u.celular
     from usuarios u
     join publicaciones p on p.id = $1
     where u.id != $2
       and (u.ofrece = $3 or u.ofrece = 'ambos')
       and (
         u.ciudad ilike p.ciudad
         or (u.ubicacion is not null and p.ubicacion is not null and ST_DWithin(u.ubicacion, p.ubicacion, $4))
       )`,
    [impulso.publicacion_id, pub.autor_id, pub.tipo_trabajo, RADIO_AVISO_METROS]
  );
  await Promise.all(
    destinatarios.rows.map((d) => enviarAvisoOfertaUrgenteCerca(d.celular, pub.sistema_o_proyecto, pub.ciudad))
  );

  return true;
}
