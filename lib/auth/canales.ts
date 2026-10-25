import { enviarOtpWhatsApp, whatsappConfigurado } from "@/lib/auth/whatsapp";

export type CanalOtp = "whatsapp" | "sms";

// Un canal aparece en la pantalla solo si sus credenciales están configuradas.
export function canalesConfigurados(): CanalOtp[] {
  const canales: CanalOtp[] = [];
  if (whatsappConfigurado()) canales.push("whatsapp");
  if (smsConfigurado()) canales.push("sms");
  return canales;
}

function smsConfigurado(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_FROM_SMS)
  );
}

export async function enviarOtp(canal: CanalOtp, celular: string, codigo: string): Promise<void> {
  if (canal === "whatsapp") {
    await enviarOtpWhatsApp(celular, codigo);
    return;
  }
  await enviarSms(celular, codigo);
}

// SMS con la API REST de Twilio (sin SDK, para no añadir dependencias).
async function enviarSms(celular: string, codigo: string): Promise<void> {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const body = new URLSearchParams({
    To: celular,
    Body: `Tu código de Enganche es ${codigo}. Vence en 5 minutos. No lo compartas.`,
  });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    body.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    body.set("From", process.env.TWILIO_FROM_SMS!);
  }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Falló el envío de SMS (${res.status}): ${detalle}`);
  }
}
