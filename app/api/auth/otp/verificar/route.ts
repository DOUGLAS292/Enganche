import { NextResponse } from "next/server";
import { normalizarCelularCO } from "@/lib/validation/telefono";
import { verificarOtp } from "@/lib/auth/otp";
import { query } from "@/lib/db";
import { crearSesion, marcarTelefonoVerificado } from "@/lib/auth/session";

const RAZON_MENSAJE: Record<string, string> = {
  no_solicitado: "Primero pide un código para este celular.",
  expirado: "El código venció, pide uno nuevo.",
  codigo_incorrecto: "El código no es correcto.",
  demasiados_intentos: "Demasiados intentos. Pide un código nuevo.",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const celular = normalizarCelularCO(body?.celular ?? "");
  const codigo = String(body?.codigo ?? "").trim();

  if (!celular || !/^\d{6}$/.test(codigo)) {
    return NextResponse.json({ ok: false, error: "Datos inválidos." }, { status: 400 });
  }

  const resultado = await verificarOtp(celular, codigo);
  if (!resultado.ok) {
    return NextResponse.json({ ok: false, error: RAZON_MENSAJE[resultado.razon] }, { status: 400 });
  }

  const usuario = await query<{ id: string; verificado: boolean }>(
    "select id, verificado from usuarios where celular = $1",
    [celular]
  );

  if (usuario.rows[0]) {
    if (!usuario.rows[0].verificado) {
      await query("update usuarios set verificado = true where id = $1", [usuario.rows[0].id]);
    }
    await crearSesion(usuario.rows[0].id);
    return NextResponse.json({ ok: true, usuarioExistente: true });
  }

  await marcarTelefonoVerificado(celular);
  return NextResponse.json({ ok: true, usuarioExistente: false });
}
