import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";
import AccionesAutor from "./AccionesAutor";
import AccionPostulante from "./AccionPostulante";
import AccionesCompletada from "./AccionesCompletada";

const NIVEL_ETIQUETA: Record<string, string> = {
  tradicional: "Nivel 1 · Tradicional",
  superior: "Nivel 2 · Superior",
  especializada: "Nivel 3 · Especializada",
};

const ESTADO_ETIQUETA: Record<string, { texto: string; color: string }> = {
  abierta: { texto: "Abierta", color: "#4ade80" },
  en_proceso: { texto: "En proceso", color: "#60a5fa" },
  completada: { texto: "Completada", color: "#94a3b8" },
  cancelada: { texto: "Cancelada", color: "#f87171" },
};

type Publicacion = {
  id: string;
  tipo_trabajo: string;
  nivel_sistema: string;
  sistema_o_proyecto: string;
  cantidad: string;
  valor_ofertado: number;
  ciudad: string;
  region: string | null;
  estado: string;
  creado_en: string;
  autor_id: string;
  ganador_id: string | null;
  autor_nombre: string;
  autor_rating: number | null;
  autor_trabajos: number;
  autor_verificado: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  requiere_seguridad: boolean;
  mtr2: string | null;
};

type Postulante = {
  postulante_id: string;
  estado: "pendiente" | "elegida" | "rechazada";
  nombre_razon_social: string;
  ciudad: string | null;
  rating_promedio: number | null;
  trabajos_completados: number;
  verificado: boolean;
};

export default async function PublicacionDetalle({ params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const { id } = await params;
  const result = await query<Publicacion>(
    `select
       p.id, p.tipo_trabajo, p.nivel_sistema, p.sistema_o_proyecto, p.cantidad,
       p.valor_ofertado, p.ciudad, p.region, p.estado, p.creado_en,
       p.autor_id, p.ganador_id, p.fecha_inicio, p.fecha_fin, p.requiere_seguridad, p.mtr2,
       u.nombre_razon_social as autor_nombre, u.rating_promedio as autor_rating,
       u.trabajos_completados as autor_trabajos, u.verificado as autor_verificado
     from publicaciones p
     join usuarios u on u.id = p.autor_id
     where p.id = $1`,
    [id]
  );

  const publicacion = result.rows[0];
  if (!publicacion) {
    notFound();
  }

  const esAutor = publicacion.autor_id === usuarioId;
  const esGanador = publicacion.ganador_id === usuarioId;

  let postulantes: Postulante[] = [];
  let miPostulacion: { estado: string } | null = null;

  if (esAutor) {
    const r = await query<Postulante>(
      `select
         po.postulante_id, po.estado, u.nombre_razon_social, u.ciudad,
         u.rating_promedio, u.trabajos_completados, u.verificado
       from postulaciones po
       join usuarios u on u.id = po.postulante_id
       where po.publicacion_id = $1
       order by po.creado_en asc`,
      [id]
    );
    postulantes = r.rows;
  } else if (!esGanador) {
    const r = await query<{ estado: string }>(
      "select estado from postulaciones where publicacion_id = $1 and postulante_id = $2",
      [id, usuarioId]
    );
    miPostulacion = r.rows[0] ?? null;
  }

  let comision: { valor_comision: number; estado: string } | null = null;
  let yaCalifique = false;
  let garantias: { id: string; descripcion: string; estado: "abierto" | "atendido" | "no_atendido"; fecha_reporte: string }[] = [];

  if ((esAutor || esGanador) && publicacion.estado === "completada") {
    const [rComision, rCalifique, rGarantias] = await Promise.all([
      query<{ valor_comision: number; estado: string }>(
        "select valor_comision, estado from comisiones where publicacion_id = $1",
        [id]
      ),
      query("select 1 from calificaciones where publicacion_id = $1 and calificador_id = $2", [id, usuarioId]),
      query<{ id: string; descripcion: string; estado: "abierto" | "atendido" | "no_atendido"; fecha_reporte: string }>(
        "select id, descripcion, estado, fecha_reporte from garantias where publicacion_id = $1 order by fecha_reporte desc",
        [id]
      ),
    ]);
    comision = rComision.rows[0] ?? null;
    yaCalifique = rCalifique.rows.length > 0;
    garantias = rGarantias.rows;
  }

  const estadoEtiqueta = ESTADO_ETIQUETA[publicacion.estado] ?? { texto: publicacion.estado, color: "#94a3b8" };

  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/feed" style={{ color: "#60a5fa", fontSize: 13 }}>
        ← Volver a ofertas
      </Link>

      <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={badgeStyle(publicacion.tipo_trabajo === "instalacion" ? "#1c5079" : "#bd5a26")}>
          {publicacion.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"}
        </span>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{NIVEL_ETIQUETA[publicacion.nivel_sistema]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: estadoEtiqueta.color }}>{estadoEtiqueta.texto}</span>
      </div>

      <h1 style={{ fontSize: 24, marginBottom: 4 }}>{publicacion.sistema_o_proyecto}</h1>
      <p style={{ color: "#94a3b8", marginTop: 0 }}>
        {publicacion.ciudad}
        {publicacion.region ? ` · ${publicacion.region}` : ""}
      </p>

      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b" }}>
        <Fila
          etiqueta="Cantidad"
          valor={/^\d+$/.test(publicacion.cantidad) ? `${publicacion.cantidad} producto${publicacion.cantidad === "1" ? "" : "s"}` : publicacion.cantidad}
        />
        {publicacion.mtr2 && <Fila etiqueta="Área" valor={`${publicacion.mtr2} m²`} />}
        <Fila etiqueta="Valor ofertado" valor={formatCOP(publicacion.valor_ofertado)} />
        {publicacion.fecha_inicio && (
          <Fila
            etiqueta="Fechas"
            valor={`${formatFecha(publicacion.fecha_inicio)}${publicacion.fecha_fin ? ` → ${formatFecha(publicacion.fecha_fin)}` : ""}`}
          />
        )}
        <Fila etiqueta="Requiere seguridad" valor={publicacion.requiere_seguridad ? "Sí" : "No"} />
        <Fila etiqueta="Publicada" valor={formatFecha(publicacion.creado_en)} />
      </div>

      <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Publicada por</p>
        <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 600 }}>
          {publicacion.autor_nombre}
          {publicacion.autor_verificado ? " ✓ verificado" : ""}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "#94a3b8" }}>
          {publicacion.autor_trabajos} trabajos completados
          {publicacion.autor_rating ? ` · ★ ${publicacion.autor_rating}` : " · sin calificaciones aún"}
        </p>
      </div>

      {esAutor && (
        <AccionesAutor publicacionId={publicacion.id} estadoPublicacion={publicacion.estado} postulantesIniciales={postulantes} />
      )}

      {!esAutor && esGanador && (
        <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, border: "1px solid #4ade80" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#4ade80" }}>¡Fuiste elegido para este trabajo!</p>
          <Link href={`/publicaciones/${publicacion.id}/chat`} style={{ color: "#4ade80", textDecoration: "underline", fontSize: 13 }}>
            Ir al chat con quien publicó
          </Link>
        </div>
      )}

      {(esAutor || esGanador) && publicacion.estado === "completada" && (
        <AccionesCompletada
          publicacionId={publicacion.id}
          soyAutor={esAutor}
          soyGanador={esGanador}
          comisionInicial={comision}
          yaCalifique={yaCalifique}
          garantiasIniciales={garantias}
        />
      )}

      {!esAutor && !esGanador && (
        <>
          {miPostulacion ? (
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8, border: "1px dashed #475569", color: "#94a3b8", fontSize: 13 }}>
              {miPostulacion.estado === "pendiente" && "Ya te postulaste — pendiente de que el autor elija."}
              {miPostulacion.estado === "rechazada" && "No fuiste el elegido esta vez."}
            </div>
          ) : publicacion.estado === "abierta" ? (
            <AccionPostulante publicacionId={publicacion.id} />
          ) : (
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 8, border: "1px dashed #475569", color: "#94a3b8", fontSize: 13 }}>
              Esta oferta ya no está abierta para postularse.
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
      <span style={{ color: "#94a3b8" }}>{etiqueta}</span>
      <span>{valor}</span>
    </div>
  );
}

function badgeStyle(color: string): CSSProperties {
  return { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: color, color: "#fff" };
}
