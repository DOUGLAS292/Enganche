"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AccionesOferta({
  publicacionId,
  autorId,
  puedeCancelar,
}: {
  publicacionId: string;
  autorId: string;
  puedeCancelar: boolean;
}) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function llamar(url: string, body?: unknown) {
    setError(null);
    setOk(null);
    setCargando(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo completar la acción.");
        return false;
      }
      return true;
    } catch {
      setError("Error de conexión.");
      return false;
    } finally {
      setCargando(false);
    }
  }

  async function cancelar() {
    if (!window.confirm("¿Cancelar esta oferta? Dejará de verse en el mercado.")) return;
    if (await llamar(`/api/admin/publicaciones/${publicacionId}/cancelar`)) router.refresh();
  }

  async function enviar() {
    if (await llamar("/api/admin/avisos", { usuarioId: autorId, mensaje })) {
      setOk("Aviso enviado al autor.");
      setMensaje("");
      setEscribiendo(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 6px" }}>{error}</p>}
      {ok && <p style={{ color: "#15803d", fontSize: 12, margin: "0 0 6px" }}>{ok}</p>}
      {escribiendo && (
        <div style={{ marginBottom: 8 }}>
          <textarea
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            maxLength={600}
            rows={4}
            className="input-vidrio"
            placeholder="Mensaje para el autor (le llega como aviso dentro de Enganche)"
            style={{ width: "100%" }}
          />
          <button onClick={enviar} disabled={cargando || mensaje.trim().length < 5} className="boton-linea" style={{ marginTop: 6, width: "100%" }}>
            {cargando ? "…" : "Enviar"}
          </button>
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => setEscribiendo((v) => !v)} disabled={cargando} className="boton-linea" style={{ flex: 1 }}>
          Enviar aviso al autor
        </button>
        {puedeCancelar && (
          <button onClick={cancelar} disabled={cargando} className="boton-linea" style={{ flex: 1, borderColor: "#dc2626", color: "#dc2626" }}>
            Cancelar oferta
          </button>
        )}
      </div>
    </div>
  );
}
