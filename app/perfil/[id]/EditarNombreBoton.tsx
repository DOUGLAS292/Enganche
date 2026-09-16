"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function EditarNombreBoton({ nombreActual }: { nombreActual: string }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(nombreActual);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/perfil/nombre", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar el nombre.");
        return;
      }
      setEditando(false);
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(false);
    }
  }

  if (!editando) {
    return (
      <button
        onClick={() => setEditando(true)}
        className="boton-linea"
        style={{ marginTop: 8, fontSize: 12, padding: "4px 10px" }}
      >
        Editar nombre
      </button>
    );
  }

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6, maxWidth: 320 }}>
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        className="input-vidrio"
        style={{ fontSize: 14 }}
        maxLength={120}
        autoFocus
      />
      {error && <p style={{ color: "#f87171", fontSize: 12, margin: 0 }}>{error}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={guardar} disabled={cargando || nombre.trim().length < 2} className="boton-linea" style={{ flex: 1 }}>
          {cargando ? "Guardando…" : "Guardar"}
        </button>
        <button
          onClick={() => {
            setNombre(nombreActual);
            setError(null);
            setEditando(false);
          }}
          disabled={cargando}
          className="boton-linea"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
