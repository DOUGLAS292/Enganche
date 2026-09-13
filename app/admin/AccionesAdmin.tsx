"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccionesAdmin({ comisionId }: { comisionId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/comisiones/${comisionId}/confirmar`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo confirmar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {error && <p style={{ color: "#f87171", fontSize: 12, margin: "0 0 6px" }}>{error}</p>}
      <button
        onClick={confirmar}
        disabled={cargando}
        style={{
          width: "100%",
          padding: "6px 12px",
          borderRadius: 8,
          border: "1px solid #4ade80",
          background: "transparent",
          color: "#4ade80",
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        {cargando ? "…" : "Confirmar pago recibido"}
      </button>
    </div>
  );
}
