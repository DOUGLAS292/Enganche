"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";

const TIPOS_USUARIO = [
  { valor: "independiente", etiqueta: "Independiente" },
  { valor: "taller", etiqueta: "Taller" },
  { valor: "empresa", etiqueta: "Empresa" },
] as const;

const OFRECE = [
  { valor: "instalacion", etiqueta: "Instalación" },
  { valor: "produccion", etiqueta: "Producción" },
  { valor: "ambos", etiqueta: "Ambos" },
] as const;

type PerfilEditable = {
  nombreRazonSocial: string;
  ciudad: string;
  tipoUsuario: string;
  ofrece: string;
  sistemaLinea: string;
  anosExperiencia: string;
};

export default function EditarPerfilBoton({ perfilInicial }: { perfilInicial: PerfilEditable }) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(perfilInicial);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo guardar el perfil.");
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
        Editar perfil
      </button>
    );
  }

  return (
    <div className="panel" style={{ marginTop: 12, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
      <Campo etiqueta="Nombre o razón social">
        <input
          value={datos.nombreRazonSocial}
          onChange={(e) => setDatos({ ...datos, nombreRazonSocial: e.target.value })}
          className="input-vidrio"
          maxLength={120}
        />
      </Campo>

      <Campo etiqueta="Ciudad">
        <input
          value={datos.ciudad}
          onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })}
          className="input-vidrio"
          placeholder="Ej: Cali"
        />
      </Campo>

      <Campo etiqueta="Tipo de usuario">
        <select
          value={datos.tipoUsuario}
          onChange={(e) => setDatos({ ...datos, tipoUsuario: e.target.value })}
          className="input-vidrio"
        >
          {TIPOS_USUARIO.map((t) => (
            <option key={t.valor} value={t.valor}>
              {t.etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Ofrece">
        <select value={datos.ofrece} onChange={(e) => setDatos({ ...datos, ofrece: e.target.value })} className="input-vidrio">
          {OFRECE.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </Campo>

      <Campo etiqueta="Línea o sistema que maneja (opcional)">
        <input
          value={datos.sistemaLinea}
          onChange={(e) => setDatos({ ...datos, sistemaLinea: e.target.value })}
          className="input-vidrio"
          placeholder="Ej: Serie 50"
        />
      </Campo>

      <Campo etiqueta="Años de experiencia (opcional)">
        <input
          type="number"
          min={0}
          max={80}
          value={datos.anosExperiencia}
          onChange={(e) => setDatos({ ...datos, anosExperiencia: e.target.value })}
          className="input-vidrio"
        />
      </Campo>

      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: 0 }}>{error}</p>}

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          onClick={guardar}
          disabled={cargando || datos.nombreRazonSocial.trim().length < 2 || !datos.ciudad.trim()}
          className="boton-primario"
          style={{ flex: 1 }}
        >
          {cargando ? "Guardando…" : "Guardar cambios"}
        </button>
        <button
          onClick={() => {
            setDatos(perfilInicial);
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

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  const estiloEtiqueta: CSSProperties = { fontSize: 12, color: "var(--color-mist)", marginBottom: 4, display: "block" };
  return (
    <label style={{ display: "block" }}>
      <span style={estiloEtiqueta}>{etiqueta}</span>
      {children}
    </label>
  );
}
