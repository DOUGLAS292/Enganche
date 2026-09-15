// Avisos automáticos por WhatsApp — mismo patrón que el OTP de
// lib/auth/whatsapp.ts, pero con plantillas distintas: estas son
// categoría "Utility" en Meta Business Manager, no "Authentication" (esa
// sigue reservada solo para el código de acceso). Mientras una plantilla
// no exista o no esté aprobada, el aviso se registra en la consola del
// servidor — nunca debe tumbar el cron por esto, por eso no relanza el
// error si falla el envío real.
const GRAPH_VERSION = "v21.0";

async function enviarPlantillaUtilidad(
  celular: string,
  template: string | undefined,
  templateLang: string,
  parametrosTexto: string[],
  registroDesarrollo: string
): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !template) {
    console.log(`[Enganche] ${registroDesarrollo}`);
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
              parameters: parametrosTexto.map((text) => ({ type: "text", text })),
            },
          ],
        },
      }),
    });

    if (!res.ok) {
      const detalle = await res.text();
      console.error(`[Enganche] Falló el envío por WhatsApp (${res.status}): ${detalle}`);
    }
  } catch (err) {
    // Un aviso fallido no debe interrumpir el resto del lote del cron.
    console.error("[Enganche] Error de red enviando aviso por WhatsApp:", err);
  }
}

export async function enviarAvisoExpiracion(
  celular: string,
  sistemaOProyecto: string,
  diasInactiva: number
): Promise<void> {
  await enviarPlantillaUtilidad(
    celular,
    process.env.WHATSAPP_AVISO_EXPIRACION_TEMPLATE,
    process.env.WHATSAPP_AVISO_EXPIRACION_TEMPLATE_LANG || "es",
    [sistemaOProyecto, String(diasInactiva)],
    `Aviso de expiración (WhatsApp no configurado) para ${celular}: "${sistemaOProyecto}" lleva ${diasInactiva} días sin postulantes nuevos.`
  );
}

export async function enviarAvisoPostulantesPendientes(
  celular: string,
  sistemaOProyecto: string,
  diasEsperando: number,
  postulantesPendientes: number
): Promise<void> {
  await enviarPlantillaUtilidad(
    celular,
    process.env.WHATSAPP_AVISO_POSTULANTES_TEMPLATE,
    process.env.WHATSAPP_AVISO_POSTULANTES_TEMPLATE_LANG || "es",
    [sistemaOProyecto, String(diasEsperando), String(postulantesPendientes)],
    `Aviso de postulantes esperando (WhatsApp no configurado) para ${celular}: "${sistemaOProyecto}" tiene ${postulantesPendientes} postulante(s) hace ${diasEsperando} días sin que elijas a nadie.`
  );
}

export async function enviarAvisoComisionPendiente(
  celular: string,
  sistemaOProyecto: string,
  valorComision: string
): Promise<void> {
  await enviarPlantillaUtilidad(
    celular,
    process.env.WHATSAPP_AVISO_COMISION_PENDIENTE_TEMPLATE,
    process.env.WHATSAPP_AVISO_COMISION_PENDIENTE_TEMPLATE_LANG || "es",
    [sistemaOProyecto, valorComision],
    `Aviso de comisión pendiente (WhatsApp no configurado) para ${celular}: debe ${valorComision} por "${sistemaOProyecto}".`
  );
}

export async function enviarAvisoComisionRechazada(
  celular: string,
  sistemaOProyecto: string,
  valorComision: string
): Promise<void> {
  await enviarPlantillaUtilidad(
    celular,
    process.env.WHATSAPP_AVISO_COMISION_RECHAZADA_TEMPLATE,
    process.env.WHATSAPP_AVISO_COMISION_RECHAZADA_TEMPLATE_LANG || "es",
    [sistemaOProyecto, valorComision],
    `Aviso de comisión rechazada (WhatsApp no configurado) para ${celular}: el pago de ${valorComision} por "${sistemaOProyecto}" no fue confirmado.`
  );
}
