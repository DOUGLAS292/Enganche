"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { formatCOP, formatDistanciaKm, formatFecha } from "@/lib/format";

type Publicacion = {
  id: string;
  tipo_trabajo: "produccion" | "instalacion";
  nivel_sistema: "tradicional" | "superior" | "especializada";
  sistema_o_proyecto: string;
  cantidad: string;
  mtr2: string | null;
  tiempo_entrega: string | null;
  valor_ofertado: number;
  ciudad: string;
  region: string | null;
  creado_en: string;
  lugar_fabricacion: "instalaciones_ofertante" | "taller_postulante" | null;
  autor_nombre: string;
  autor_rating: number | null;
  autor_trabajos: number;
  autor_verificado: boolean;
  es_urgente: boolean;
  distancia_m: number | null;
};

const NIVEL_ETIQUETA: Record<string, string> = {
  tradicional: "Nivel 1 · Tradicional",
  superior: "Nivel 2 · Superior",
  especializada: "Nivel 3 · Especializada",
};

const LUGAR_FABRICACION_ETIQUETA: Record<string, string> = {
  instalaciones_ofertante: "🏭 Instalaciones del autor",
  taller_postulante: "🏭 Taller propio requerido",
};

type EstadoUbicacion = "pidiendo" | "lista" | "denegada";

export default function FeedClient() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>("pidiendo");
  const [ciudadFiltro, setCiudadFiltro] = useState("");
  const [tipoTrabajo, setTipoTrabajo] = useState<string>("todas");
  const [nivelSistema, setNivelSistema] = useState<string>("todos");
  const [radioKm, setRadioKm] = useState(10);
  const [publicaciones, setPublicaciones] = useState<Publicacion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setEstadoUbicacion("denegada");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setEstadoUbicacion("lista");
      },
      () => setEstadoUbicacion("denegada"),
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (estadoUbicacion === "pidiendo") return;
    let cancelado = false;

    async function cargar() {
      setError(null);
      const params = new URLSearchParams();
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lng", String(coords.lng));
        params.set("radioKm", String(radioKm));
      } else if (ciudadFiltro) {
        params.set("ciudad", ciudadFiltro);
      }
      if (tipoTrabajo !== "todas") params.set("tipoTrabajo", tipoTrabajo);
      if (nivelSistema !== "todos") params.set("nivelSistema", nivelSistema);

      try {
        const res = await fetch(`/api/publicaciones?${params.toString()}`);
        const data = await res.json();
        if (cancelado) return;
        if (!data.ok) {
          setError(data.error ?? "No se pudieron cargar las ofertas.");
          return;
        }
        setPublicaciones(data.publicaciones);
      } catch {
        if (!cancelado) setError("Error de conexión.");
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [estadoUbicacion, coords, ciudadFiltro, tipoTrabajo, nivelSistema, radioKm]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 14 }}>
        <h1 className="titular" style={{ fontSize: 24, margin: 0, fontWeight: 700 }}>Ofertas cerca de ti</h1>
        <Link href="/publicar" className="enlace-volver">
          + Publicar
        </Link>
      </div>

      {estadoUbicacion === "denegada" && !coords && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "var(--color-mist)", fontSize: 13, margin: 0 }}>No pudimos usar tu ubicación. Filtra por ciudad:</p>
          <input value={ciudadFiltro} onChange={(e) => setCiudadFiltro(e.target.value)} placeholder="Ej: Cali" className="input-vidrio" style={{ marginTop: 6 }} />
        </div>
      )}

      {coords && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <label className="chip-tecnico" style={{ whiteSpace: "nowrap" }}>Radio: {radioKm} km</label>
          <input
            type="range"
            min={2}
            max={50}
            step={1}
            value={radioKm}
            onChange={(e) => setRadioKm(Number(e.target.value))}
            style={{ flex: 1 }}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14, overflowX: "auto" }}>
        {[
          { v: "todas", t: "Todas" },
          { v: "instalacion", t: "Instalación" },
          { v: "produccion", t: "Producción" },
        ].map((op) => (
          <button key={op.v} onClick={() => setTipoTrabajo(op.v)} style={chipStyle(tipoTrabajo === op.v)}>
            {op.t}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8, overflowX: "auto" }}>
        {[
          { v: "todos", t: "Todos los niveles" },
          { v: "tradicional", t: "Nivel 1" },
          { v: "superior", t: "Nivel 2" },
          { v: "especializada", t: "Nivel 3" },
        ].map((op) => (
          <button key={op.v} onClick={() => setNivelSistema(op.v)} style={chipStyle(nivelSistema === op.v)}>
            {op.t}
          </button>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", marginTop: 16 }}>{error}</p>}
      {publicaciones === null && !error && <p style={{ marginTop: 24, color: "var(--color-mist)" }}>Cargando ofertas…</p>}
      {publicaciones?.length === 0 && (
        <p style={{ marginTop: 24, color: "var(--color-mist)" }}>
          No hay ofertas abiertas por ahora{coords ? " en este radio" : ""}. Sé el primero en{" "}
          <Link href="/publicar" style={{ color: "var(--color-azul-suave)" }}>
            publicar una
          </Link>
          .
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {publicaciones?.map((p) => (
          <Link key={p.id} href={`/publicaciones/${p.id}`} className="panel" style={{ padding: "14px 16px", ...(p.es_urgente ? { borderColor: "#dc2626" } : {}) }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span style={badgeStyle(p.tipo_trabajo === "instalacion" ? "#1c5079" : "#bd5a26")}>
                  {p.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"}
                </span>
                {p.es_urgente && <span style={badgeStyle("#dc2626")}>🚨 Urgente</span>}
              </div>
              {p.distancia_m != null && <span className="chip-tecnico">{formatDistanciaKm(p.distancia_m)}</span>}
            </div>
            <h3 style={{ margin: "10px 0 2px", fontSize: 17 }}>{p.sistema_o_proyecto}</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--color-mist)" }}>
              {NIVEL_ETIQUETA[p.nivel_sistema]} · {p.ciudad}
            </p>
            {p.lugar_fabricacion && (
              <span className="chip-tecnico" style={{ marginTop: 6, display: "inline-block" }}>
                {LUGAR_FABRICACION_ETIQUETA[p.lugar_fabricacion]}
              </span>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, fontSize: 13, fontFamily: "var(--font-mono)" }}>
              <span>
                {/^\d+$/.test(p.cantidad) ? `${p.cantidad} producto${p.cantidad === "1" ? "" : "s"}` : p.cantidad}
                {p.mtr2 ? ` · ${p.mtr2} m²` : ""}
              </span>
              <span style={{ textAlign: "right", fontWeight: 600, color: "var(--color-acento-claro)" }}>{formatCOP(p.valor_ofertado)}</span>
            </div>
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "var(--color-mist-tenue)" }}>
              {p.autor_nombre}
              {p.autor_verificado ? " ✓" : ""}
              {p.autor_rating ? ` · ★ ${p.autor_rating}` : ""} · {formatFecha(p.creado_en)}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}

function chipStyle(activo: boolean): CSSProperties {
  return {
    flex: "none",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    cursor: "pointer",
    border: `1px solid ${activo ? "var(--color-azul-suave)" : "var(--color-borde)"}`,
    background: activo ? "#1e3a5f" : "transparent",
    color: activo ? "var(--color-texto)" : "var(--color-mist)",
    fontFamily: "inherit",
  };
}

function badgeStyle(color: string): CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    padding: "3px 8px",
    borderRadius: 5,
    background: color,
    color: "#fff",
  };
}
