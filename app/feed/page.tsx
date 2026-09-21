import { redirect } from "next/navigation";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }
  // Abrir el feed es lo que hace desaparecer el aviso de "ofertas nuevas
  // cerca de ti" en el inicio — mismo patrón que los mensajes leídos.
  await query("update usuarios set feed_visto_hasta = now() where id = $1", [usuarioId]);
  return <FeedClient />;
}
