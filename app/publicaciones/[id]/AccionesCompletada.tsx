"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatCOP } from "@/lib/format";

type Comision = { valor_comision: number; estado: string } | null;

type Garantia = {
  id: string;
  descripcion: string;
  estado: "abierto" | "atendido" | "no_atendido";
  fecha_reporte: string;
};

const ESTADO_COMISION: Record<string, string> = {
  pendiente: "Pendiente de pago",
  marcada_pagada: "Marcada como pagada — a la espera de confirmación",
  confirmada: "Confirmada",
};

const ESTADO_GARANTIA: Record<string, { texto: string; color: string }> = {
  abierto: { texto: "Abierto", color: "#facc15" },
  atendido: { texto: "Atendido", color: "#4ade80" },
  no_atendido: { texto: "No atendido", color: "#f87171" },
};

export default function AccionesCompletada({
  publicacionId,
  soyAutor,
  soyGanador,
  comisionInicial,
  yaCalifique,
  garantiasIniciales,
}: {
  publicacionId: string;
  soyAutor: boolean;
  soyGanador: boolean;
  comisionInicial: Comision;
  yaCalifique: boolean;
  garantiasIniciales: Garantia[];
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [estrellas, setEstrellas] = useState(5);
  const [cumplioTiempo, setCumplioTiempo] = useState(true);
  const [calidadEsperada, setCalidadEsperada] = useState(true);

  const [mostrarFormGarantia, setMostrarFormGarantia] = useState(false);
  const [descripcionGarantia, setDescripcionGarantia] = useState("");

  async function marcarComisionPagada() {
    setError(null);
    setCargando("comision");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/comision`, { method: "PATCH" });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo marcar la comisión como pagada.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function enviarCalificacion(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando("calificar");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/calificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estrellas, cumplioTiempo, calidadEsperada }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar la calificación.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function reportarGarantia(e: FormEvent) {
    e.preventDefault();
    if (!descripcionGarantia.trim()) return;
    setError(null);
    setCargando("garantia");
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/garantia`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descripcion: descripcionGarantia.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar el reporte.");
        return;
      }
      setDescripcionGarantia("");
      setMostrarFormGarantia(false);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(null);
    }
  }

  async function resolverGarantia(garantiaId: string, estado: "atendido" | "no_atendido") {
    setError(null);
    setCargando(garantiaId);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/garantia`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ garantiaId, estado }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo actualizar el reporte.");
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
    <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <p style={{ color: "#f87171", fontSize: 13, margin: 0 }}>{error}</p>}

      {comisionInicial && (
        <div style={caja}>
          <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Comisión de la plataforma</p>
          <p style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700 }}>
            {comisionInicial.valor_comision === 0 ? "Gratis (ciudad en arranque)" : formatCOP(comisionInicial.valor_comision)}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
            {ESTADO_COMISION[comisionInicial.estado] ?? comisionInicial.estado}
          </p>
          {soyGanador && comisionInicial.estado === "pendiente" && comisionInicial.valor_comision > 0 && (
            <button onClick={marcarComisionPagada} disabled={cargando === "comision"} style={{ ...botonChico, marginTop: 10, width: "100%" }}>
              {cargando === "comision" ? "…" : "Marcar comisión como pagada"}
            </button>
          )}
        </div>
      )}

      {!yaCalifique && (
        <form onSubmit={enviarCalificacion} style={caja}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Califica este trabajo</p>
          <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: n <= estrellas ? "#facc15" : "#334155" }}
              >
                ★
              </button>
            ))}
          </div>
          <label style={etiquetaCheck}>
            <input type="checkbox" checked={cumplioTiempo} onChange={(e) => setCumplioTiempo(e.target.checked)} />
            Cumplió el tiempo acordado
          </label>
          <label style={etiquetaCheck}>
            <input type="checkbox" checked={calidadEsperada} onChange={(e) => setCalidadEsperada(e.target.checked)} />
            La calidad fue la esperada
          </label>
          <button type="submit" disabled={cargando === "calificar"} style={{ ...botonChico, marginTop: 10, width: "100%" }}>
            {cargando === "calificar" ? "Enviando…" : "Enviar calificación"}
          </button>
        </form>
      )}

      <div style={caja}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Garantía (30 días desde el cierre)</p>

        {garantiasIniciales.length === 0 && (
          <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>Sin reportes de garantía.</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {garantiasIniciales.map((g) => {
            const estado = ESTADO_GARANTIA[g.estado];
            return (
              <div key={g.id} style={{ border: "1px solid #334155", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</span>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 13 }}>{g.descripcion}</p>
                {soyAutor && g.estado === "abierto" && (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    <button onClick={() => resolverGarantia(g.id, "atendido")} disabled={cargando === g.id} style={botonChico}>
                      Marcar atendida
                    </button>
                    <button onClick={() => resolverGarantia(g.id, "no_atendido")} disabled={cargando === g.id} style={botonChico}>
                      Marcar no atendida
                    </button>
                  </div>
                )}
                {soyGanador && g.estado === "abierto" && (
                  <p style={{ margin: "6px 0 0", fontSize: 12, color: "#94a3b8" }}>
                    Coordina la solución directamente por el chat.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {soyAutor && !mostrarFormGarantia && (
          <button onClick={() => setMostrarFormGarantia(true)} style={{ ...botonChico, marginTop: 10, width: "100%" }}>
            Reportar un problema
          </button>
        )}

        {soyAutor && mostrarFormGarantia && (
          <form onSubmit={reportarGarantia} style={{ marginTop: 10 }}>
            <textarea
              value={descripcionGarantia}
              onChange={(e) => setDescripcionGarantia(e.target.value)}
              placeholder="Describe el problema…"
              style={textareaStyle}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button type="submit" disabled={cargando === "garantia" || !descripcionGarantia.trim()} style={{ ...botonChico, flex: 1 }}>
                {cargando === "garantia" ? "Enviando…" : "Enviar reporte"}
              </button>
              <button type="button" onClick={() => setMostrarFormGarantia(false)} style={botonChico}>
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const caja: CSSProperties = {
  padding: "14px 16px",
  borderRadius: 10,
  border: "1px solid #334155",
  background: "#1e293b",
};

const etiquetaCheck: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 13,
  marginTop: 8,
};

const botonChico: CSSProperties = {
  padding: "6px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "transparent",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 12,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 70,
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#111820",
  color: "#eef2f5",
  fontSize: 13,
  resize: "vertical",
};
