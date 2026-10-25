import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { normalizarCelularCO } from "@/lib/validation/telefono";
import { generarYGuardarOtp, ipExcedioLimite, registrarSolicitudIp } from "@/lib/auth/otp";
import { otpEnModoDesarrollo, puedePedirOtp } from "@/lib/auth/whatsapp";
import { canalesConfigurados, enviarOtp, type CanalOtp } from "@/lib/auth/canales";

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

  const configurados = canalesConfigurados();
  if (!puedePedirOtp(celular, configurados.length > 0)) {
    return NextResponse.json(
      { ok: false, error: "El ingreso está en mantenimiento por unas horas. Intenta más tarde." },
      { status: 503 }
    );
  }

  // Con un solo canal activo se usa ese; con varios, el usuario escoge.
  const canalPedido = body?.canal as CanalOtp | undefined;
  const canal: CanalOtp | undefined = canalPedido ?? (configurados.length === 1 ? configurados[0] : undefined);
  if (configurados.length > 0 && (!canal || !configurados.includes(canal))) {
    return NextResponse.json({ ok: false, error: "Escoge cómo quieres recibir el código." }, { status: 400 });
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

  if (canal) {
    await enviarOtp(canal, celular, resultado.codigo);
    // Solo el canal y la fecha, para medir la preferencia sin identificar al usuario.
    await query("insert into otp_canal_elegido (canal) values ($1)", [canal]);
  } else {
    // Sin canal activo solo queda el log del servidor (lista blanca o desarrollo).
    console.log(`[Enganche] Sin canal configurado — código OTP para ${celular}: ${resultado.codigo}`);
  }

  return NextResponse.json({
    ok: true,
    celular,
    canal: canal ?? null,
    ...(otpEnModoDesarrollo() ? { codigoDesarrollo: resultado.codigo } : {}),
  });
}
