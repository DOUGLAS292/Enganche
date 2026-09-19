"use client";

import { useRouter } from "next/navigation";

export default function CerrarSesionBoton() {
  const router = useRouter();

  async function salir() {
    await fetch("/api/auth/salir", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      style={{
        background: "none",
        border: "none",
        color: "#475569",
        textDecoration: "underline",
        cursor: "pointer",
        fontSize: 13,
        padding: 0,
      }}
    >
      Cerrar sesión
    </button>
  );
}
