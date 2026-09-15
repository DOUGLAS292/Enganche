"use client";

import { useState, type FormEvent, type ReactNode } from "react";
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

const LUGARES_FABRICACION = [
  { valor: "instalaciones_ofertante", etiqueta: "En mis instalaciones (el postulante solo pone la mano de obra)" },
  { valor: "taller_postulante", etiqueta: "El postulante debe tener su propio taller" },
] as const;

type NivelSistema = keyof typeof PROYECTOS_SUGERIDOS;
type EstadoUbicacion = "sin_pedir" | "pidiendo" | "lista" | "denegada";

export default function PublicarForm() {
  const router = useRouter();
  const [tipoTrabajo, setTipoTrabajo] = useState<string>("instalacion");
  const [nivelSistema, setNivelSistema] = useState<NivelSistema>("tradicional");
  const [lugarFabricacion, setLugarFabricacion] = useState<string>("instalaciones_ofertante");
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
          lugarFabricacion: tipoTrabajo === "produccion" ? lugarFabricacion : undefined,
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
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>
      <h1 className="titular" style={{ fontSize: 26, marginTop: 14, fontWeight: 700 }}>Publicar una oferta</h1>
      <p style={{ color: "var(--color-mist)" }}>
        El valor lo defines tú. Los postulantes solo deciden si aceptan — no hay regateo.
      </p>

      <form onSubmit={enviar}>
        <Campo etiqueta="Tipo de trabajo">
          <Radios opciones={TIPOS} valor={tipoTrabajo} onChange={setTipoTrabajo} nombre="tipoTrabajo" columnas={2} />
        </Campo>

        <Campo etiqueta="Nivel del sistema">
          <Radios opciones={NIVELES} valor={nivelSistema} onChange={(v) => setNivelSistema(v as NivelSistema)} nombre="nivelSistema" columnas={1} />
        </Campo>

        {tipoTrabajo === "produccion" && (
          <Campo etiqueta="¿Dónde se fabrica?">
            <Radios opciones={LUGARES_FABRICACION} valor={lugarFabricacion} onChange={setLugarFabricacion} nombre="lugarFabricacion" columnas={1} />
          </Campo>
        )}

        <Campo etiqueta="Descripción">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            required
            className="input-vidrio"
            placeholder="Ej: Ventanas, puertas, divisiones de baño, gabinetes…"
          />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
            {PROYECTOS_SUGERIDOS[nivelSistema].map((s) => (
              <button type="button" key={s} onClick={() => setDescripcion(s)} className="chip-tecnico" style={{ cursor: "pointer", color: "var(--color-mist)" }}>
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
              className="input-vidrio"
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
              className="input-vidrio"
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
            className="input-vidrio"
          />
        </Campo>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Campo etiqueta="Fecha de inicio (opcional)">
            <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="input-vidrio" />
          </Campo>
          <Campo etiqueta="Fecha de finalización (opcional)">
            <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="input-vidrio" />
          </Campo>
        </div>

        <Campo etiqueta="Ciudad">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required className="input-vidrio" placeholder="Ej: Cali" />
        </Campo>

        <Campo etiqueta="Ubicación exacta (opcional, ayuda a que te vean por cercanía)">
          <button type="button" onClick={pedirUbicacion} className="boton-linea" style={{ width: "100%", borderStyle: "dashed" }}>
            {estadoUbicacion === "lista"
              ? "✓ Ubicación capturada"
              : estadoUbicacion === "pidiendo"
                ? "Obteniendo ubicación…"
                : "Usar mi ubicación actual"}
          </button>
          {estadoUbicacion === "denegada" && (
            <p style={{ color: "var(--color-acento-claro)", fontSize: 12, marginTop: 6 }}>
              No se pudo obtener tu ubicación. La oferta igual se publica, pero solo aparecerá al filtrar por ciudad, no por cercanía.
            </p>
          )}
        </Campo>

        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 20, fontSize: 14 }}>
          <input type="checkbox" checked={requiereSeguridad} onChange={(e) => setRequiereSeguridad(e.target.checked)} />
          Requiere seguridad / registro de acceso
        </label>

        {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={cargando} className="boton-primario" style={{ marginTop: 24 }}>
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
            borderRadius: 10,
            border: `1px solid ${valor === op.valor ? "var(--color-acento-claro)" : "var(--color-borde)"}`,
            background: valor === op.valor ? "var(--color-superficie-2)" : "var(--color-superficie)",
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

