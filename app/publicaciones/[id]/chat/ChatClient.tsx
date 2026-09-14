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

export default function ChatClient({
  publicacionId,
  titulo,
  miId,
  nombreContraparte,
}: {
  publicacionId: string;
  titulo: string;
  miId: string;
  nombreContraparte: string;
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
      <div style={{ paddingBottom: 12, borderBottom: "1px solid var(--color-borde)" }}>
        <Link href={`/publicaciones/${publicacionId}`} className="enlace-volver">
          ← Volver a la oferta
        </Link>
        <h1 className="titular" style={{ fontSize: 18, margin: "8px 0 2px", fontWeight: 700 }}>{titulo}</h1>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-mist)" }}>Con {nombreContraparte}</p>
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
                    : "linear-gradient(160deg, rgba(255,255,255,.05), rgba(255,255,255,0) 55%), var(--color-superficie)",
                }}
              >
                {!esMio && <p style={{ margin: 0, fontSize: 11, color: "var(--color-mist)" }}>{m.emisor_nombre}</p>}
                <p style={{ margin: esMio ? 0 : "2px 0 0", fontSize: 14 }}>{m.contenido}</p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      <form onSubmit={enviar} style={{ display: "flex", gap: 8, padding: "12px 0", borderTop: "1px solid var(--color-borde)" }}>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escribe un mensaje…" className="input-vidrio" style={{ flex: 1 }} />
        <button type="submit" disabled={enviando || !texto.trim()} className="boton-primario" style={{ width: "auto", padding: "10px 18px", borderRadius: 10 }}>
          Enviar
        </button>
      </form>
    </main>
  );
}
