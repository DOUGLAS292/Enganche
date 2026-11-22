import { createECDH, createHmac } from "node:crypto";

// Claves VAPID (identifican a Enganche ante Google, Apple y Mozilla al enviar
// avisos). Se derivan de AUTH_SECRET con HMAC y una etiqueta propia, así no
// hace falta guardar otra clave secreta ni copiarla a ningún lado. Si algún
// día se cambia AUTH_SECRET, quienes activaron los avisos deben activarlos de
// nuevo (la app lo detecta y se los vuelve a pedir).
const ETIQUETA = "enganche-vapid-v1";

function base64url(buf: Buffer): string {
  return buf.toString("base64url");
}

export type ClavesVapid = { publica: string; privada: string };

let cache: ClavesVapid | null = null;

export function obtenerClavesVapid(): ClavesVapid {
  if (cache) return cache;
  const secreto = process.env.AUTH_SECRET;
  if (!secreto) throw new Error("Falta la variable de entorno AUTH_SECRET");

  for (let contador = 0; contador < 8; contador++) {
    const privada = createHmac("sha256", secreto).update(`${ETIQUETA}:${contador}`).digest();
    const ecdh = createECDH("prime256v1");
    try {
      ecdh.setPrivateKey(privada); // falla si el escalar queda fuera de la curva (casi imposible)
    } catch {
      continue;
    }
    cache = { publica: base64url(ecdh.getPublicKey()), privada: base64url(privada) };
    return cache;
  }
  throw new Error("No se pudieron derivar las claves VAPID");
}
