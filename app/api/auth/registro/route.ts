import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { crearSesion, limpiarTelefonoVerificado, obtenerTelefonoVerificado } from "@/lib/auth/session";
import { normalizarCiudad } from "@/lib/constants/regiones";

const TIPOS_USUARIO = ["empresa", "taller", "independiente"];
const OFRECE = ["produccion", "instalacion", "ambos"];

export async function POST(request: Request) {
  // El celular SIEMPRE viene de la cookie firmada tras el OTP, nunca del
  // cuerpo de la petición — así nadie puede crear una cuenta a nombre de un
  // número que no verificó.
  const celular = await obtenerTelefonoVerificado();
  if (!celular) {
    return NextResponse.json(
      { ok: false, error: "Verifica tu celular con el código antes de registrarte." },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const tipoUsuario = String(body?.tipoUsuario ?? "");
  const ofrece = String(body?.ofrece ?? "");
  const nombre = String(body?.nombreRazonSocial ?? "").trim();
  const ciudad = normalizarCiudad(String(body?.ciudad ?? ""));
  const documento = body?.documento ? String(body.documento).trim() : null;
  const sistemaLinea = body?.sistemaLinea ? String(body.sistemaLinea).trim() : null;
  const anosExperiencia = body?.anosExperiencia ? Number(body.anosExperiencia) : null;
  const aceptaTerminos = Boolean(body?.aceptaTerminos);

  if (!TIPOS_USUARIO.includes(tipoUsuario) || !OFRECE.includes(ofrece) || !nombre || !ciudad) {
    return NextResponse.json({ ok: false, error: "Completa los campos obligatorios." }, { status: 400 });
  }
  if (!aceptaTerminos) {
    return NextResponse.json({ ok: false, error: "Debes aceptar los términos y condiciones." }, { status: 400 });
  }

  const existente = await query("select id from usuarios where celular = $1", [celular]);
  if (existente.rows[0]) {
    return NextResponse.json({ ok: false, error: "Este celular ya tiene una cuenta." }, { status: 409 });
  }

  const creado = await query<{ id: string }>(
    `insert into usuarios
       (celular, tipo_usuario, nombre_razon_social, documento, ciudad, ofrece, sistema_linea, anos_experiencia, verificado, terminos_aceptados_en)
     values ($1, $2, $3, $4, $5, $6, $7, $8, true, now())
     returning id`,
    [celular, tipoUsuario, nombre, documento, ciudad, ofrece, sistemaLinea, anosExperiencia]
  );

  await crearSesion(creado.rows[0].id);
  await limpiarTelefonoVerificado();

  return NextResponse.json({ ok: true });
}
