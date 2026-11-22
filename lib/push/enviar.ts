import webpush from "web-push";
import { query } from "@/lib/db";
import { obtenerClavesVapid } from "./vapid";

export type AvisoPush = {
  titulo: string;
  cuerpo: string;
  // Ruta dentro de la app a abrir al tocar el aviso, p. ej. "/publicaciones/123".
  url?: string;
  // Avisos con la misma etiqueta se reemplazan entre sí en lugar de apilarse.
  tag?: string;
};

const FALLOS_PARA_BORRAR = 5;
const TIMEOUT_MS = 8000;

// Solo se envía a los servicios de notificaciones de los navegadores. Sin esta
// lista, quien se suscribe podría poner cualquier dirección y hacer que el
// servidor le haga peticiones (SSRF).
const SERVICIOS_PUSH = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "push.apple.com",
  "notify.windows.com",
];

export function endpointPermitido(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (url.protocol !== "https:") return false;
    return SERVICIOS_PUSH.some((s) => url.hostname === s || url.hostname.endsWith(`.${s}`));
  } catch {
    return false;
  }
}

let configurado = false;
function configurar() {
  if (configurado) return;
  const claves = obtenerClavesVapid();
  webpush.setVapidDetails("mailto:Enganche.App.Contacto@gmail.com", claves.publica, claves.privada);
  configurado = true;
}

type Suscripcion = { id: string; endpoint: string; p256dh: string; auth: string };

async function enviarASuscripciones(suscripciones: Suscripcion[], aviso: AvisoPush): Promise<number> {
  if (suscripciones.length === 0) return 0;
  configurar();
  const carga = JSON.stringify({ titulo: aviso.titulo, cuerpo: aviso.cuerpo, url: aviso.url ?? "/", tag: aviso.tag });
  let entregados = 0;

  await Promise.allSettled(
    suscripciones.map(async (s) => {
      if (!endpointPermitido(s.endpoint)) {
        await query("delete from push_suscripciones where id = $1", [s.id]);
        return;
      }
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, carga, {
          TTL: 60 * 60 * 24,
          urgency: "high",
          timeout: TIMEOUT_MS,
        });
        entregados++;
        await query("update push_suscripciones set fallos = 0, ultimo_envio_en = now() where id = $1", [s.id]);
      } catch (err) {
        const estado = (err as { statusCode?: number }).statusCode;
        if (estado === 404 || estado === 410) {
          // El dispositivo canceló los avisos o desinstaló la app.
          await query("delete from push_suscripciones where id = $1", [s.id]);
        } else {
          console.error(`[Enganche] No se pudo enviar el aviso push (${estado ?? "sin respuesta"}):`, (err as Error).message);
          await query(
            "update push_suscripciones set fallos = fallos + 1 where id = $1",
            [s.id]
          );
          await query("delete from push_suscripciones where id = $1 and fallos >= $2", [s.id, FALLOS_PARA_BORRAR]);
        }
      }
    })
  );
  return entregados;
}

// Nunca lanza error: un aviso fallido no debe tumbar la operación que lo causó.
export async function enviarPushAUsuario(usuarioId: string, aviso: AvisoPush): Promise<void> {
  try {
    const r = await query<Suscripcion>(
      "select id, endpoint, p256dh, auth from push_suscripciones where usuario_id = $1",
      [usuarioId]
    );
    await enviarASuscripciones(r.rows, aviso);
  } catch (err) {
    console.error("[Enganche] Error enviando aviso push:", err);
  }
}

export async function enviarPushACelular(celular: string, aviso: AvisoPush): Promise<void> {
  try {
    const r = await query<Suscripcion>(
      `select s.id, s.endpoint, s.p256dh, s.auth
       from push_suscripciones s join usuarios u on u.id = s.usuario_id
       where u.celular = $1`,
      [celular]
    );
    await enviarASuscripciones(r.rows, aviso);
  } catch (err) {
    console.error("[Enganche] Error enviando aviso push:", err);
  }
}

// Para el aviso de bienvenida al activar: solo a ese dispositivo.
export async function enviarPushAEndpoint(usuarioId: string, endpoint: string, aviso: AvisoPush): Promise<boolean> {
  try {
    const r = await query<Suscripcion>(
      "select id, endpoint, p256dh, auth from push_suscripciones where usuario_id = $1 and endpoint = $2",
      [usuarioId, endpoint]
    );
    return (await enviarASuscripciones(r.rows, aviso)) > 0;
  } catch (err) {
    console.error("[Enganche] Error enviando aviso push de prueba:", err);
    return false;
  }
}
