import Link from "next/link";
import type { CSSProperties } from "react";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { formatCOP } from "@/lib/format";
import HealthCheck from "./HealthCheck";
import CerrarSesionBoton from "./CerrarSesionBoton";

export default async function Home() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  let usuario: { nombre_razon_social: string; ciudad: string | null; es_admin: boolean } | null = null;
  let postulantesPorRevisar = 0;
  let mensajesNuevosAutor = 0;
  let mensajesNuevosGanador = 0;
  let postulacionesSinVer = 0;
  let deudaComision: { publicacionId: string; sistemaOProyecto: string; total: number; cantidad: number; bloqueado: boolean } | null = null;

  if (usuarioId) {
    const result = await query<{ nombre_razon_social: string; ciudad: string | null; es_admin: boolean }>(
      "select nombre_razon_social, ciudad, es_admin from usuarios where id = $1",
      [usuarioId]
    );
    usuario = result.rows[0] ?? null;

    const [pendientes, mensajesAutor, mensajesGanador, sinVer, comisionesDeuda] = await Promise.all([
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
         where p.autor_id = $1 and p.ganador_id is not null and m.ganador_id = p.ganador_id
           and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')`,
        [usuarioId]
      ),
      query<{ total: string }>(
        `select count(*) as total
         from mensajes m
         join publicaciones p on p.id = m.publicacion_id
         left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
         where p.ganador_id = $1 and m.ganador_id = p.ganador_id
           and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')`,
        [usuarioId]
      ),
      query<{ total: string }>(
        "select count(*) as total from postulaciones where postulante_id = $1 and notificado = false",
        [usuarioId]
      ),
      query<{ publicacion_id: string; sistema_o_proyecto: string; valor_comision: number; estado: string; creado_en: string }>(
        `select c.publicacion_id, p.sistema_o_proyecto, c.valor_comision, c.estado, c.creado_en
         from comisiones c
         join publicaciones p on p.id = c.publicacion_id
         where c.responsable_pago_id = $1 and c.estado in ('pendiente', 'rechazada') and c.valor_comision > 0
         order by c.creado_en asc`,
        [usuarioId]
      ),
    ]);
    postulantesPorRevisar = Number(pendientes.rows[0]?.total ?? 0);
    mensajesNuevosAutor = Number(mensajesAutor.rows[0]?.total ?? 0);
    mensajesNuevosGanador = Number(mensajesGanador.rows[0]?.total ?? 0);
    postulacionesSinVer = Number(sinVer.rows[0]?.total ?? 0);

    if (comisionesDeuda.rows.length > 0) {
      const total = comisionesDeuda.rows.reduce((acc, c) => acc + Number(c.valor_comision), 0);
      const bloqueado = comisionesDeuda.rows.some(
        (c) => c.estado === "rechazada" || Date.now() - new Date(c.creado_en).getTime() >= 7 * 24 * 60 * 60 * 1000
      );
      const primera = comisionesDeuda.rows[0];
      deudaComision = {
        publicacionId: primera.publicacion_id,
        sistemaOProyecto: primera.sistema_o_proyecto,
        total,
        cantidad: comisionesDeuda.rows.length,
        bloqueado,
      };
    }
  }

  const primerNombre = usuario?.nombre_razon_social?.split(" ")[0] ?? "";

  return (
    <main className="reticula" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 20px 60px" }}>
      <div style={{ textAlign: "center" }}>
        <span className="chip-tecnico">Sistemas de aluminio y vidrio</span>
        <h1 className="titular" style={{ fontSize: 42, margin: "16px 0 4px" }}>Enganche</h1>
        <p style={{ color: "var(--color-mist)", margin: 0, fontSize: 15 }}>
          Conecta con quien produce o instala aluminio y vidrio, cerca de ti.
        </p>
      </div>

      {usuario ? (
        <>
          {deudaComision && (
            <Link
              href={`/publicaciones/${deudaComision.publicacionId}`}
              className="panel"
              style={{
                display: "block",
                marginTop: 22,
                padding: "14px 16px",
                borderColor: deudaComision.bloqueado ? "#f87171" : "var(--color-acento-claro)",
                background: deudaComision.bloqueado ? "rgba(248, 113, 113, 0.08)" : "rgba(251, 191, 36, 0.08)",
              }}
            >
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: deudaComision.bloqueado ? "#f87171" : "var(--color-acento-claro)" }}>
                {deudaComision.bloqueado ? "🚫 No puedes postularte a ofertas nuevas" : "⚠️ Tienes comisión pendiente de pago"}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-mist)" }}>
                Debes {formatCOP(deudaComision.total)}
                {deudaComision.cantidad > 1 ? ` en ${deudaComision.cantidad} comisiones` : ` de "${deudaComision.sistemaOProyecto}"`}.
                {deudaComision.bloqueado
                  ? " Estás perdiendo trabajos nuevos hasta que pagues."
                  : " Págala pronto para no perder acceso a ofertas nuevas."}
              </p>
            </Link>
          )}

          <div style={saludoCaja}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>¡Hola, {primerNombre}! 👋</p>
            {usuario.ciudad && (
              <span className="chip-tecnico" style={{ marginTop: 10, display: "inline-block" }}>
                📍 {usuario.ciudad.toUpperCase()}
              </span>
            )}
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            <TarjetaAccion href="/feed" icono="🔍" titulo="Ver ofertas" subtitulo="Encuentra trabajo cerca de ti" />
            <TarjetaAccion href="/publicar" icono="📢" titulo="Publicar una oferta" subtitulo="Cuenta qué necesitas" />
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
              badge={postulantesPorRevisar + mensajesNuevosAutor > 0 ? postulantesPorRevisar + mensajesNuevosAutor : undefined}
            />
            <TarjetaAccion
              href="/postulaciones"
              icono="📋"
              titulo="Mis postulaciones"
              subtitulo={
                [
                  postulacionesSinVer > 0 ? `${postulacionesSinVer} novedad${postulacionesSinVer === 1 ? "" : "es"}` : "",
                  mensajesNuevosGanador > 0 ? `${mensajesNuevosGanador} mensaje${mensajesNuevosGanador === 1 ? "" : "s"} nuevo${mensajesNuevosGanador === 1 ? "" : "s"}` : "",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Revisa en qué vas"
              }
              badge={postulacionesSinVer + mensajesNuevosGanador > 0 ? postulacionesSinVer + mensajesNuevosGanador : undefined}
            />
            <TarjetaAccion href={`/perfil/${usuarioId}`} icono="⭐" titulo="Mi perfil" subtitulo="Tu reputación en el gremio" />
            {usuario.es_admin && (
              <TarjetaAccion href="/admin" icono="🛡️" titulo="Panel admin" subtitulo="Comisiones del piloto" />
            )}
          </div>

          <div style={{ textAlign: "center", marginTop: 24 }}>
            <CerrarSesionBoton />
          </div>
        </>
      ) : (
        <>
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 12 }}>
            <PasoItem numero={1} texto="Publica lo que necesitas o lo que ofreces" />
            <PasoItem numero={2} texto="Recibe propuestas de gente cerca de ti" />
            <PasoItem numero={3} texto="Cierra el trabajo y califica" />
          </div>

          <Link href="/entrar" className="boton-primario" style={{ display: "block", marginTop: 24, padding: "16px 20px", borderRadius: 14, fontSize: 16 }}>
            Entrar gratis
          </Link>
          <p style={{ textAlign: "center", color: "var(--color-mist-tenue)", fontSize: 12, marginTop: 8 }}>
            Solo necesitas tu celular. Sin contraseñas, sin complicaciones.
          </p>
        </>
      )}

      <p style={{ textAlign: "center", marginTop: 36 }}>
        <Link href="/terminos" style={{ color: "var(--color-mist-tenue)", fontSize: 12 }}>
          Términos y condiciones
        </Link>
        {" · "}
        <Link href="/privacidad" style={{ color: "var(--color-mist-tenue)", fontSize: 12 }}>
          Política de privacidad
        </Link>
      </p>

      {usuario?.es_admin && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ color: "var(--color-mist-tenue)", fontSize: 12, cursor: "pointer" }}>Diagnóstico técnico</summary>
          <ul style={{ lineHeight: 1.8, color: "var(--color-mist-tenue)", fontSize: 12 }}>
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
  badge,
}: {
  href: string;
  icono: string;
  titulo: string;
  subtitulo: string;
  badge?: number;
}) {
  return (
    <Link href={href} className={`panel${badge ? " alerta" : ""}`} style={{ display: "flex", alignItems: "center", gap: 14, padding: "15px 16px" }}>
      <div className="icono-marco">{icono}</div>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 15, fontWeight: 700 }}>{titulo}</span>
        <span style={{ display: "block", fontSize: 12.5, marginTop: 2, color: badge ? "var(--color-acento-claro)" : "var(--color-mist)" }}>
          {subtitulo}
        </span>
      </span>
      <span style={{ color: "var(--color-mist-tenue)", fontSize: 15, flexShrink: 0 }}>→</span>
      {badge ? <span className="insignia-brillo">{badge}</span> : null}
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
          fontFamily: "var(--font-mono)",
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
