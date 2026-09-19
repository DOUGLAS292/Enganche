"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccionesAdmin({ comisionId }: { comisionId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accionar(accion: "confirmar" | "rechazar") {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/comisiones/${comisionId}/${accion}`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo completar la acción.");
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
      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 6px" }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => accionar("confirmar")}
          disabled={cargando}
          className="boton-linea"
          style={{ flex: 1, borderColor: "#15803d", color: "#15803d" }}
        >
          {cargando ? "…" : "Confirmar pago recibido"}
        </button>
        <button
          onClick={() => accionar("rechazar")}
          disabled={cargando}
          className="boton-linea"
          style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}
        >
          {cargando ? "…" : "Rechazar pago"}
        </button>
      </div>
    </div>
  );
}
