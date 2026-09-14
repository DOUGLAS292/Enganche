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
  elegida: { texto: "¡Elegido!", color: "#4ade80" },
  rechazada: { texto: "No elegido", color: "#94a3b8" },
};

type Fila = {
  id: string;
  nivel_sistema: string;
  sistema_o_proyecto: string;
  ciudad: string;
  valor_ofertado: number;
  estado_postulacion: string;
  creado_en: string;
  mensajes_nuevos: number;
};

export default async function MisPostulacionesPage() {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const result = await query<Fila>(
    `select
       p.id, p.nivel_sistema, p.sistema_o_proyecto, p.ciudad, p.valor_ofertado,
       po.estado as estado_postulacion, po.creado_en,
       count(m.id) filter (
         where po.estado = 'elegida' and m.emisor_id != $1 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')
       ) as mensajes_nuevos
     from postulaciones po
     join publicaciones p on p.id = po.publicacion_id
     left join mensajes m on m.publicacion_id = p.id
     left join mensajes_leidos ml on ml.usuario_id = $1 and ml.publicacion_id = p.id
     where po.postulante_id = $1
     group by po.id, p.id
     order by po.creado_en desc`,
    [usuarioId]
  );

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" style={{ color: "var(--color-azul-suave)", fontSize: 13 }}>
        ← Inicio
      </Link>
      <h1 style={{ fontSize: 24, marginTop: 14 }}>Mis postulaciones</h1>

      {result.rows.length === 0 && (
        <p style={{ color: "#94a3b8", marginTop: 16 }}>
          Aún no te has postulado a ninguna oferta.{" "}
          <Link href="/feed" style={{ color: "var(--color-azul-suave)" }}>
            Explora el feed
          </Link>
          .
        </p>
      )}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {result.rows.map((p) => {
          const estado = ESTADO_POSTULACION[p.estado_postulacion] ?? { texto: p.estado_postulacion, color: "#94a3b8" };
          const hayMensajes = p.mensajes_nuevos > 0;
          return (
            <Link key={p.id} href={`/publicaciones/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <article
                style={{
                  border: `1px solid ${hayMensajes ? "var(--color-acento-claro)" : "var(--color-borde)"}`,
                  borderRadius: 10,
                  padding: "12px 14px",
                  background: "var(--color-superficie)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</span>
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>{formatFecha(p.creado_en)}</span>
                </div>
                <h3 style={{ margin: "6px 0 2px", fontSize: 16 }}>{p.sistema_o_proyecto}</h3>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8" }}>
                  {NIVEL_ETIQUETA[p.nivel_sistema]} · {p.ciudad}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{formatCOP(p.valor_ofertado)}</p>
                  {hayMensajes && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-acento-claro)" }}>
                      🔔 {p.mensajes_nuevos} mensaje{p.mensajes_nuevos === 1 ? "" : "s"} nuevo{p.mensajes_nuevos === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </article>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
