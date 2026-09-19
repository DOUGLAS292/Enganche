"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCOP } from "@/lib/format";

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
  urgente = null,
  valorUrgenteActual,
}: {
  publicacionId: string;
  estadoPublicacion: string;
  postulantesIniciales: Postulante[];
  mensajesNuevos?: number;
  urgente?: { estado: "pendiente" | "confirmada" | "rechazada"; valor: number; urlPago: string | null } | null;
  valorUrgenteActual: number;
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

  async function marcarUrgente() {
    setError(null);
    setCargando("urgente");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/urgente`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo solicitar urgente.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function renovar() {
    setError(null);
    setCargando("renovar");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/renovar`, { method: "POST" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo renovar.");
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
      {estadoPublicacion === "expirada" && (
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--color-mist)" }}>
          Esta oferta expiró por 15 días sin postulantes nuevos y ya no aparece en el feed. Renuévala si todavía
          necesitas el trabajo, o déjala cerrada.
        </p>
      )}

      <h2 style={{ fontSize: 16, margin: 0 }}>
        Postulantes{postulantesIniciales.length > 0 ? ` (${postulantesIniciales.length})` : ""}
      </h2>

      {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}

      {postulantesIniciales.length === 0 && (
        <p style={{ color: "var(--color-mist)", fontSize: 13 }}>Nadie se ha postulado todavía.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {postulantesIniciales.map((p) => (
          <div key={p.postulante_id} className="panel" style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div>
              <Link href={`/perfil/${p.postulante_id}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--color-texto)", textDecoration: "none" }}>
                {p.nombre_razon_social}
                {p.verificado ? " ✓" : ""}
              </Link>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-mist)" }}>
                {p.ciudad ?? "Sin ciudad"} · {p.trabajos_completados} trabajos
                {p.rating_promedio ? ` · ★ ${p.rating_promedio}` : ""}
              </p>
            </div>
            {p.estado === "pendiente" && estadoPublicacion === "abierta" && (
              <button onClick={() => elegir(p.postulante_id)} disabled={cargando === p.postulante_id} className="boton-linea">
                {cargando === p.postulante_id ? "…" : "Elegir"}
              </button>
            )}
            {p.estado === "elegida" && <span style={{ fontSize: 12, color: "#15803d" }}>Elegido</span>}
            {p.estado === "rechazada" && <span style={{ fontSize: 12, color: "var(--color-mist)" }}>No elegido</span>}
          </div>
        ))}
      </div>

      {estadoPublicacion === "abierta" && (
        <>
          {!urgente && (
            <button
              onClick={marcarUrgente}
              disabled={cargando === "urgente"}
              className="boton-linea"
              style={{ marginTop: 14, width: "100%", borderColor: "#dc2626", color: "#dc2626" }}
            >
              {cargando === "urgente" ? "…" : `🚨 Marcar como urgente (${formatCOP(valorUrgenteActual)})`}
            </button>
          )}
          {urgente?.estado === "pendiente" && (
            <div style={{ marginTop: 14 }}>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-mist)" }}>
                🚨 Urgente solicitado ({formatCOP(urgente.valor)}) — esperando confirmación de pago.
              </p>
              {urgente.urlPago && (
                <a href={urgente.urlPago} target="_blank" rel="noopener noreferrer" className="boton-primario" style={{ display: "block", marginTop: 8, textAlign: "center" }}>
                  Pagar con Wompi
                </a>
              )}
            </div>
          )}
          {urgente?.estado === "confirmada" && (
            <p style={{ marginTop: 14, fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
              🚨 Urgente activo — se avisó a los postulantes cercanos.
            </p>
          )}
          {urgente?.estado === "rechazada" && (
            <p style={{ marginTop: 14, fontSize: 12, color: "var(--color-mist)" }}>
              La solicitud de urgente fue rechazada (no se confirmó el pago).
            </p>
          )}
          <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
            <button onClick={renovar} disabled={cargando === "renovar"} className="boton-linea" style={{ flex: 1 }}>
              {cargando === "renovar" ? "…" : "Renovar (reinicia los 15 días)"}
            </button>
            <button onClick={cancelar} disabled={cargando === "cancelar"} className="boton-linea" style={{ flex: 1 }}>
              Cancelar publicación
            </button>
          </div>
        </>
      )}

      {estadoPublicacion === "expirada" && (
        <button onClick={renovar} disabled={cargando === "renovar"} className="boton-primario" style={{ marginTop: 14 }}>
          {cargando === "renovar" ? "…" : "Renovar publicación"}
        </button>
      )}

      {estadoPublicacion === "en_proceso" && (
        <>
          <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
            <Link
              href={`/publicaciones/${publicacionId}/chat`}
              className="boton-linea"
              style={{ flex: 1, ...(mensajesNuevos > 0 ? { background: "rgba(255,138,43,.12)", borderColor: "var(--color-acento-claro)", color: "var(--color-acento-claro)", fontWeight: 700 } : {}) }}
            >
              {mensajesNuevos > 0 ? `🔔 Ir al chat (${mensajesNuevos})` : "Ir al chat"}
            </Link>
            <button onClick={reabrir} disabled={cargando === "reabrir"} className="boton-linea" style={{ flex: 1 }}>
              {cargando === "reabrir" ? "…" : "Reabrir publicación"}
            </button>
          </div>
          <button
            onClick={completar}
            disabled={cargando === "completar"}
            className="boton-linea"
            style={{ marginTop: 8, width: "100%", borderColor: "#15803d", color: "#15803d" }}
          >
            {cargando === "completar" ? "…" : "Marcar trabajo completado"}
          </button>
        </>
      )}
    </div>
  );
}
