"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";

type Mensaje = {
  id: string;
  emisor_id: string;
  emisor_nombre: string;
  contenido: string;
  creado_en: string;
};

const PATRON_URL = /(https?:\/\/[^\s]+)/g;

// Convierte links sueltos en el mensaje (ej: uno de Google Maps para la
// ubicación de la obra) en enlaces clicables, sin tocar el resto del texto.
// split() con un grupo capturado intercala [texto, url, texto, url, ...],
// así que los índices impares son siempre la URL — más confiable que
// volver a probar con un regex global, que arrastra estado entre llamadas.
function renderConLinks(texto: string, colorLink: string) {
  const partes = texto.split(PATRON_URL);
  return partes.map((parte, i) =>
    i % 2 === 1 ? (
      <a key={i} href={parte} target="_blank" rel="noopener noreferrer" style={{ color: colorLink, wordBreak: "break-all" }}>
        {parte}
      </a>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

export default function ChatClient({
  publicacionId,
  titulo,
  miId,
  nombreContraparte,
  idContraparte,
}: {
  publicacionId: string;
  titulo: string;
  miId: string;
  nombreContraparte: string;
  idContraparte: string;
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [borrandoId, setBorrandoId] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;

    async function cargar() {
      try {
        const res = await fetch(`/api/publicaciones/${publicacionId}/mensajes`);
        const data = await res.json();
        if (!cancelado && data.ok) setMensajes(data.mensajes);
      } catch {
        // silencioso: el siguiente sondeo lo reintenta
      }
    }

    cargar();
    const intervalo = setInterval(cargar, 4000);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [publicacionId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes.length]);

  async function enviarMensaje(contenido: string): Promise<boolean> {
    const res = await fetch(`/api/publicaciones/${publicacionId}/mensajes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido }),
    });
    const data = await res.json();
    if (!data.ok) {
      setError(data.error ?? "No se pudo enviar el mensaje.");
      return false;
    }
    const refrescado = await fetch(`/api/publicaciones/${publicacionId}/mensajes`);
    const datosRefrescados = await refrescado.json();
    if (datosRefrescados.ok) setMensajes(datosRefrescados.mensajes);
    return true;
  }

  async function borrarMensaje(mensajeId: string) {
    setError(null);
    setBorrandoId(mensajeId);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/mensajes/${mensajeId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setMensajes((actuales) => actuales.filter((m) => m.id !== mensajeId));
      } else {
        setError(data.error ?? "No se pudo borrar el mensaje.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setBorrandoId(null);
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setError(null);
    setEnviando(true);
    try {
      if (await enviarMensaje(texto.trim())) setTexto("");
    } catch {
      setError("Error de conexión.");
    } finally {
      setEnviando(false);
    }
  }

  // Comparte la ubicación GPS actual como un link de Google Maps con
  // coordenadas exactas — sirve para sitios sin dirección clara (una finca,
  // una obra en construcción) donde escribir una dirección no alcanza.
  function enviarUbicacion() {
    if (!navigator.geolocation) {
      setError("Este navegador no permite compartir ubicación.");
      return;
    }
    setError(null);
    setObteniendoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const link = `https://www.google.com/maps?q=${latitude},${longitude}`;
        try {
          await enviarMensaje(`📍 Mi ubicación: ${link}`);
        } catch {
          setError("Error de conexión.");
        } finally {
          setObteniendoUbicacion(false);
        }
      },
      () => {
        setError("No se pudo obtener tu ubicación. Revisa los permisos de ubicación del navegador.");
        setObteniendoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 0", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--color-borde)" }}>
        <Link href={`/publicaciones/${publicacionId}`} className="enlace-volver">
          ← Volver a la oferta
        </Link>
        <h1 className="titular" style={{ fontSize: 18, margin: "8px 0 2px", fontWeight: 700 }}>{titulo}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-mist)" }}>
          Con{" "}
          <Link href={`/perfil/${idContraparte}`} style={{ color: "var(--color-azul-suave)" }}>
            {nombreContraparte}
          </Link>
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {mensajes.length === 0 && (
          <p style={{ color: "var(--color-mist)", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            Todavía no hay mensajes. Escribe el primero.
          </p>
        )}
        {mensajes.map((m) => {
          const esMio = m.emisor_id === miId;
          return (
            <div key={m.id} style={{ alignSelf: esMio ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div
                style={{
                  border: `1px solid ${esMio ? "var(--color-acento-claro)" : "var(--color-borde)"}`,
                  borderRadius: 12,
                  padding: "8px 12px",
                  background: esMio
                    ? "linear-gradient(135deg, rgba(255,207,125,.16), var(--color-superficie-2))"
                    : "linear-gradient(160deg, rgba(4,37,58,.028), rgba(4,37,58,0) 55%), var(--color-superficie)",
                }}
              >
                {!esMio && <p style={{ margin: 0, fontSize: 11, color: "var(--color-mist)" }}>{m.emisor_nombre}</p>}
                <p style={{ margin: esMio ? 0 : "2px 0 0", fontSize: 14 }}>
                  {renderConLinks(m.contenido, esMio ? "var(--color-marca)" : "var(--color-azul-suave)")}
                </p>
              </div>
              {esMio && (
                <button
                  onClick={() => borrarMensaje(m.id)}
                  disabled={borrandoId === m.id}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px 0",
                    marginTop: 2,
                    fontSize: 11,
                    color: "var(--color-mist-tenue)",
                  }}
                >
                  {borrandoId === m.id ? "Borrando…" : "Borrar"}
                </button>
              )}
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      {error && <p style={{ color: "#dc2626", fontSize: 12, margin: "0 0 6px" }}>{error}</p>}

      <form onSubmit={enviar} style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-borde)" }}>
        <button
          type="button"
          onClick={enviarUbicacion}
          disabled={obteniendoUbicacion}
          title="Enviar mi ubicación actual"
          className="boton-linea"
          style={{ width: "auto", padding: "10px 12px", borderRadius: 10, flexShrink: 0, fontSize: 16 }}
        >
          {obteniendoUbicacion ? "…" : "📍"}
        </button>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje…" className="input-vidrio" style={{ flex: 1 }} />
        <button type="submit" disabled={enviando || !texto.trim()} className="boton-primario" style={{ width: "auto", padding: "10px 18px", borderRadius: 10 }}>
          Enviar
        </button>
      </form>
    </main>
  );
}
