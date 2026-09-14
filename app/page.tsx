import Link from "next/link";
import type { CSSProperties } from "react";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import HealthCheck from "./HealthCheck";
import CerrarSesionBoton from "./CerrarSesionBoton";

export default async function Home() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  let usuario: { nombre_razon_social: string; ciudad: string | null; es_admin: boolean } | null = null;
  let postulantesPorRevisar = 0;
  let mensajesNuevosAutor = 0;
  let mensajesNuevosGanador = 0;

  if (usuarioId) {
    const result = await query<{ nombre_razon_social: string; ciudad: string | null; es_admin: boolean }>(
      "select nombre_razon_social, ciudad, es_admin from usuarios where id = $1",
      [usuarioId]
    );
    usuario = result.rows[0] ?? null;

    const [pendientes, mensajesAutor, mensajesGanador] = await Promise.all([
      query<{ total: string }>(
        `select count(*) as total
         from postulaciones po
         join publicaciones p on p.id = po.publicacion_id
         where p.autor_id = $1 and po.estado = 'pendiente' and p.estado = 'abierta'`,
        [usuarioId]
      ),
      query<{ total: string }>(
        `select count(*) as total
         from mensajes m
         join publicaciones p on p.id = m.publicacion_id
         left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
         where p.autor_id = $1 and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')`,
        [usuarioId]
      ),
      query<{ total: string }>(
        `select count(*) as total
         from mensajes m
         join publicaciones p on p.id = m.publicacion_id
         left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
         where p.ganador_id = $1 and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')`,
        [usuarioId]
      ),
    ]);
    postulantesPorRevisar = Number(pendientes.rows[0]?.total ?? 0);
    mensajesNuevosAutor = Number(mensajesAutor.rows[0]?.total ?? 0);
    mensajesNuevosGanador = Number(mensajesGanador.rows[0]?.total ?? 0);
  }

  const primerNombre = usuario?.nombre_razon_social?.split(" ")[0] ?? "";

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px 60px" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, lineHeight: 1 }}>🪟🔧</div>
        <h1 style={{ fontSize: 30, margin: "10px 0 2px", fontWeight: 800 }}>Enganche</h1>
        <p style={{ color: "#94a3b8", margin: 0, fontSize: 15 }}>
          Conecta con quien produce o instala aluminio y vidrio, cerca de ti.
        </p>
      </div>

      {usuario ? (
        <>
          <div style={saludoCaja}>
            <p style={{ margin: 0, fontSize: 15 }}>
              ¡Hola, <strong>{primerNombre}</strong>! 👋
            </p>
            {usuario.ciudad && <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>📍 {usuario.ciudad}</p>}
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <TarjetaAccion href="/feed" icono="🔍" titulo="Ver ofertas" subtitulo="Encuentra trabajo cerca de ti" color="#0f6aa8" />
            <TarjetaAccion href="/publicar" icono="📢" titulo="Publicar una oferta" subtitulo="Cuenta qué necesitas" color="#FF7F00" />
            <TarjetaAccion
              href="/mis-publicaciones"
              icono="📦"
              titulo="Mis publicaciones"
              subtitulo={
                [
                  postulantesPorRevisar > 0 ? `${postulantesPorRevisar} postulación${postulantesPorRevisar === 1 ? "" : "es"} nueva${postulantesPorRevisar === 1 ? "" : "s"}` : "",
                  mensajesNuevosAutor > 0 ? `${mensajesNuevosAutor} mensaje${mensajesNuevosAutor === 1 ? "" : "s"} nuevo${mensajesNuevosAutor === 1 ? "" : "s"}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Lo que has publicado"
              }
              color="#FFAD01"
              badge={postulantesPorRevisar + mensajesNuevosAutor > 0 ? postulantesPorRevisar + mensajesNuevosAutor : undefined}
            />
            <TarjetaAccion
              href="/postulaciones"
              icono="📋"
              titulo="Mis postulaciones"
              subtitulo={mensajesNuevosGanador > 0 ? `${mensajesNuevosGanador} mensaje${mensajesNuevosGanador === 1 ? "" : "s"} nuevo${mensajesNuevosGanador === 1 ? "" : "s"}` : "Revisa en qué vas"}
              color="#04253A"
              badge={mensajesNuevosGanador > 0 ? mensajesNuevosGanador : undefined}
            />
            {usuario.es_admin && (
              <TarjetaAccion href="/admin" icono="🛡️" titulo="Panel admin" subtitulo="Comisiones del piloto" color="#3a3a3a" />
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 22 }}>
            <CerrarSesionBoton />
          </div>
        </>
      ) : (
        <>
          <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
            <PasoItem numero={1} texto="Publica lo que necesitas o lo que ofreces" />
            <PasoItem numero={2} texto="Recibe propuestas de gente cerca de ti" />
            <PasoItem numero={3} texto="Cierra el trabajo y califica" />
          </div>

          <Link href="/entrar" style={botonPrincipal}>
            Entrar gratis
          </Link>
          <p style={{ textAlign: "center", color: "#64748b", fontSize: 12, marginTop: 8 }}>
            Solo necesitas tu celular. Sin contraseñas, sin complicaciones.
          </p>
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 32 }}>
        <Link href="/terminos" style={{ color: "#64748b", fontSize: 12 }}>
          Términos y condiciones
        </Link>
      </p>

      {usuario?.es_admin && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ color: "#475569", fontSize: 12, cursor: "pointer" }}>Diagnóstico técnico</summary>
          <ul style={{ lineHeight: 1.8, color: "#64748b", fontSize: 12 }}>
            <li>✅ Fase 0 — Esqueleto de datos (8 tablas, PostGIS, triggers)</li>
            <li>✅ Fase 1 — Auth por OTP de WhatsApp + registro de dos pasos</li>
            <li>✅ Fase 2 — Publicar + feed por cercanía (PostGIS en vivo)</li>
            <li>✅ Fase 3 — Postulación + chat</li>
            <li>✅ Fase 4 — Cierre + calificación + comisión</li>
            <li>✅ Fase 5 — Panel de comisiones (admin)</li>
          </ul>
          <HealthCheck />
        </details>
      )}
    </main>
  );
}

function TarjetaAccion({
  href,
  icono,
  titulo,
  subtitulo,
  color,
  badge,
}: {
  href: string;
  icono: string;
  titulo: string;
  subtitulo: string;
  color: string;
  badge?: number;
}) {
  return (
    <Link
      href={href}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 18px",
        borderRadius: 14,
        border: `1px solid ${badge ? "var(--color-acento-claro)" : "var(--color-borde)"}`,
        background: `linear-gradient(135deg, ${color}33, var(--color-superficie))`,
        textDecoration: "none",
        color: "#eef2f5",
      }}
    >
      <span style={{ fontSize: 26 }}>{icono}</span>
      <span>
        <span style={{ display: "block", fontSize: 16, fontWeight: 700 }}>{titulo}</span>
        <span style={{ display: "block", fontSize: 13, color: badge ? "var(--color-acento-claro)" : "#94a3b8" }}>{subtitulo}</span>
      </span>
      <span style={{ marginLeft: "auto", color: "#64748b" }}>→</span>
      {badge ? (
        <span
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            minWidth: 22,
            height: 22,
            borderRadius: "50%",
            background: "var(--color-acento-claro)",
            color: "var(--color-bg-elevado)",
            fontSize: 12,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
          }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function PasoItem({ numero, texto }: { numero: number; texto: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <span
        style={{
          flexShrink: 0,
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: "var(--color-superficie)",
          border: "1px solid var(--color-borde)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--color-azul-suave)",
        }}
      >
        {numero}
      </span>
      <p style={{ margin: 0, fontSize: 14 }}>{texto}</p>
    </div>
  );
}

const saludoCaja: CSSProperties = {
  marginTop: 22,
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid var(--color-borde)",
  background: "var(--color-superficie)",
  textAlign: "center",
};

const botonPrincipal: CSSProperties = {
  display: "block",
  marginTop: 22,
  padding: "16px 20px",
  borderRadius: 14,
  textAlign: "center",
  background: "linear-gradient(135deg, #FFAD01, #FF7F00)",
  color: "#1c1c1c",
  fontWeight: 800,
  fontSize: 16,
  textDecoration: "none",
};
