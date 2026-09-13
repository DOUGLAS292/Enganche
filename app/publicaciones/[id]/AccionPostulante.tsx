"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

export default function AccionPostulante({ publicacionId }: { publicacionId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function postularme() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/postular`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar la postulación.");
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
    <div style={{ marginTop: 20 }}>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <button onClick={postularme} disabled={cargando} style={botonPrimario}>
        {cargando ? "Enviando…" : "Postularme a esta oferta"}
      </button>
    </div>
  );
}

const botonPrimario: CSSProperties = {
  width: "100%",
  padding: "12px 18px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 15,
};
