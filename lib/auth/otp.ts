import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { query } from "@/lib/db";

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutos
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 segundos entre reenvíos
const OTP_MAX_INTENTOS = 5;
const OTP_LIMITE_POR_IP = 8;
const OTP_VENTANA_IP_MS = 60 * 60 * 1000; // 1 hora

function pepper(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno AUTH_SECRET");
  return secret;
}

function hashCodigo(celular: string, codigo: string): string {
  return createHmac("sha256", pepper()).update(`${celular}:${codigo}`).digest("hex");
}

function hashesIguales(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function ipExcedioLimite(ip: string): Promise<boolean> {
  const desde = new Date(Date.now() - OTP_VENTANA_IP_MS).toISOString();
  const resultado = await query<{ total: string }>(
    "select count(*) as total from otp_solicitudes_ip where ip = $1 and creado_en > $2",
    [ip, desde]
  );
  return Number(resultado.rows[0]?.total ?? 0) >= OTP_LIMITE_POR_IP;
}

export async function registrarSolicitudIp(ip: string): Promise<void> {
  await query("insert into otp_solicitudes_ip (ip) values ($1)", [ip]);
}

export async function generarYGuardarOtp(
  celular: string
): Promise<{ codigo: string } | { errorCooldown: true }> {
  const existente = await query<{ creado_en: string }>(
    "select creado_en from otps where celular = $1",
    [celular]
  );
  if (existente.rows[0]) {
    const creado = new Date(existente.rows[0].creado_en).getTime();
    if (Date.now() - creado < OTP_RESEND_COOLDOWN_MS) {
      return { errorCooldown: true };
    }
  }

  const codigo = randomInt(0, 1_000_000).toString().padStart(6, "0");
  const codigoHash = hashCodigo(celular, codigo);
  const expiraEn = new Date(Date.now() + OTP_TTL_MS).toISOString();

  await query(
    `insert into otps (celular, codigo_hash, expira_en, intentos, creado_en)
     values ($1, $2, $3, 0, now())
     on conflict (celular) do update
       set codigo_hash = excluded.codigo_hash,
           expira_en = excluded.expira_en,
           intentos = 0,
           creado_en = now()`,
    [celular, codigoHash, expiraEn]
  );

  return { codigo };
}

export type VerificarResultado =
  | { ok: true }
  | {
      ok: false;
      razon: "no_solicitado" | "expirado" | "codigo_incorrecto" | "demasiados_intentos";
    };

export async function verificarOtp(celular: string, codigo: string): Promise<VerificarResultado> {
  const result = await query<{ codigo_hash: string; expira_en: string; intentos: number }>(
    "select codigo_hash, expira_en, intentos from otps where celular = $1",
    [celular]
  );
  const fila = result.rows[0];
  if (!fila) return { ok: false, razon: "no_solicitado" };

  if (new Date(fila.expira_en).getTime() < Date.now()) {
    await query("delete from otps where celular = $1", [celular]);
    return { ok: false, razon: "expirado" };
  }

  if (fila.intentos >= OTP_MAX_INTENTOS) {
    await query("delete from otps where celular = $1", [celular]);
    return { ok: false, razon: "demasiados_intentos" };
  }

  if (!hashesIguales(hashCodigo(celular, codigo), fila.codigo_hash)) {
    await query("update otps set intentos = intentos + 1 where celular = $1", [celular]);
    return { ok: false, razon: "codigo_incorrecto" };
  }

  await query("delete from otps where celular = $1", [celular]);
  return { ok: true };
}
