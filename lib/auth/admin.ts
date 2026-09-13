import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function obtenerUsuarioIdAdmin(): Promise<string | null> {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) return null;

  const result = await query<{ es_admin: boolean }>(
    "select es_admin from usuarios where id = $1",
    [usuarioId]
  );
  return result.rows[0]?.es_admin ? usuarioId : null;
}
