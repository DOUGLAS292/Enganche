import { query } from "@/lib/db";

// Límite de tasa genérico por IP o por usuario, respaldado en la tabla
// rate_limits — mismo patrón que ya usaba el OTP (otp_solicitudes_ip) pero
// reutilizable para cualquier endpoint que necesite frenar abuso.
export async function excedioLimite(bucket: string, clave: string, limite: number, ventanaMs: number): Promise<boolean> {
  const desde = new Date(Date.now() - ventanaMs).toISOString();
  const resultado = await query<{ total: string }>(
    "select count(*) as total from rate_limits where bucket = $1 and clave = $2 and creado_en > $3",
    [bucket, clave, desde]
  );
  return Number(resultado.rows[0]?.total ?? 0) >= limite;
}

export async function registrarIntento(bucket: string, clave: string): Promise<void> {
  await query("insert into rate_limits (bucket, clave) values ($1, $2)", [bucket, clave]);
}

export function obtenerIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "desconocida";
}
