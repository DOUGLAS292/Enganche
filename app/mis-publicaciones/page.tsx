import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";

const ESTADO_ETIQUETA: Record<string, { texto: string; color: string }> = {
  abierta: { texto: "Abierta", color: "#4ade80" },
  en_proceso: { texto: "Enganchada", color: "var(--color-azul-suave)" },
  completada: { texto: "Completada", color: "#94a3b8" },
  cancelada: { texto: "Cancelada", color: "#f87171" },
};

type Fila = {
  id: string;
  sistema_o_proyecto: string;
  ciudad: string;
  valor_ofertado: number;
  estado: string;
  creado_en: string;
  postulantes_pendientes: number;
  postulantes_total: number;
  mensajes_nuevos: number;
};

export default async function MisPublicacionesPage() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const result = await query<Fila>(
    `select
       p.id, p.sistema_o_proyecto, p.ciudad, p.valor_ofertado, p.estado, p.creado_en,
       count(distinct po.id) filter (where po.estado = 'pendiente') as postulantes_pendientes,
       count(distinct po.id) as postulantes_total,
       count(distinct m.id) filter (
         where p.ganador_id is not null and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')
       ) as mensajes_nuevos
     from publicaciones p
     left join postulaciones po on po.publicacion_id = p.id
     left join mensajes m on m.publicacion_id = p.id
     left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
     where p.autor_id = $1
     group by p.id
     order by
       (count(distinct po.id) filter (where po.estado = 'pendiente') > 0 and p.estado = 'abierta') desc,
       p.creado_en desc`,
    [usuarioId]
  );

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>
      <h1 className="titular" style={{ fontSize: 26, marginTop: 14, fontWeight: 700 }}>Mis publicaciones</h1>

      {result.rows.length === 0 && (
        <p style={{ color: "var(--color-mist)", marginTop: 16 }}>
          Todavía no has publicado ninguna oferta.{" "}
          <Link href="/publicar" style={{ color: "var(--color-azul-suave)" }}>
            Publica la primera
          </Link>
          .
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {result.rows.map((p) => {
          const estado = ESTADO_ETIQUETA[p.estado] ?? { texto: p.estado, color: "#94a3b8" };
          const hayNuevas = (p.postulantes_pendientes > 0 && p.estado === "abierta") || p.mensajes_nuevos > 0;
          return (
            <Link key={p.id} href={`/publicaciones/${p.id}`} className={`panel${hayNuevas ? " alerta" : ""}`} style={{ padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</span>
                <span style={{ fontSize: 12, color: "var(--color-mist-tenue)" }}>{formatFecha(p.creado_en)}</span>
              </div>
              <h3 style={{ margin: "8px 0 2px", fontSize: 16 }}>{p.sistema_o_proyecto}</h3>
              <p style={{ margin: 0, fontSize: 12, color: "var(--color-mist)" }}>{p.ciudad}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-acento-claro)" }}>{formatCOP(p.valor_ofertado)}</p>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: hayNuevas ? 700 : 400,
                    color: hayNuevas ? "var(--color-acento-claro)" : "var(--color-mist)",
                    textAlign: "right",
                  }}
                >
                  {p.mensajes_nuevos > 0 && `🔔 ${p.mensajes_nuevos} mensaje${p.mensajes_nuevos === 1 ? "" : "s"} nuevo${p.mensajes_nuevos === 1 ? "" : "s"}`}
                  {p.mensajes_nuevos > 0 && p.postulantes_total > 0 && " · "}
                  {p.postulantes_total > 0 &&
                    `${p.postulantes_pendientes > 0 && p.estado === "abierta" ? "🔔 " : ""}${p.postulantes_total} postulante${p.postulantes_total === 1 ? "" : "s"}${p.postulantes_pendientes > 0 && p.estado === "abierta" ? ` · ${p.postulantes_pendientes} por revisar` : ""}`}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
