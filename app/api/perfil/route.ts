import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { normalizarCiudad } from "@/lib/constants/regiones";

const TIPOS_USUARIO = ["empresa", "taller", "independiente"];
const OFRECE = ["produccion", "instalacion", "ambos"];

export async function PATCH(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const nombre = String(body?.nombreRazonSocial ?? "").trim();
  const ciudad = normalizarCiudad(String(body?.ciudad ?? ""));
  const tipoUsuario = String(body?.tipoUsuario ?? "");
  const ofrece = String(body?.ofrece ?? "");
  const sistemaLinea = body?.sistemaLinea ? String(body.sistemaLinea).trim().slice(0, 120) : null;
  const anosExperiencia = body?.anosExperiencia !== "" && body?.anosExperiencia != null ? Number(body.anosExperiencia) : null;

  if (nombre.length < 2 || nombre.length > 120) {
    return NextResponse.json({ ok: false, error: "El nombre debe tener entre 2 y 120 caracteres." }, { status: 400 });
  }
  if (!ciudad) {
    return NextResponse.json({ ok: false, error: "La ciudad no puede quedar vacía." }, { status: 400 });
  }
  if (!TIPOS_USUARIO.includes(tipoUsuario) || !OFRECE.includes(ofrece)) {
    return NextResponse.json({ ok: false, error: "Tipo de usuario u ofrecimiento inválido." }, { status: 400 });
  }
  if (anosExperiencia !== null && (!Number.isInteger(anosExperiencia) || anosExperiencia < 0 || anosExperiencia > 80)) {
    return NextResponse.json({ ok: false, error: "Años de experiencia inválidos." }, { status: 400 });
  }

  await query(
    `update usuarios
       set nombre_razon_social = $1, ciudad = $2, tipo_usuario = $3, ofrece = $4,
           sistema_linea = $5, anos_experiencia = $6
     where id = $7`,
    [nombre, ciudad, tipoUsuario, ofrece, sistemaLinea, anosExperiencia, usuarioId]
  );

  return NextResponse.json({ ok: true });
}
