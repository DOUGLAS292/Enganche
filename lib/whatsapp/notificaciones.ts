// Aviso de "publicación por expirar" enviado por WhatsApp — mismo patrón
// que el OTP de lib/auth/whatsapp.ts, pero con una plantilla distinta:
// esta es categoría "Utility" en Meta Business Manager, no "Authentication"
// (esa sigue reservada solo para el código de acceso). Mientras esa
// plantilla no exista o no esté aprobada, el aviso se registra en la
// consola del servidor — nunca debe tumbar el cron por esto, por eso no
// relanza el error si falla el envío real.
const GRAPH_VERSION = "v21.0";

export async function enviarAvisoExpiracion(
  celular: string,
  sistemaOProyecto: string,
  diasInactiva: number
): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const template = process.env.WHATSAPP_AVISO_EXPIRACION_TEMPLATE;
  const templateLang = process.env.WHATSAPP_AVISO_EXPIRACION_TEMPLATE_LANG || "es";

  if (!token || !phoneNumberId || !template) {
    console.log(
      `[Enganche] Aviso de expiración (WhatsApp no configurado) para ${celular}: "${sistemaOProyecto}" lleva ${diasInactiva} días sin postulantes nuevos.`
    );
    return;
  }

  const destino = celular.replace("+", "");

  try {
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
            {
              type: "body",
              parameters: [
                { type: "text", text: sistemaOProyecto },
                { type: "text", text: String(diasInactiva) },
              ],
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error(`[Enganche] Falló el aviso de expiración por WhatsApp (${res.status}): ${detalle}`);
    }
  } catch (err) {
    // Un aviso fallido no debe interrumpir el resto del lote del cron.
    console.error("[Enganche] Error de red enviando aviso de expiración:", err);
  }
}
