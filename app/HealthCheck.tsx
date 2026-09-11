"use client";

import { useState, type CSSProperties } from "react";

type HealthState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ok"; db: { postgis_version: string; now: string } }
  | { status: "error"; message: string };

export default function HealthCheck() {
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
    <div style={{ marginTop: 24 }}>
      <button onClick={verificar} style={buttonStyle}>
        Verificar conexión a PostGIS
      </button>
      {health.status === "loading" && <p>Consultando…</p>}
      {health.status === "ok" && (
        <p style={{ color: "#4ade80" }}>✓ Conectado — {health.db.postgis_version}</p>
      )}
      {health.status === "error" && <p style={{ color: "#f87171" }}>✗ {health.message}</p>}
    </div>
  );
}

const buttonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 14,
};
