import Link from "next/link";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import HealthCheck from "./HealthCheck";
import CerrarSesionBoton from "./CerrarSesionBoton";

export default async function Home() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  let usuario: { nombre_razon_social: string; ciudad: string | null; es_admin: boolean } | null = null;

  if (usuarioId) {
    const result = await query<{ nombre_razon_social: string; ciudad: string | null; es_admin: boolean }>(
      "select nombre_razon_social, ciudad, es_admin from usuarios where id = $1",
      [usuarioId]
    );
    usuario = result.rows[0] ?? null;
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 28, marginBottom: 4 }}>Enganche</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        Marketplace de demanda para producción e instalación de sistemas de aluminio y vidrio.
      </p>

      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          borderRadius: 8,
          border: "1px solid #334155",
          background: "#1e293b",
        }}
      >
        {usuario ? (
          <>
            <p style={{ margin: 0 }}>
              Sesión activa: <strong>{usuario.nombre_razon_social}</strong>
              {usuario.ciudad ? ` · ${usuario.ciudad}` : ""}
            </p>
            <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center" }}>
              <Link href="/feed" style={{ color: "#60a5fa", fontSize: 13 }}>
                Ver ofertas
              </Link>
              <Link href="/publicar" style={{ color: "#60a5fa", fontSize: 13 }}>
                Publicar una oferta
              </Link>
              <Link href="/postulaciones" style={{ color: "#60a5fa", fontSize: 13 }}>
                Mis postulaciones
              </Link>
              {usuario.es_admin && (
                <Link href="/admin" style={{ color: "#facc15", fontSize: 13 }}>
                  Panel admin
                </Link>
              )}
              <CerrarSesionBoton />
            </div>
          </>
        ) : (
          <p style={{ margin: 0 }}>
            No has iniciado sesión.{" "}
            <Link href="/entrar" style={{ color: "#60a5fa" }}>
              Entrar
            </Link>
          </p>
        )}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 32 }}>Estado de las fases</h2>
      <ul style={{ lineHeight: 1.8 }}>
        <li>✅ Fase 0 — Esqueleto de datos (8 tablas, PostGIS, triggers)</li>
        <li>✅ Fase 1 — Auth por OTP de WhatsApp + registro de dos pasos</li>
        <li>✅ Fase 2 — Publicar + feed por cercanía (PostGIS en vivo)</li>
        <li>✅ Fase 3 — Postulación + chat</li>
        <li>✅ Fase 4 — Cierre + calificación + comisión</li>
        <li>✅ Fase 5 — Panel de comisiones (admin)</li>
      </ul>

      <HealthCheck />
    </main>
  );
}
