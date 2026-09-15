"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function SubirFotoBoton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError(null);
    setCargando(true);
    try {
      const formData = new FormData();
      formData.append("foto", archivo);
      const res = await fetch("/api/perfil/foto", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "No se pudo subir la foto.");
        return;
      }
      router.refresh();
    } catch {
      setError("Error de conexión.");
    } finally {
      setCargando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div style={{ marginTop: 8 }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onFileChange}
        style={{ display: "none" }}
        id="input-foto-perfil"
      />
      <label htmlFor="input-foto-perfil" className="boton-linea" style={{ cursor: "pointer", display: "inline-block" }}>
        {cargando ? "Subiendo…" : "Cambiar foto de perfil"}
      </label>
      {error && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
