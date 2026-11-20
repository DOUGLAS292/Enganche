import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// SMS con otp.com: ellos generan, envían y comprueban el código (y cuentan los
// intentos). Solo guardamos el otp_id que devuelve el envío, en una cookie
// firmada y de corta vida, para poder verificar después sin otra tabla.
const API_BASE = "https://api.otp.com/api/v1/otp";
const COOKIE = "enganche_otp_sms";
const COOKIE_MAX_AGE_SEG = 60 * 10; // 10 minutos
const TIMEOUT_MS = 10_000;

export function otpComConfigurado(): boolean {
  return Boolean(process.env.OTP_COM_API_KEY);
}

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

function encabezados(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.OTP_COM_API_KEY}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

async function guardarOtpId(celular: string, otpId: string): Promise<void> {
  const jwt = await new SignJWT({ celular, otpId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${COOKIE_MAX_AGE_SEG}s`)
    .sign(secretKey());
  const store = await cookies();
  store.set(COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEG,
  });
}

async function leerOtpId(celular: string): Promise<string | null> {
  const store = await cookies();
  const jwt = store.get(COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    if (payload.celular !== celular || typeof payload.otpId !== "string") return null;
    return payload.otpId;
  } catch {
    return null;
  }
}

export async function limpiarOtpComPendiente(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

export type EnvioOtpCom = { ok: true } | { ok: false; limite: boolean };

export async function enviarSmsOtpCom(celular: string, clientIp?: string): Promise<EnvioOtpCom> {
  // Un doble toque en el mismo minuto repite la respuesta en lugar de cobrar dos códigos.
  const idempotencia = `enganche-login:${celular}:${Math.floor(Date.now() / 60_000)}`;
  const cuerpo: Record<string, string> = { recipient: celular, locale: "es" };
  if (clientIp) cuerpo.client_ip = clientIp;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/send`, {
      method: "POST",
      headers: encabezados({ "idempotency-key": idempotencia }),
      body: JSON.stringify(cuerpo),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error("[Enganche] Error de red enviando SMS con otp.com:", err);
    return { ok: false, limite: false };
  }

  if (!res.ok) {
    console.error(`[Enganche] otp.com no envió el SMS (${res.status}): ${await res.text()}`);
    return { ok: false, limite: res.status === 429 };
  }

  const datos = (await res.json().catch(() => null)) as {
    otp_id?: string;
    channel?: string;
    completion?: string;
    action_url?: string | null;
  } | null;

  // Si el enrutamiento de la cuenta eligió un canal que no entrega un código para
  // escribir (p. ej. WhatsApp por enlace), esta pantalla no puede completarlo.
  if (!datos?.otp_id || datos.completion !== "code" || datos.action_url) {
    console.error(`[Enganche] otp.com devolvió una respuesta que no sirve para esta pantalla: ${JSON.stringify(datos)}`);
    return { ok: false, limite: false };
  }

  await guardarOtpId(celular, datos.otp_id);
  return { ok: true };
}

export type ResultadoVerificacionOtpCom =
  | { ok: true }
  | { ok: false; razon: "codigo_incorrecto" | "demasiados_intentos" | "expirado" | "error_servicio" };

// null = este celular no tiene un SMS de otp.com pendiente en este navegador
// (se sigue con el código propio de Enganche).
export async function verificarSmsOtpCom(celular: string, codigo: string): Promise<ResultadoVerificacionOtpCom | null> {
  const otpId = await leerOtpId(celular);
  if (!otpId) return null;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/verify`, {
      method: "POST",
      headers: encabezados(),
      body: JSON.stringify({ otp_id: otpId, code: codigo }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    console.error("[Enganche] Error de red verificando con otp.com:", err);
    return { ok: false, razon: "error_servicio" };
  }

  if (res.status === 404) {
    await limpiarOtpComPendiente();
    return { ok: false, razon: "expirado" };
  }
  if (!res.ok) {
    console.error(`[Enganche] otp.com no pudo verificar (${res.status}): ${await res.text()}`);
    return { ok: false, razon: "error_servicio" };
  }

  const datos = (await res.json().catch(() => null)) as { matched?: boolean; status?: string } | null;
  if (datos?.matched === true) {
    await limpiarOtpComPendiente();
    return { ok: true };
  }
  if (datos?.status === "failed") {
    await limpiarOtpComPendiente();
    return { ok: false, razon: "demasiados_intentos" };
  }
  return { ok: false, razon: "codigo_incorrecto" };
}
