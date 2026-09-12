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
  tiempo_entrega: string | null;
  valor_ofertado: number;
  ciudad: string;
  region: string | null;
  creado_en: string;
  autor_nombre: string;
  autor_rating: number | null;
  autor_trabajos: number;
  autor_verificado: boolean;
  distancia_m: number | null;
};

const NIVEL_ETIQUETA: Record<string, string> = {
  tradicional: "Nivel 1 · Tradicional",
  superior: "Nivel 2 · Superior",
  especializada: "Nivel 3 · Especializada",
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Ofertas cerca de ti</h1>
        <Link href="/publicar" style={{ color: "#60a5fa", fontSize: 14 }}>
          + Publicar
        </Link>
      </div>

      {estadoUbicacion === "denegada" && !coords && (
        <div style={{ marginTop: 12 }}>
          <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>No pudimos usar tu ubicación. Filtra por ciudad:</p>
          <input value={ciudadFiltro} onChange={(e) => setCiudadFiltro(e.target.value)} placeholder="Ej: Cali" style={inputStyle} />
        </div>
      )}

      {coords && (
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: 13, color: "#94a3b8", whiteSpace: "nowrap" }}>Radio: {radioKm} km</label>
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

      {error && <p style={{ color: "#f87171", marginTop: 16 }}>{error}</p>}
      {publicaciones === null && !error && <p style={{ marginTop: 24, color: "#94a3b8" }}>Cargando ofertas…</p>}
      {publicaciones?.length === 0 && (
        <p style={{ marginTop: 24, color: "#94a3b8" }}>
          No hay ofertas abiertas por ahora{coords ? " en este radio" : ""}. Sé el primero en{" "}
          <Link href="/publicar" style={{ color: "#60a5fa" }}>
            publicar una
          </Link>
          .
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {publicaciones?.map((p) => (
          <Link key={p.id} href={`/publicaciones/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <article style={cardStyle}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span style={badgeStyle(p.tipo_trabajo === "instalacion" ? "#1c5079" : "#bd5a26")}>
                  {p.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"}
                </span>
                {p.distancia_m != null && <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatDistanciaKm(p.distancia_m)}</span>}
              </div>
              <h3 style={{ margin: "8px 0 2px", fontSize: 17 }}>{p.sistema_o_proyecto}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                {NIVEL_ETIQUETA[p.nivel_sistema]} · {p.ciudad}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10, fontSize: 13 }}>
                <span>{p.cantidad}</span>
                <span style={{ textAlign: "right", fontWeight: 600 }}>{formatCOP(p.valor_ofertado)}</span>
              </div>
              <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "#64748b" }}>
                {p.autor_nombre}
                {p.autor_verificado ? " ✓" : ""}
                {p.autor_rating ? ` · ★ ${p.autor_rating}` : ""} · {formatFecha(p.creado_en)}
              </p>
            </article>
          </Link>
        ))}
      </div>
    </main>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  fontSize: 14,
  marginTop: 6,
};

const cardStyle: CSSProperties = {
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "12px 14px",
  background: "#1e293b",
};

function chipStyle(activo: boolean): CSSProperties {
  return {
    flex: "none",
    padding: "6px 12px",
    borderRadius: 999,
    fontSize: 12,
    cursor: "pointer",
    border: `1px solid ${activo ? "#60a5fa" : "#334155"}`,
    background: activo ? "#1e3a5f" : "transparent",
    color: activo ? "#eef2f5" : "#94a3b8",
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
