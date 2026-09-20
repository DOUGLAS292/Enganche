import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";

const NIVEL_ETIQUETA: Record<string, string> = {
  tradicional: "Nivel 1",
  superior: "Nivel 2",
  especializada: "Nivel 3",
};

const ESTADO_POSTULACION: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Pendiente", color: "var(--color-acento-claro)" },
  elegida: { texto: "¡Elegido!", color: "#15803d" },
  rechazada: { texto: "No elegido", color: "#475569" },
};

type Fila = {
  id: string;
  nivel_sistema: string;
  sistema_o_proyecto: string;
  ciudad: string;
  valor_ofertado: number;
  estado_publicacion: string;
  estado_postulacion: string;
  creado_en: string;
  mensajes_nuevos: number;
  notificado: boolean;
  comision_estado: string | null;
  comision_valor: number | null;
};

export default async function MisPostulacionesPage() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const result = await query<Fila>(
    `select
       p.id, p.nivel_sistema, p.sistema_o_proyecto, p.ciudad, p.valor_ofertado,
       p.estado as estado_publicacion, po.estado as estado_postulacion, po.creado_en, po.notificado,
       count(m.id) filter (
         where po.estado = 'elegida' and m.ganador_id = p.ganador_id
           and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')
       ) as mensajes_nuevos,
       c.estado as comision_estado, c.valor_comision as comision_valor
     from postulaciones po
     join publicaciones p on p.id = po.publicacion_id
     left join mensajes m on m.publicacion_id = p.id
     left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
     left join comisiones c on c.publicacion_id = p.id and c.responsable_pago_id = $1
     where po.postulante_id = $1
     group by po.id, p.id, c.id
     order by (po.notificado = false) desc, po.creado_en desc`,
    [usuarioId]
  );

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>
      <h1 className="titular" style={{ fontSize: 26, marginTop: 14, fontWeight: 700 }}>Mis postulaciones</h1>

      {result.rows.length === 0 && (
        <p style={{ color: "var(--color-mist)", marginTop: 16 }}>
          Aún no te has postulado a ninguna oferta.{" "}
          <Link href="/feed" style={{ color: "var(--color-azul-suave)" }}>
            Explora el feed
          </Link>
          .
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {result.rows.map((p) => {
          // Si sigo "pendiente" pero la oferta ya no está abierta, es que
          // ya eligieron a alguien más (o se canceló/expiró) — no me lo
          // marcan como "rechazada" de una porque, si se reabre, sigo en
          // la lista de candidatos. Pero mostrar "Pendiente" ahí engaña:
          // hay que avisar que ya no hay nada por decidir por ahora.
          const estado =
            p.estado_postulacion === "pendiente" && p.estado_publicacion !== "abierta"
              ? {
                  texto:
                    p.estado_publicacion === "en_proceso"
                      ? "Otro fue elegido"
                      : p.estado_publicacion === "completada"
                        ? "Oferta ya completada"
                        : p.estado_publicacion === "cancelada"
                          ? "Oferta cancelada"
                          : "Oferta expirada",
                  color: "#475569",
                }
              : (ESTADO_POSTULACION[p.estado_postulacion] ?? { texto: p.estado_postulacion, color: "#475569" });
          const hayMensajes = p.mensajes_nuevos > 0;
          const hayNovedad = !p.notificado;
          const comisionPendiente =
            (p.comision_estado === "pendiente" || p.comision_estado === "rechazada") && (p.comision_valor ?? 0) > 0;
          const textoNovedad =
            p.estado_postulacion === "elegida"
              ? "🔔 ¡Fuiste elegido!"
              : p.estado_postulacion === "rechazada"
                ? "🔔 Se reabrió la oferta"
                : "";
          const enganchada = p.estado_publicacion === "en_proceso";
          return (
            <Link
              key={p.id}
              href={`/publicaciones/${p.id}`}
              className={`panel${!enganchada && (hayNovedad || hayMensajes || comisionPendiente) ? " alerta" : ""}`}
              style={{
                padding: "14px 16px",
                ...(enganchada
                  ? {
                      borderColor: "var(--color-azul-suave)",
                      background:
                        "linear-gradient(160deg, rgba(47, 118, 163, 0.16), rgba(47, 118, 163, 0.03) 60%), var(--color-superficie)",
                    }
                  : {}),
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</span>
                <span style={{ fontSize: 12, color: "var(--color-mist-tenue)" }}>{formatFecha(p.creado_en)}</span>
              </div>
              <h3 style={{ margin: "8px 0 2px", fontSize: 16 }}>{p.sistema_o_proyecto}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-mist)" }}>
                {NIVEL_ETIQUETA[p.nivel_sistema]} · {p.ciudad}
              </p>
              {comisionPendiente && (
                <p style={{ margin: "6px 0 0", fontSize: 12, fontWeight: 700, color: "#dc2626" }}>
                  {p.comision_estado === "rechazada" ? "❌ Pago rechazado" : "💳 Debes pagar comisión"}: {formatCOP(p.comision_valor ?? 0)}
                </p>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-acento-claro)" }}>{formatCOP(p.valor_ofertado)}</p>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-acento-claro)" }}>
                  {hayNovedad && textoNovedad}
                  {hayNovedad && hayMensajes && " · "}
                  {hayMensajes && `🔔 ${p.mensajes_nuevos} mensaje${p.mensajes_nuevos === 1 ? "" : "s"} nuevo${p.mensajes_nuevos === 1 ? "" : "s"}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
