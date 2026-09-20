"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OcultarBoton({ publicacionId }: { publicacionId: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);

  async function ocultar() {
    if (!confirm("¿Quitar esta oferta cancelada de tu lista? No se borra el historial, solo deja de aparecer aquí.")) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/ocultar`, { method: "POST" });
      const data = await res.json();
      if (data.ok) router.refresh();
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      onClick={ocultar}
      disabled={cargando}
      title="Quitar de mi lista"
      style={{
        position: "absolute",
        top: 10,
        right: 10,
        background: "var(--color-superficie)",
        border: "1px solid var(--color-borde)",
        borderRadius: 8,
        width: 26,
        height: 26,
        fontSize: 13,
        lineHeight: 1,
        cursor: "pointer",
        color: "var(--color-mist)",
      }}
    >
      {cargando ? "…" : "✕"}
    </button>
  );
}
