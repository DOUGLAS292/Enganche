"use client";

import { useCallback, useEffect, useState } from "react";

// Botón para activar los avisos en el celular (notificaciones push).
// - Android / computador: funciona desde el navegador.
// - iPhone: Apple solo permite avisos si la app está agregada a la pantalla de
//   inicio; si no lo está, se explica cómo.
// - Si ya están activados, solo se confirma y se vuelve a guardar el
//   dispositivo (por si el navegador cambió la suscripción).

type Estado = "cargando" | "no_soportado" | "ios_sin_instalar" | "bloqueado" | "inactivo" | "activo";

function claveABytes(base64url: string): Uint8Array {
  const relleno = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + relleno).replace(/-/g, "+").replace(/_/g, "/");
  const crudo = atob(base64);
  const salida = new Uint8Array(crudo.length);
  for (let i = 0; i < crudo.length; i++) salida[i] = crudo.charCodeAt(i);
  return salida;
}

async function guardar(sub: PushSubscription, prueba: boolean): Promise<boolean> {
  const res = await fetch("/api/push/suscribir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), prueba }),
  });
  return res.ok;
}

export default function ActivarAvisos() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  const revisar = useCallback(async () => {
    const ua = navigator.userAgent;
    const ios = /iPhone|iPad|iPod/i.test(ua);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setEstado(ios && !standalone ? "ios_sin_instalar" : "no_soportado");
      return;
    }
    if (Notification.permission === "denied") {
      setEstado("bloqueado");
      return;
    }
    try {
      const registro = await navigator.serviceWorker.ready;
      const sub = await registro.pushManager.getSubscription();
      if (sub && Notification.permission === "granted") {
        await guardar(sub, false).catch(() => false);
        setEstado("activo");
      } else {
        setEstado("inactivo");
      }
    } catch {
      setEstado("inactivo");
    }
  }, []);

  useEffect(() => {
    revisar();
  }, [revisar]);

  async function activar() {
    setTrabajando(true);
    setError("");
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") {
        setEstado(permiso === "denied" ? "bloqueado" : "inactivo");
        return;
      }
      const registro = await navigator.serviceWorker.ready;
      const clave = (await (await fetch("/api/push/clave")).json()).clave as string;

      // Si había una suscripción hecha con otra clave, se renueva.
      const anterior = await registro.pushManager.getSubscription();
      if (anterior) await anterior.unsubscribe().catch(() => false);

      const sub = await registro.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: claveABytes(clave),
      });
      if (!(await guardar(sub, true))) {
        setError("No pudimos guardar los avisos. Intenta de nuevo.");
        return;
      }
      setEstado("activo");
    } catch (err) {
      console.error("[Enganche] No se pudieron activar los avisos:", err);
      setError("No se pudieron activar los avisos en este navegador.");
    } finally {
      setTrabajando(false);
    }
  }

  async function desactivar() {
    setTrabajando(true);
    try {
      const registro = await navigator.serviceWorker.ready;
      const sub = await registro.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/suscribir", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        }).catch(() => null);
        await sub.unsubscribe().catch(() => false);
      }
      setEstado("inactivo");
    } finally {
      setTrabajando(false);
    }
  }

  if (estado === "cargando" || estado === "no_soportado") return null;

  const caja: React.CSSProperties = {
    padding: "12px 14px",
    borderRadius: 14,
    background: "rgba(255,255,255,0.7)",
    border: "1px solid rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 1.45,
  };

  if (estado === "ios_sin_instalar") {
    return (
      <div style={caja}>
        <strong>🔔 Avisos en tu iPhone</strong>
        <br />
        Para recibirlos, primero agrega Enganche a tu pantalla de inicio (Compartir → “Agregar a pantalla de inicio”), ábrela desde ahí y toca “Activar avisos”.
      </div>
    );
  }
  if (estado === "bloqueado") {
    return (
      <div style={caja}>
        <strong>🔕 Avisos bloqueados</strong>
        <br />
        Los bloqueaste en este navegador. Para recibirlos, permite las notificaciones de Enganche en los ajustes del navegador.
      </div>
    );
  }
  if (estado === "activo") {
    return (
      <div style={{ ...caja, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span>🔔 Avisos activados en este celular</span>
        <button
          onClick={desactivar}
          disabled={trabajando}
          style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer", fontSize: 13 }}
        >
          Desactivar
        </button>
      </div>
    );
  }
  return (
    <div style={caja}>
      <strong>🔔 No te pierdas nada</strong>
      <br />
      Activa los avisos y te notificamos de postulaciones, mensajes y ofertas urgentes cerca de ti.
      <button onClick={activar} disabled={trabajando} className="boton-primario" style={{ marginTop: 10, width: "100%" }}>
        {trabajando ? "Activando…" : "Activar avisos"}
      </button>
      {error && <p style={{ margin: "8px 0 0", color: "#b00020", fontSize: 13 }}>{error}</p>}
    </div>
  );
}
