import { enviarOtpWhatsApp, whatsappConfigurado } from "@/lib/auth/whatsapp";

export type CanalOtp = "whatsapp" | "sms";

// Un canal aparece en la pantalla solo si sus credenciales están configuradas.
export function canalesConfigurados(): CanalOtp[] {
  const canales: CanalOtp[] = [];
  if (whatsappConfigurado()) canales.push("whatsapp");
  if (smsConfigurado()) canales.push("sms");
  return canales;
}

export function smsConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_VERIFY_SERVICE_SID
  );
}

// WhatsApp usa el código propio de Enganche. El SMS usa Twilio Verify, que
// genera, envía y valida el código por su cuenta (con sus propios límites).
export async function enviarOtp(canal: CanalOtp, celular: string, codigo: string): Promise<void> {
  if (canal === "whatsapp") {
    await enviarOtpWhatsApp(celular, codigo);
    return;
  }
  throw new Error("El SMS se envía con iniciarVerifySms");
}

function authTwilio(): string {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  return `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`;
}

function urlVerify(ruta: string): string {
  return `https://verify.twilio.com/v2/Services/${process.env.TWILIO_VERIFY_SERVICE_SID}/${ruta}`;
}

export async function iniciarVerifySms(celular: string): Promise<{ ok: true } | { ok: false; limite: boolean }> {
  const res = await fetch(urlVerify("Verifications"), {
    method: "POST",
    headers: { Authorization: authTwilio(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: celular, Channel: "sms", Locale: "es" }),
  });
  if (res.ok) return { ok: true };
  console.error(`[Enganche] Twilio Verify no envió el SMS (${res.status}): ${await res.text()}`);
  return { ok: false, limite: res.status === 429 };
}

export async function verificarVerifySms(celular: string, codigo: string): Promise<boolean> {
  const res = await fetch(urlVerify("VerificationCheck"), {
    method: "POST",
    headers: { Authorization: authTwilio(), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: celular, Code: codigo }),
  });
  if (!res.ok) return false; // 404 = vencido/ya usado/aprobado
  const datos = (await res.json().catch(() => null)) as { status?: string } | null;
  return datos?.status === "approved";
}
