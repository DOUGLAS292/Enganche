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
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24 }}>Entrar a Enganche</h1>

      {paso === "celular" && (
        <form onSubmit={pedirCodigo}>
          <p style={{ color: "#94a3b8" }}>Te enviamos un código por WhatsApp, sin contraseñas.</p>
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
            style={inputStyle}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={cargando} style={buttonStyle}>
            {cargando ? "Enviando…" : "Enviar código por WhatsApp"}
          </button>
        </form>
      )}

      {paso === "codigo" && (
        <form onSubmit={verificarCodigo}>
          <p style={{ color: "#94a3b8" }}>Escribe el código de 6 dígitos que te llegó al {celular}.</p>
          {codigoDesarrollo && (
            <p style={{ color: "#facc15", fontSize: 13 }}>
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
            style={inputStyle}
          />
          {error && <p style={errorStyle}>{error}</p>}
          <button type="submit" disabled={cargando} style={buttonStyle}>
            {cargando ? "Verificando…" : "Verificar"}
          </button>
          <button
            type="button"
            onClick={() => setPaso("celular")}
            style={{ ...buttonStyle, background: "transparent", marginTop: 8 }}
          >
            Cambiar número
          </button>
        </form>
      )}
    </main>
  );
}

const labelStyle: CSSProperties = { display: "block", marginTop: 16, marginBottom: 6, fontSize: 14, color: "#cbd5e1" };

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  fontSize: 15,
};

const buttonStyle: CSSProperties = {
  marginTop: 20,
  width: "100%",
  padding: "12px 18px",
  borderRadius: 8,
  border: "1px solid #334155",
  background: "#1e293b",
  color: "#eef2f5",
  cursor: "pointer",
  fontSize: 15,
};

const errorStyle: CSSProperties = { color: "#f87171", marginTop: 10, fontSize: 14 };
