import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";
import AccionesAdmin from "./AccionesAdmin";

const ESTADO_ETIQUETA: Record<string, { texto: string; color: string }> = {
  pendiente: { texto: "Pendiente", color: "#facc15" },
  marcada_pagada: { texto: "Marcada pagada", color: "#60a5fa" },
  confirmada: { texto: "Confirmada", color: "#4ade80" },
};

type Comision = {
  id: string;
  publicacion_id: string;
  valor_comision: number;
  estado: "pendiente" | "marcada_pagada" | "confirmada";
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

  const totales = comisiones.reduce(
    (acc, c) => {
      acc[c.estado] += c.valor_comision;
      return acc;
    },
    { pendiente: 0, marcada_pagada: 0, confirmada: 0 } as Record<string, number>
  );

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" style={{ color: "#60a5fa", fontSize: 13 }}>
        ← Inicio
      </Link>

      <h1 style={{ fontSize: 24, marginTop: 14, marginBottom: 4 }}>Panel de comisiones</h1>
      <p style={{ color: "#94a3b8", marginTop: 0, fontSize: 13 }}>Solo visible para el admin.</p>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <TarjetaTotal etiqueta="Pendiente" valor={totales.pendiente} color="#facc15" />
        <TarjetaTotal etiqueta="Marcada pagada" valor={totales.marcada_pagada} color="#60a5fa" />
        <TarjetaTotal etiqueta="Confirmada" valor={totales.confirmada} color="#4ade80" />
      </div>

      <h2 style={{ fontSize: 16, marginTop: 28 }}>
        Comisiones{comisiones.length > 0 ? ` (${comisiones.length})` : ""}
      </h2>

      {comisiones.length === 0 && (
        <p style={{ color: "#94a3b8", fontSize: 13 }}>Todavía no hay comisiones generadas.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {comisiones.map((c) => {
          const estado = ESTADO_ETIQUETA[c.estado];
          return (
            <div
              key={c.id}
              style={{
                border: "1px solid #334155",
                borderRadius: 10,
                padding: "12px 14px",
                background: "#1e293b",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <Link href={`/publicaciones/${c.publicacion_id}`} style={{ fontSize: 14, fontWeight: 600, color: "#eef2f5" }}>
                    {c.sistema_o_proyecto}
                  </Link>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                    {c.ciudad} · {c.responsable_nombre} ({c.responsable_celular})
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                    Generada {formatFecha(c.creado_en)}
                    {c.confirmada_en ? ` · confirmada ${formatFecha(c.confirmada_en)}` : ""}
                  </p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
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
    </main>
  );
}

function TarjetaTotal({ etiqueta, valor, color }: { etiqueta: string; valor: number; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 140, border: "1px solid #334155", borderRadius: 10, padding: "10px 12px", background: "#1e293b" }}>
      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>{etiqueta}</p>
      <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, color }}>{formatCOP(valor)}</p>
    </div>
  );
}
