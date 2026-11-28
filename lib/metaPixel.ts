// Eventos del píxel de Meta (ver app/MetaPixel.tsx). Si el píxel no está
// configurado (sin NEXT_PUBLIC_META_PIXEL_ID), estas llamadas no hacen nada.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

// Nunca enviar aquí datos personales (celular, nombre, documento): Meta solo
// necesita saber que el evento ocurrió para optimizar las campañas.
export function registrarEventoMeta(evento: string, datos?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  window.fbq?.("track", evento, datos);
}
