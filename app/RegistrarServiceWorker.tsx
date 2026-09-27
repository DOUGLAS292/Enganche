"use client";

import { useEffect } from "react";

// Registra el Service Worker (ver public/sw.js) — habilita el soporte
// offline básico y es un requisito de Google para aceptar la PWA como
// app real al publicarla en Play Store.
export default function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.error("[Enganche] No se pudo registrar el service worker:", err);
    });
  }, []);

  return null;
}
