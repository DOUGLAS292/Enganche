import { normalizarCelularCO } from "@/lib/validation/telefono";

// Envía el código OTP por WhatsApp usando la Cloud API de Meta.
//
// Requiere una plantilla de mensaje categoría "Authentication" ya aprobada en
// Meta Business Manager (ver README § Fase 1) y las variables de entorno
// WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_OTP_TEMPLATE.
// Mientras esas credenciales no estén configuradas, el código se imprime en
// la consola del servidor. En desarrollo local además viaja en la respuesta
// de la API para probar el flujo completo sin WhatsApp real.
//
// En producción eso NUNCA ocurre: devolver el código en la respuesta deja
// entrar a cualquier cuenta solo con escribir su número. Sin WhatsApp
// configurado, producción solo deja pedir código a los números de
// OTP_DEV_ALLOWLIST (separados por coma), y aun para ellos el código solo
// queda en los logs del servidor (Vercel → Logs), nunca en pantalla — si
// saliera en pantalla, cualquiera que conozca ese número entraría.

const GRAPH_VERSION = "v21.0";

export function whatsappConfigurado(): boolean {
  return Boolean(
    process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_OTP_TEMPLATE
  );
}

function esProduccion(): boolean {
  return process.env.NODE_ENV === "production";
}

// Solo en desarrollo local el código viaja en la respuesta de la API.
export function otpEnModoDesarrollo(): boolean {
  return !esProduccion() && !whatsappConfigurado();
}

// Si este celular puede pedir código ahora mismo. Con WhatsApp configurado
// o en desarrollo local, cualquiera; en producción sin WhatsApp, solo los
// números de la lista blanca.
export function puedePedirOtp(celular: string): boolean {
  if (whatsappConfigurado() || !esProduccion()) return true;
  const lista = (process.env.OTP_DEV_ALLOWLIST ?? "")
    .split(",")
    .map((n) => normalizarCelularCO(n))
    .filter((n): n is string => Boolean(n));
  return lista.includes(celular);
}

export async function enviarOtpWhatsApp(celular: string, codigo: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_OTP_TEMPLATE;
  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG || "es";

  if (!token || !phoneNumberId || !template) {
    console.log(`[Enganche] WhatsApp no configurado todavía — código OTP para ${celular}: ${codigo}`);
    return;
  }

  const destino = celular.replace("+", "");

  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino,
      type: "template",
      template: {
        name: template,
        language: { code: templateLang },
        components: [
          { type: "body", parameters: [{ type: "text", text: codigo }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: codigo }] },
        ],
      },
    }),
  });

  if (!res.ok) {
    const detalle = await res.text();
    throw new Error(`Falló el envío por WhatsApp (${res.status}): ${detalle}`);
  }
}
