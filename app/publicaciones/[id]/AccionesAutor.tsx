"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Postulante = {
  postulante_id: string;
  estado: "pendiente" | "elegida" | "rechazada";
  nombre_razon_social: string;
  ciudad: string | null;
  rating_promedio: number | null;
  trabajos_completados: number;
  verificado: boolean;
};

export default function AccionesAutor({
  publicacionId,
  estadoPublicacion,
  postulantesIniciales,
  mensajesNuevos = 0,
}: {
  publicacionId: string;
  estadoPublicacion: string;
  postulantesIniciales: Postulante[];
  mensajesNuevos?: number;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function elegir(postulanteId: string) {
    setError(null);
    setCargando(postulanteId);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/elegir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postulanteId }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo elegir al postulante.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function reabrir() {
    setError(null);
    setCargando("reabrir");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/reabrir`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo reabrir.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function completar() {
    if (!confirm("¿Marcar este trabajo como completado? Se generará la comisión de la plataforma.")) return;
    setError(null);
    setCargando("completar");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/completar`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo marcar como completado.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function cancelar() {
    if (!confirm("¿Cancelar esta oferta? Ya no aparecerá en el feed.")) return;
    setError(null);
    setCargando("cancelar");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/cancelar`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo cancelar.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div style={{ marginTop: 20 }}>
      <h2 style={{ fontSize: 16, margin: 0 }}>
        Postulantes{postulantesIniciales.length > 0 ? ` (${postulantesIniciales.length})` : ""}
      </h2>

      {error && <p style={{ color: "#f87171", fontSize: 13 }}>{error}</p>}

      {postulantesIniciales.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Nadie se ha postulado todavía.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {postulantesIniciales.map((p) => (
          <div key={p.postulante_id} style={filaPostulante}>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
                {p.nombre_razon_social}
                {p.verificado ? " ✓" : ""}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                {p.ciudad ?? "Sin ciudad"} · {p.trabajos_completados} trabajos
                {p.rating_promedio ? ` · ★ ${p.rating_promedio}` : ""}
              </p>
            </div>
            {p.estado === "pendiente" && estadoPublicacion === "abierta" && (
              <button onClick={() => elegir(p.postulante_id)} disabled={cargando === p.postulante_id} style={botonChico}>
                {cargando === p.postulante_id ? "…" : "Elegir"}
              </button>
            )}
            {p.estado === "elegida" && <span style={{ fontSize: 12, color: "#4ade80" }}>Elegido</span>}
            {p.estado === "rechazada" && <span style={{ fontSize: 12, color: "#94a3b8" }}>No elegido</span>}
          </div>
        ))}
      </div>

      {estadoPublicacion === "abierta" && (
        <button onClick={cancelar} disabled={cargando === "cancelar"} style={{ ...botonChico, marginTop: 14, width: "100%" }}>
          Cancelar publicación
        </button>
      )}

      {estadoPublicacion === "en_proceso" && (
        <>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Link
              href={`/publicaciones/${publicacionId}/chat`}
              style={{ ...botonPrimarioLink, ...(mensajesNuevos > 0 ? { background: "#854d0e", borderColor: "var(--color-acento-claro)" } : {}) }}
            >
              {mensajesNuevos > 0 ? `🔔 Ir al chat (${mensajesNuevos})` : "Ir al chat"}
            </Link>
            <button onClick={reabrir} disabled={cargando === "reabrir"} style={{ ...botonChico, flex: 1 }}>
              {cargando === "reabrir" ? "…" : "Reabrir publicación"}
            </button>
          </div>
          <button
            onClick={completar}
            disabled={cargando === "completar"}
            style={{ ...botonChico, marginTop: 8, width: "100%", borderColor: "#4ade80", color: "#4ade80" }}
          >
            {cargando === "completar" ? "…" : "Marcar trabajo completado"}
          </button>
        </>
      )}
    </div>
  );
}

const filaPostulante: CSSProperties = {
  border: "1px solid var(--color-borde)",
  borderRadius: 8,
  padding: "10px 12px",
  background: "var(--color-superficie)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
};

const botonChico: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-borde)",
  background: "transparent",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 12,
};

const botonPrimarioLink: CSSProperties = {
  flex: 1,
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid var(--color-borde)",
  background: "#1e3a5f",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 13,
  textAlign: "center",
  textDecoration: "none",
};
