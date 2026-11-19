import { enviarOtpWhatsApp, whatsappConfigurado } from "@/lib/auth/whatsapp";
import { otpComConfigurado } from "@/lib/auth/otpcom";

export type CanalOtp = "whatsapp" | "sms";

// Un canal aparece en la pantalla solo si sus credenciales están configuradas.
export function canalesConfigurados(): CanalOtp[] {
  const canales: CanalOtp[] = [];
  if (whatsappConfigurado()) canales.push("whatsapp");
  if (smsConfigurado()) canales.push("sms");
  return canales;
}

// WhatsApp usa el código propio de Enganche. El SMS usa otp.com (ver otpcom.ts),
// que genera, envía y valida el código por su cuenta.
export function smsConfigurado(): boolean {
  return otpComConfigurado();
}

export async function enviarOtp(canal: CanalOtp, celular: string, codigo: string): Promise<void> {
  if (canal === "whatsapp") {
    await enviarOtpWhatsApp(celular, codigo);
    return;
  }
  throw new Error("El SMS se envía con enviarSmsOtpCom");
}
