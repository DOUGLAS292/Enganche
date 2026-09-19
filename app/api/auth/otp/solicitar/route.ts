import { NextResponse } from "next/server";
import { normalizarCelularCO } from "@/lib/validation/telefono";
import { generarYGuardarOtp, ipExcedioLimite, registrarSolicitudIp } from "@/lib/auth/otp";
import { enviarOtpWhatsApp, otpEnModoDesarrollo } from "@/lib/auth/whatsapp";

function obtenerIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "desconocida";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const celular = normalizarCelularCO(body?.celular ?? "");

  if (!celular) {
    return NextResponse.json(
      { ok: false, error: "Ingresa un celular colombiano válido (10 dígitos, empieza en 3)." },
      { status: 400 }
    );
  }

  const ip = obtenerIp(request);
  if (await ipExcedioLimite(ip)) {
    return NextResponse.json(
      { ok: false, error: "Demasiados intentos desde esta conexión. Espera un momento e intenta de nuevo." },
      { status: 429 }
    );
  }
  await registrarSolicitudIp(ip);

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
