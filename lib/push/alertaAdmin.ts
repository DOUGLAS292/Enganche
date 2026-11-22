import { query } from "@/lib/db";
import { excedioLimite, registrarIntento } from "@/lib/rateLimit";
import { enviarPushAUsuario } from "./enviar";

const VENTANA_MS = 30 * 60 * 1000;

// Avisa por push a los administradores de un problema que bloquea a los
// usuarios (p. ej. el proveedor de SMS no envía). Máximo un aviso cada 30
// minutos por tipo, para no llenar el celular si el fallo se repite.
// Nunca lanza error: una alerta fallida no debe empeorar el problema.
export async function alertarAdmins(tipo: string, titulo: string, cuerpo: string, url = "/admin"): Promise<void> {
  try {
    if (await excedioLimite("alerta_admin", tipo, 1, VENTANA_MS)) return;
    await registrarIntento("alerta_admin", tipo);
    const admins = await query<{ id: string }>("select id from usuarios where es_admin = true");
    await Promise.all(admins.rows.map((a) => enviarPushAUsuario(a.id, { titulo, cuerpo, url, tag: `alerta-${tipo}` })));
  } catch (err) {
    console.error("[Enganche] No se pudo enviar la alerta a los administradores:", err);
  }
}
