"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const LADO_MAXIMO_PX = 400;

// La foto de perfil se muestra siempre en miniatura (56px), pero el
// celular sube fotos de cámara de varios MB — sin achicarla antes, cada
// vez que alguien abre un perfil se descarga esa foto completa. Se
// redimensiona y comprime en el navegador antes de subirla.
async function comprimirImagen(archivo: File): Promise<File> {
  if (typeof createImageBitmap === "undefined") return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.round(bitmap.width * escala);
    const alto = Math.round(bitmap.height * escala);

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) return archivo;
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    if (!blob) return archivo;
    return new File([blob], archivo.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return archivo;
  }
}

export default function SubirFotoBoton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const archivoOriginal = e.target.files?.[0];
    if (!archivoOriginal) return;
    setError(null);
    setCargando(true);
    try {
      const archivo = await comprimirImagen(archivoOriginal);
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
      {error && <p style={{ color: "#dc2626", fontSize: 12, marginTop: 6 }}>{error}</p>}
    </div>
  );
}
