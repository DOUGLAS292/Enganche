import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { enviarPushAUsuario } from "@/lib/push/enviar";

export async function POST(request: Request) {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const usuarioId = String(body?.usuarioId ?? "");
  const mensaje = String(body?.mensaje ?? "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(usuarioId) || mensaje.length < 5 || mensaje.length > 600) {
    return NextResponse.json({ ok: false, error: "Escribe un mensaje de 5 a 600 caracteres." }, { status: 400 });
  }
  const existe = await query(`select 1 from usuarios where id = $1`, [usuarioId]);
  if (!existe.rows[0]) {
    return NextResponse.json({ ok: false, error: "Usuario no encontrado." }, { status: 404 });
  }
  await query(`insert into avisos_usuario (usuario_id, mensaje, enviado_por) values ($1, $2, $3)`, [usuarioId, mensaje, adminId]);
  try {
    await enviarPushAUsuario(usuarioId, { titulo: "Aviso de Enganche", cuerpo: mensaje.slice(0, 120), url: "/", tag: "aviso-admin" });
  } catch {
    // El aviso queda guardado aunque el push falle.
  }
  return NextResponse.json({ ok: true });
}
