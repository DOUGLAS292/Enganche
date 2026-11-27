"use client";

import { useState } from "react";

export default function AvisoAdmin({ id, mensaje }: { id: string; mensaje: string }) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  async function entendido() {
    setVisible(false);
    try {
      await fetch(`/api/avisos/${id}/leido`, { method: "POST" });
    } catch {
      // Se mostrará de nuevo la próxima vez.
    }
  }
  return (
    <div className="panel" style={{ marginTop: 22, padding: "14px 16px", borderColor: "var(--color-acento-claro)" }}>
      <p style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>Aviso de Enganche</p>
      <p style={{ margin: "6px 0 10px", fontSize: 14, whiteSpace: "pre-wrap" }}>{mensaje}</p>
      <button onClick={entendido} className="boton-linea" style={{ width: "100%" }}>Entendido</button>
    </div>
  );
}
