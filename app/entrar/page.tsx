"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Paso = "celular" | "codigo";

export default function Entrar() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("celular");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoDesarrollo, setCodigoDesarrollo] = useState<string | null>(null);

  async function pedirCodigo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/otp/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo enviar el código.");
        return;
      }
      setCelular(data.celular);
      setCodigoDesarrollo(data.codigoDesarrollo ?? null);
      setPaso("codigo");
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  async function verificarCodigo(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/otp/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ celular, codigo }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "El código no es correcto.");
        return;
      }
      router.push(data.usuarioExistente ? "/" : "/registro");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="reticula" style={{ maxWidth: 420, margin: "0 auto", padding: "56px 20px" }}>
      <h1 className="titular" style={{ fontSize: 28, fontWeight: 700 }}>Entrar a Enganche</h1>

      {paso === "celular" && (
        <form onSubmit={pedirCodigo}>
          <p style={{ color: "var(--color-mist)" }}>Te enviamos un código por WhatsApp, sin contraseñas.</p>
          <label htmlFor="celular" style={labelStyle}>
            Número de celular
          </label>
          <input
            id="celular"
            type="tel"
            inputMode="numeric"
            placeholder="300 123 4567"
            value={celular}
            onChange={(e) => setCelular(e.target.value)}
            required
            className="input-vidrio"
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={cargando} className="boton-primario" style={{ marginTop: 20 }}>
            {cargando ? "Enviando…" : "Enviar código por WhatsApp"}
          </button>
        </form>
      )}

      {paso === "codigo" && (
        <form onSubmit={verificarCodigo}>
          <p style={{ color: "var(--color-mist)" }}>Escribe el código de 6 dígitos que te llegó al {celular}.</p>
          {codigoDesarrollo && (
            <p style={{ color: "var(--color-acento-claro)", fontSize: 13 }}>
              Modo desarrollo (WhatsApp aún no configurado) — tu código es <strong>{codigoDesarrollo}</strong>
            </p>
          )}
          <label htmlFor="codigo" style={labelStyle}>
            Código de 6 dígitos
          </label>
          <input
            id="codigo"
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            required
            className="input-vidrio"
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={cargando} className="boton-primario" style={{ marginTop: 20 }}>
            {cargando ? "Verificando…" : "Verificar"}
          </button>
          <button type="button" onClick={() => setPaso("celular")} className="boton-linea" style={{ width: "100%", marginTop: 8 }}>
            Cambiar número
          </button>
        </form>
      )}
    </main>
  );
}

const labelStyle: CSSProperties = { display: "block", marginTop: 16, marginBottom: 6, fontSize: 14, color: "var(--color-texto-tenue)" };

const errorStyle: CSSProperties = { color: "#dc2626", marginTop: 10, fontSize: 14 };
