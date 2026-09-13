"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import Link from "next/link";

type Mensaje = {
  id: string;
  emisor_id: string;
  emisor_nombre: string;
  contenido: string;
  creado_en: string;
};

export default function ChatClient({
  publicacionId,
  titulo,
  miId,
  contraparte,
}: {
  publicacionId: string;
  titulo: string;
  miId: string;
  contraparte: { nombre: string; celular: string };
}) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
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

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/publicaciones/${publicacionId}/mensajes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido: texto.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setTexto("");
        const refrescado = await fetch(`/api/publicaciones/${publicacionId}/mensajes`);
        const datosRefrescados = await refrescado.json();
        if (datosRefrescados.ok) setMensajes(datosRefrescados.mensajes);
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 0", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
      <div style={{ paddingBottom: 12, borderBottom: "1px solid #334155" }}>
        <Link href={`/publicaciones/${publicacionId}`} style={{ color: "#60a5fa", fontSize: 13 }}>
          ← Volver a la oferta
        </Link>
        <h1 style={{ fontSize: 18, margin: "8px 0 2px" }}>{titulo}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
          Con {contraparte.nombre} ·{" "}
          <a
            href={`https://wa.me/${contraparte.celular.replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#4ade80" }}
          >
            {contraparte.celular}
          </a>
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
        {mensajes.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", marginTop: 20 }}>
            Todavía no hay mensajes. Escribe el primero.
          </p>
        )}
        {mensajes.map((m) => {
          const esMio = m.emisor_id === miId;
          return (
            <div key={m.id} style={{ alignSelf: esMio ? "flex-end" : "flex-start", maxWidth: "80%" }}>
              <div style={{ ...burbuja, background: esMio ? "#1e3a5f" : "#1e293b" }}>
                {!esMio && <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{m.emisor_nombre}</p>}
                <p style={{ margin: esMio ? 0 : "2px 0 0", fontSize: 14 }}>{m.contenido}</p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid #334155" }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje…" style={inputStyle} />
        <button type="submit" disabled={enviando || !texto.trim()} style={botonEnviar}>
          Enviar
        </button>
      </form>
    </main>
  );
}

const burbuja: CSSProperties = {
  border: "1px solid #334155",
  borderRadius: 10,
  padding: "8px 12px",
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  fontSize: 14,
};

const botonEnviar: CSSProperties = {
  padding: "10px 16px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e3a5f",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 14,
};
