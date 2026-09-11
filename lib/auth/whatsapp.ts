// Envía el código OTP por WhatsApp usando la Cloud API de Meta.
//
// Requiere una plantilla de mensaje categoría "Authentication" ya aprobada en
// Meta Business Manager (ver README § Fase 1) y las variables de entorno
// WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_OTP_TEMPLATE.
// Mientras esas credenciales no estén configuradas, el código se imprime en
// la consola del servidor (y viaja en la respuesta de la API en modo
// desarrollo) para poder probar el flujo completo sin WhatsApp real. Esto
// NUNCA debe activarse en producción — solo ocurre cuando las variables de
// WhatsApp están vacías.

const GRAPH_VERSION = "v21.0";

export function otpEnModoDesarrollo(): boolean {
  return !process.env.WHATSAPP_ACCESS_TOKEN;
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
