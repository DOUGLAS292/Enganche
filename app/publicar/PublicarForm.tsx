"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PROYECTOS_SUGERIDOS } from "@/lib/constants/proyectos";

const TIPOS = [
  { valor: "instalacion", etiqueta: "Instalación" },
  { valor: "produccion", etiqueta: "Producción" },
] as const;

const NIVELES = [
  { valor: "tradicional", etiqueta: "Nivel 1 · Tradicional" },
  { valor: "superior", etiqueta: "Nivel 2 · Superior" },
  { valor: "especializada", etiqueta: "Nivel 3 · Especializada" },
] as const;

type NivelSistema = keyof typeof PROYECTOS_SUGERIDOS;
type EstadoUbicacion = "sin_pedir" | "pidiendo" | "lista" | "denegada";

export default function PublicarForm() {
  const router = useRouter();
  const [tipoTrabajo, setTipoTrabajo] = useState<string>("instalacion");
  const [nivelSistema, setNivelSistema] = useState<NivelSistema>("tradicional");
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [mtr2, setMtr2] = useState("");
  const [valorOfertado, setValorOfertado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>("sin_pedir");
  const [requiereSeguridad, setRequiereSeguridad] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  function pedirUbicacion() {
    if (!navigator.geolocation) {
      setEstadoUbicacion("denegada");
      return;
    }
    setEstadoUbicacion("pidiendo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setEstadoUbicacion("lista");
      },
      () => setEstadoUbicacion("denegada"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/publicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoTrabajo,
          nivelSistema,
          sistemaOProyecto: descripcion,
          cantidad,
          mtr2: mtr2 || undefined,
          valorOfertado: Number(valorOfertado),
          fechaInicio: fechaInicio || undefined,
          fechaFin: fechaFin || undefined,
          ciudad,
          lat: coords?.lat,
          lng: coords?.lng,
          requiereSeguridad,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo publicar.");
        return;
      }
      router.push(`/publicaciones/${data.id}`);
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 80px" }}>
      <Link href="/" style={{ color: "#60a5fa", fontSize: 13 }}>
        ← Inicio
      </Link>
      <h1 style={{ fontSize: 24, marginTop: 14 }}>Publicar una oferta</h1>
      <p style={{ color: "#94a3b8" }}>
        El valor lo defines tú. Los postulantes solo deciden si aceptan — no hay regateo.
      </p>

      <form onSubmit={enviar}>
        <Campo etiqueta="Tipo de trabajo">
          <Radios opciones={TIPOS} valor={tipoTrabajo} onChange={setTipoTrabajo} nombre="tipoTrabajo" columnas={2} />
        </Campo>

        <Campo etiqueta="Nivel del sistema">
          <Radios opciones={NIVELES} valor={nivelSistema} onChange={(v) => setNivelSistema(v as NivelSistema)} nombre="nivelSistema" columnas={1} />
        </Campo>

        <Campo etiqueta="Descripción">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            style={inputStyle}
            placeholder="Ej: Ventanas, puertas, divisiones de baño, gabinetes…"
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {PROYECTOS_SUGERIDOS[nivelSistema].map((s) => (
              <button type="button" key={s} onClick={() => setDescripcion(s)} style={chipStyle}>
                {s}
              </button>
            ))}
          </div>
        </Campo>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Campo etiqueta="Cantidad de productos">
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              required
              style={inputStyle}
              placeholder="Ej: 3"
            />
          </Campo>
          <Campo etiqueta="m² (opcional)">
            <input
              type="number"
              min={0}
              step="0.1"
              value={mtr2}
              onChange={(e) => setMtr2(e.target.value)}
              style={inputStyle}
              placeholder="Ej: 13,4"
            />
          </Campo>
        </div>

        <Campo etiqueta="Valor ofertado (COP)">
          <input
            type="number"
            min={0}
            step={1000}
            value={valorOfertado}
            onChange={(e) => setValorOfertado(e.target.value)}
            required
            style={inputStyle}
          />
        </Campo>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Campo etiqueta="Fecha de inicio (opcional)">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} style={inputStyle} />
          </Campo>
          <Campo etiqueta="Fecha de finalización (opcional)">
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} style={inputStyle} />
          </Campo>
        </div>

        <Campo etiqueta="Ciudad">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required style={inputStyle} placeholder="Ej: Cali" />
        </Campo>

        <Campo etiqueta="Ubicación exacta (opcional, ayuda a que te vean por cercanía)">
          <button type="button" onClick={pedirUbicacion} style={buttonStyleSecondary}>
            {estadoUbicacion === "lista"
              ? "✓ Ubicación capturada"
              : estadoUbicacion === "pidiendo"
                ? "Obteniendo ubicación…"
                : "Usar mi ubicación actual"}
          </button>
          {estadoUbicacion === "denegada" && (
            <p style={{ color: "#facc15", fontSize: 12, marginTop: 6 }}>
              No se pudo obtener tu ubicación. La oferta igual se publica, pero solo aparecerá al filtrar por ciudad, no por cercanía.
            </p>
          )}
        </Campo>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, fontSize: 14 }}>
          <input type="checkbox" checked={requiereSeguridad} onChange={(e) => setRequiereSeguridad(e.target.checked)} />
          Requiere seguridad / registro de acceso
        </label>

        {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={cargando} style={buttonStyle}>
          {cargando ? "Publicando…" : "Publicar oferta"}
        </button>
      </form>
    </main>
  );
}

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <label style={{ display: "block", marginBottom: 6, fontSize: 14, color: "#cbd5e1" }}>{etiqueta}</label>
      {children}
    </div>
  );
}

function Radios<T extends string>({
  opciones,
  valor,
  onChange,
  nombre,
  columnas,
}: {
  opciones: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onChange: (v: T) => void;
  nombre: string;
  columnas: number;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columnas}, 1fr)`, gap: 8 }}>
      {opciones.map((op) => (
        <label
          key={op.valor}
          style={{
            textAlign: "center",
            padding: "8px 6px",
            borderRadius: 8,
            border: `1px solid ${valor === op.valor ? "#60a5fa" : "#334155"}`,
            background: valor === op.valor ? "#1e3a5f" : "#1e293b",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          <input
            type="radio"
            name={nombre}
            value={op.valor}
            checked={valor === op.valor}
            onChange={() => onChange(op.valor)}
            style={{ display: "none" }}
          />
          {op.etiqueta}
        </label>
      ))}
    </div>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  fontSize: 15,
};

const chipStyle: CSSProperties = {
  padding: "5px 10px",
  borderRadius: 999,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#94a3b8",
  fontSize: 12,
  cursor: "pointer",
};

const buttonStyle: CSSProperties = {
  marginTop: 24,
  width: "100%",
  padding: "12px 18px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 15,
};

const buttonStyleSecondary: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px dashed #475569",
  background: "transparent",
  color: "#94a3b8",
  cursor: "pointer",
  fontSize: 13,
};
