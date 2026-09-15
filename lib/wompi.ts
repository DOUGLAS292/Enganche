import { createHash } from "crypto";

// Sin pasarela de pago propia: se usa la API de "Links de pago" de Wompi
// (POST /v1/payment_links) — se genera un link de un solo uso por cada
// comisión o impulso urgente, y el webhook de Wompi confirma el pago solo,
// sin que un admin tenga que revisar nada manualmente. El ambiente
// (sandbox o producción) se infiere del prefijo de la llave privada, para
// no tener que mantener una variable de entorno aparte que se pueda
// desincronizar.
function baseUrl(llave: string): string {
  return llave.startsWith("prv_prod_") ? "https://production.wompi.co/v1" : "https://sandbox.wompi.co/v1";
}

export async function crearLinkDePago(params: { nombre: string; montoEnCentavos: number }): Promise<string | null> {
  const llave = process.env.WOMPI_LLAVE_PRIVADA;
  if (!llave) {
    console.log(`[Enganche] Wompi no configurado — se sigue con el flujo manual para "${params.nombre}".`);
    return null;
  }

  try {
    const res = await fetch(`${baseUrl(llave)}/payment_links`, {
      method: "POST",
      headers: { Authorization: `Bearer ${llave}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: params.nombre,
        description: params.nombre,
        single_use: true,
        collect_shipping: false,
        currency: "COP",
        amount_in_cents: params.montoEnCentavos,
      }),
    });
    if (!res.ok) {
      console.error(`[Enganche] Wompi rechazó la creación del link (${res.status}): ${await res.text()}`);
      return null;
    }
    const data = await res.json();
    return data?.data?.id ?? null;
  } catch (err) {
    console.error("[Enganche] Error de red creando link de pago en Wompi:", err);
    return null;
  }
}

export function urlLinkDePago(id: string): string {
  return `https://checkout.wompi.co/l/${id}`;
}

function obtenerValorPorRuta(objeto: unknown, ruta: string): unknown {
  return ruta.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, objeto);
}

// Wompi firma cada evento con un checksum SHA256: se concatenan los
// valores de las propiedades que indica el propio evento, luego el
// timestamp, luego el secreto de eventos — y se compara contra el
// checksum recibido. Rechazar si no coincide evita que cualquiera con la
// URL del webhook pueda confirmar pagos falsos.
export function verificarFirmaWebhook(evento: {
  data?: unknown;
  timestamp?: number | string;
  signature?: { properties?: string[]; checksum?: string };
}): boolean {
  const secreto = process.env.WOMPI_SECRETO_EVENTOS;
  const propiedades = evento?.signature?.properties;
  const checksumRecibido = evento?.signature?.checksum;
  if (!secreto || !propiedades?.length || !checksumRecibido) return false;

  const concatenado =
    propiedades.map((ruta) => String(obtenerValorPorRuta(evento.data, ruta) ?? "")).join("") +
    String(evento.timestamp ?? "") +
    secreto;

  const checksumCalculado = createHash("sha256").update(concatenado).digest("hex").toUpperCase();
  return checksumCalculado === checksumRecibido.toUpperCase();
}
