import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";
import AccionesAdmin from "./AccionesAdmin";
import AccionesAdminUrgente from "./AccionesAdminUrgente";

const ESTADO_URGENTE_ETIQUETA: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Pendiente", color: "var(--color-acento-claro)" },
  confirmada: { texto: "Confirmada", color: "#15803d" },
  rechazada: { texto: "Rechazada", color: "#dc2626" },
};

type Urgente = {
  id: string;
  publicacion_id: string;
  valor: number;
  estado: "pendiente" | "confirmada" | "rechazada";
  creado_en: string;
  sistema_o_proyecto: string;
  ciudad: string;
  solicitante_nombre: string;
  solicitante_celular: string;
};

const ESTADO_ETIQUETA: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Pendiente", color: "var(--color-acento-claro)" },
  marcada_pagada: { texto: "Marcada pagada", color: "var(--color-azul-suave)" },
  confirmada: { texto: "Confirmada", color: "#15803d" },
  rechazada: { texto: "Rechazada", color: "#dc2626" },
};

type Comision = {
  id: string;
  publicacion_id: string;
  valor_comision: number;
  estado: "pendiente" | "marcada_pagada" | "confirmada" | "rechazada";
  creado_en: string;
  confirmada_en: string | null;
  sistema_o_proyecto: string;
  ciudad: string;
  responsable_nombre: string;
  responsable_celular: string;
};

export default async function AdminComisiones() {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    redirect("/");
  }

  const result = await query<Comision>(
    `select
       c.id, c.publicacion_id, c.valor_comision, c.estado, c.creado_en, c.confirmada_en,
       p.sistema_o_proyecto, p.ciudad,
       u.nombre_razon_social as responsable_nombre, u.celular as responsable_celular
     from comisiones c
     join publicaciones p on p.id = c.publicacion_id
     join usuarios u on u.id = c.responsable_pago_id
     order by c.creado_en desc`
  );
  const comisiones = result.rows;

  const urgentesResult = await query<Urgente>(
    `select
       u2.id, u2.publicacion_id, u2.valor, u2.estado, u2.creado_en,
       p.sistema_o_proyecto, p.ciudad,
       u.nombre_razon_social as solicitante_nombre, u.celular as solicitante_celular
     from impulsos_urgentes u2
     join publicaciones p on p.id = u2.publicacion_id
     join usuarios u on u.id = u2.solicitado_por_id
     order by u2.creado_en desc`
  );
  const urgentes = urgentesResult.rows;

  const totales = comisiones.reduce(
    (acc, c) => {
      acc[c.estado] += c.valor_comision;
      return acc;
    },
    { pendiente: 0, marcada_pagada: 0, confirmada: 0, rechazada: 0 } as Record<string, number>
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>

      <h1 className="titular" style={{ fontSize: 26, marginTop: 14, marginBottom: 4, fontWeight: 700 }}>Panel de comisiones</h1>
      <p style={{ color: "var(--color-mist)", marginTop: 0, fontSize: 13 }}>Solo visible para el admin.</p>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <TarjetaTotal etiqueta="Pendiente" valor={totales.pendiente} color="var(--color-acento-claro)" />
        <TarjetaTotal etiqueta="Marcada pagada" valor={totales.marcada_pagada} color="var(--color-azul-suave)" />
        <TarjetaTotal etiqueta="Confirmada" valor={totales.confirmada} color="#15803d" />
        <TarjetaTotal etiqueta="Rechazada" valor={totales.rechazada} color="#dc2626" />
      </div>

      <h2 style={{ fontSize: 16, marginTop: 28 }}>
        Comisiones{comisiones.length > 0 ? ` (${comisiones.length})` : ""}
      </h2>

      {comisiones.length === 0 && (
        <p style={{ color: "var(--color-mist)", fontSize: 13 }}>Todavía no hay comisiones generadas.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {comisiones.map((c) => {
          const estado = ESTADO_ETIQUETA[c.estado];
          return (
            <div key={c.id} className="panel" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <Link href={`/publicaciones/${c.publicacion_id}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--color-texto)" }}>
                    {c.sistema_o_proyecto}
                  </Link>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-mist)" }}>
                    {c.ciudad} · {c.responsable_nombre} ({c.responsable_celular})
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-mist-tenue)" }}>
                    Generada {formatFecha(c.creado_en)}
                    {c.confirmada_en ? ` · confirmada ${formatFecha(c.confirmada_en)}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>
                    {c.valor_comision === 0 ? "Gratis" : formatCOP(c.valor_comision)}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</p>
                </div>
              </div>
              {c.estado === "marcada_pagada" && <AccionesAdmin comisionId={c.id} />}
            </div>
          );
        })}
      </div>

      <h2 style={{ fontSize: 16, marginTop: 28 }}>
        Solicitudes de "Urgente"{urgentes.length > 0 ? ` (${urgentes.length})` : ""}
      </h2>

      {urgentes.length === 0 && (
        <p style={{ color: "var(--color-mist)", fontSize: 13 }}>Todavía no hay solicitudes de urgente.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {urgentes.map((u) => {
          const estado = ESTADO_URGENTE_ETIQUETA[u.estado];
          return (
            <div key={u.id} className="panel" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <Link href={`/publicaciones/${u.publicacion_id}`} style={{ fontSize: 14, fontWeight: 600, color: "var(--color-texto)" }}>
                    🚨 {u.sistema_o_proyecto}
                  </Link>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--color-mist)" }}>
                    {u.ciudad} · {u.solicitante_nombre} ({u.solicitante_celular})
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-mist-tenue)" }}>
                    Solicitada {formatFecha(u.creado_en)}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)" }}>{formatCOP(u.valor)}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, fontWeight: 700, color: estado.color }}>{estado.texto}</p>
                </div>
              </div>
              {u.estado === "pendiente" && <AccionesAdminUrgente impulsoId={u.id} />}
            </div>
          );
        })}
      </div>
    </main>
  );
}

function TarjetaTotal({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  return (
    <div className="panel" style={{ flex: 1, minWidth: 140, padding: "10px 12px" }}>
      <p style={{ margin: 0, fontSize: 11, color: "var(--color-mist)" }}>{etiqueta}</p>
      <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{formatCOP(valor)}</p>
    </div>
  );
}
