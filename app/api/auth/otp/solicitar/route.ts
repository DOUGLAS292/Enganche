import { NextResponse } from "next/server";
import { normalizarCelularCO } from "@/lib/validation/telefono";
import { generarYGuardarOtp } from "@/lib/auth/otp";
import { enviarOtpWhatsApp, otpEnModoDesarrollo } from "@/lib/auth/whatsapp";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const celular = normalizarCelularCO(body?.celular ?? "");

  if (!celular) {
    return NextResponse.json(
      { ok: false, error: "Ingresa un celular colombiano válido (10 dígitos, empieza en 3)." },
      { status: 400 }
    );
  }

  const resultado = await generarYGuardarOtp(celular);
  if ("errorCooldown" in resultado) {
    return NextResponse.json(
      { ok: false, error: "Ya enviamos un código hace poco. Espera un momento antes de pedir otro." },
      { status: 429 }
    );
  }

  await enviarOtpWhatsApp(celular, resultado.codigo);

  return NextResponse.json({
    ok: true,
    celular,
    ...(otpEnModoDesarrollo() ? { codigoDesarrollo: resultado.codigo } : {}),
  });
}
