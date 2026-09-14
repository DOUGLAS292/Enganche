"use client";

import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TIPOS = [
  { valor: "independiente", etiqueta: "Independiente" },
  { valor: "taller", etiqueta: "Taller" },
  { valor: "empresa", etiqueta: "Empresa" },
] as const;

const OFRECE = [
  { valor: "instalacion", etiqueta: "Instalación" },
  { valor: "produccion", etiqueta: "Producción" },
  { valor: "ambos", etiqueta: "Ambos" },
] as const;

export default function RegistroForm({ celular }: { celular: string }) {
  const router = useRouter();
  const [tipoUsuario, setTipoUsuario] = useState<string>("independiente");
  const [ofrece, setOfrece] = useState<string>("instalacion");
  const [nombreRazonSocial, setNombreRazonSocial] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [documento, setDocumento] = useState("");
  const [sistemaLinea, setSistemaLinea] = useState("");
  const [anosExperiencia, setAnosExperiencia] = useState("");
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoUsuario,
          ofrece,
          nombreRazonSocial,
          ciudad,
          documento: documento || undefined,
          sistemaLinea: sistemaLinea || undefined,
          anosExperiencia: anosExperiencia || undefined,
          aceptaTerminos,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="reticula" style={{ maxWidth: 460, margin: "0 auto", padding: "48px 20px" }}>
      <h1 className="titular" style={{ fontSize: 26, fontWeight: 700 }}>Completa tu perfil</h1>
      <p style={{ color: "var(--color-mist)" }}>Celular verificado: {celular}</p>

      <form onSubmit={enviar}>
        <Campo etiqueta="¿Cómo trabajas?">
          <Radios opciones={TIPOS} valor={tipoUsuario} onChange={setTipoUsuario} nombre="tipoUsuario" />
        </Campo>

        <Campo etiqueta="Nombre completo o razón social">
          <input value={nombreRazonSocial} onChange={(e) => setNombreRazonSocial(e.target.value)} required className="input-vidrio" />
        </Campo>

        <Campo etiqueta="Ciudad">
          <input value={ciudad} onChange={(e) => setCiudad(e.target.value)} required className="input-vidrio" placeholder="Ej: Cali" />
        </Campo>

        <Campo etiqueta="¿Qué ofreces?">
          <Radios opciones={OFRECE} valor={ofrece} onChange={setOfrece} nombre="ofrece" />
        </Campo>

        <Campo etiqueta="Cédula o NIT (opcional)">
          <input value={documento} onChange={(e) => setDocumento(e.target.value)} className="input-vidrio" />
        </Campo>

        <Campo etiqueta="Sistema o línea con la que trabajas (opcional)">
          <input value={sistemaLinea} onChange={(e) => setSistemaLinea(e.target.value)} className="input-vidrio" placeholder="Ej: Serie 50" />
        </Campo>

        <Campo etiqueta="Años de experiencia (opcional)">
          <input type="number" min={0} value={anosExperiencia} onChange={(e) => setAnosExperiencia(e.target.value)} className="input-vidrio" />
        </Campo>

        <label style={terminosLabel}>
          <input
            type="checkbox"
            checked={aceptaTerminos}
            onChange={(e) => setAceptaTerminos(e.target.checked)}
            style={{ marginTop: 2 }}
          />
          <span>
            He leído y acepto los{" "}
            <Link href="/terminos" target="_blank" style={{ color: "var(--color-azul-suave)" }}>
              términos y condiciones
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" target="_blank" style={{ color: "var(--color-azul-suave)" }}>
              política de privacidad
            </Link>{" "}
            de Enganche, incluyendo el tratamiento de mis datos personales y que la plataforma
            solo intermedia el contacto entre las partes, sin responder por la calidad del
            trabajo ni por los pagos acordados entre ellas.
          </span>
        </label>

        {error && <p style={{ color: "#f87171", fontSize: 14 }}>{error}</p>}

        <button type="submit" disabled={cargando || !aceptaTerminos} className="boton-primario" style={{ marginTop: 24 }}>
          {cargando ? "Creando cuenta…" : "Crear cuenta"}
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
}: {
  opciones: readonly { valor: T; etiqueta: string }[];
  valor: T;
  onChange: (v: T) => void;
  nombre: string;
}) {
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {opciones.map((op) => (
        <label
          key={op.valor}
          style={{
            flex: 1,
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

const terminosLabel: CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "flex-start",
  marginTop: 20,
  fontSize: 11.5,
  color: "var(--color-mist)",
  lineHeight: 1.5,
};
