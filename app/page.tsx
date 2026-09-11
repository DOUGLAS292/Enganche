"use client";

import { useState } from "react";

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; db: { postgis_version: string; now: string } }
  | { status: "error"; message: string };

export default function Home() {
  const [health, setHealth] = useState<HealthState>({ status: "idle" });

  async function verificar() {
    setHealth({ status: "loading" });
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.ok) {
        setHealth({ status: "ok", db: data.db });
      } else {
        setHealth({ status: "error", message: data.error ?? "error desconocido" });
      }
    } catch (err) {
      setHealth({
        status: "error",
        message: err instanceof Error ? err.message : "error desconocido",
      });
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Enganche</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Marketplace de demanda para producción e instalación de sistemas de
        aluminio y vidrio.
      </p>

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Fase 0 — Esqueleto de datos</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>
          ✅ 8 tablas: usuarios, publicaciones, postulaciones, mensajes,
          calificaciones, comisiones, garantias, ciudades_piloto
        </li>
        <li>✅ Extensión PostGIS + índices GIST para emparejamiento geográfico</li>
        <li>✅ Triggers de reputación (rating_promedio, trabajos_completados)</li>
        <li>
          ✅ Runner de migraciones (<code>npm run migrate</code>)
        </li>
        <li>⬜ Fase 1 — Auth por OTP de WhatsApp</li>
        <li>⬜ Fase 2 — Publicar + feed por cercanía</li>
        <li>⬜ Fase 3 — Postulación + chat</li>
        <li>⬜ Fase 4 — Cierre + calificación + comisión</li>
        <li>⬜ Fase 5 — Panel de comisiones (admin)</li>
      </ul>

      <button
        onClick={verificar}
        style={{
          marginTop: 24,
          padding: "10px 18px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#1e293b",
          color: "#eef2f5",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Verificar conexión a PostGIS
      </button>

      {health.status === "loading" && <p>Consultando…</p>}
      {health.status === "ok" && (
        <p style={{ color: "#4ade80" }}>✓ Conectado — {health.db.postgis_version}</p>
      )}
      {health.status === "error" && (
        <p style={{ color: "#f87171" }}>✗ {health.message}</p>
      )}
    </main>
  );
}
