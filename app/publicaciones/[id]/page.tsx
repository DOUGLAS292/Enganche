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
  en_proceso: { texto: "Enganchada", color: "var(--color-azul-suave)" },
  completada: { texto: "Completada", color: "#94a3b8" },
  cancelada: { texto: "Cancelada", color: "#f87171" },
  expirada: { texto: "Expirada", color: "#eab308" },
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
  lugar_fabricacion: "instalaciones_ofertante" | "taller_postulante" | null;
};

const LUGAR_FABRICACION_ETIQUETA: Record<string, string> = {
  instalaciones_ofertante: "En instalaciones del autor",
  taller_postulante: "El postulante debe tener taller propio",
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
       p.autor_id, p.ganador_id, p.fecha_inicio, p.fecha_fin, p.requiere_seguridad, p.mtr2, p.lugar_fabricacion,
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

  if (!esAutor && (esGanador || miPostulacion)) {
    // Ver el detalle es lo que hace desaparecer el aviso de "fuiste elegido"
    // o "se reabrió la oferta" en el resto de la app.
    await query(
      "update postulaciones set notificado = true where publicacion_id = $1 and postulante_id = $2 and notificado = false",
      [id, usuarioId]
    );
  }

  let comision: { valor_comision: number; estado: string } | null = null;
  let yaCalifique = false;
  let garantias: { id: string; descripcion: string; estado: "abierto" | "atendido" | "no_atendido"; fecha_reporte: string }[] = [];
  let mensajesNuevos = 0;

  if ((esAutor || esGanador) && publicacion.ganador_id) {
    const r = await query<{ total: string }>(
      `select count(*) as total
       from mensajes m
       left join mensajes_leidos ml on ml.usuario_id = $2 and ml.publicacion_id = m.publicacion_id
       where m.publicacion_id = $1 and m.ganador_id = $3
         and m.emisor_id != $2 and m.creado_en > coalesce(ml.leido_hasta, '-infinity')`,
      [id, usuarioId, publicacion.ganador_id]
    );
    mensajesNuevos = Number(r.rows[0]?.total ?? 0);
  }

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
      <Link href="/feed" className="enlace-volver">
        ← Volver a ofertas
      </Link>

      <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span style={badgeStyle(publicacion.tipo_trabajo === "instalacion" ? "#1c5079" : "#bd5a26")}>
          {publicacion.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"}
        </span>
        <span className="chip-tecnico" style={{ color: "var(--color-mist)" }}>{NIVEL_ETIQUETA[publicacion.nivel_sistema]}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: estadoEtiqueta.color }}>{estadoEtiqueta.texto}</span>
      </div>

      <h1 className="titular" style={{ fontSize: 25, marginBottom: 4, marginTop: 14 }}>{publicacion.sistema_o_proyecto}</h1>
      <p style={{ color: "var(--color-mist)", marginTop: 0 }}>
        {publicacion.ciudad}
        {publicacion.region ? ` · ${publicacion.region}` : ""}
      </p>

      <div className="panel" style={{ marginTop: 16, padding: "14px 16px" }}>
        <Fila
          etiqueta="Cantidad"
          valor={/^\d+$/.test(publicacion.cantidad) ? `${publicacion.cantidad} producto${publicacion.cantidad === "1" ? "" : "s"}` : publicacion.cantidad}
        />
        {publicacion.mtr2 && <Fila etiqueta="Área" valor={`${publicacion.mtr2} m²`} />}
        {publicacion.lugar_fabricacion && (
          <Fila etiqueta="Dónde se fabrica" valor={LUGAR_FABRICACION_ETIQUETA[publicacion.lugar_fabricacion]} />
        )}
        <Fila etiqueta="Valor ofertado" valor={formatCOP(publicacion.valor_ofertado)} destacado />
        {publicacion.fecha_inicio && (
          <Fila
            etiqueta="Fechas"
            valor={`${formatFecha(publicacion.fecha_inicio)}${publicacion.fecha_fin ? ` → ${formatFecha(publicacion.fecha_fin)}` : ""}`}
          />
        )}
        <Fila etiqueta="Requiere seguridad" valor={publicacion.requiere_seguridad ? "Sí" : "No"} />
        <Fila etiqueta="Publicada" valor={formatFecha(publicacion.creado_en)} />
      </div>

      <div className="panel" style={{ marginTop: 16, padding: "14px 16px" }}>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-mist)" }}>Publicada por</p>
        <Link href={`/perfil/${publicacion.autor_id}`} style={{ display: "block", marginTop: 4, fontSize: 16, fontWeight: 600, color: "var(--color-texto)", textDecoration: "none" }}>
          {publicacion.autor_nombre}
          {publicacion.autor_verificado ? " ✓ verificado" : ""}
        </Link>
        <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--color-mist)" }}>
          {publicacion.autor_trabajos} trabajos completados
          {publicacion.autor_rating ? ` · ★ ${publicacion.autor_rating}` : " · sin calificaciones aún"}
        </p>
      </div>

      {esAutor && (
        <AccionesAutor
          publicacionId={publicacion.id}
          estadoPublicacion={publicacion.estado}
          postulantesIniciales={postulantes}
          mensajesNuevos={mensajesNuevos}
        />
      )}

      {!esAutor && esGanador && (
        <div className={`panel${mensajesNuevos > 0 ? " alerta" : ""}`} style={{ marginTop: 20, padding: "14px 16px", borderColor: mensajesNuevos > 0 ? undefined : "#4ade80" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#4ade80" }}>¡Fuiste elegido para este trabajo!</p>
          <Link href={`/publicaciones/${publicacion.id}/chat`} style={{ color: mensajesNuevos > 0 ? "var(--color-acento-claro)" : "#4ade80", textDecoration: "underline", fontSize: 13, fontWeight: mensajesNuevos > 0 ? 700 : 400 }}>
            {mensajesNuevos > 0 ? `🔔 Ir al chat (${mensajesNuevos} nuevo${mensajesNuevos === 1 ? "" : "s"})` : "Ir al chat con quien publicó"}
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
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, border: "1px dashed var(--color-borde)", color: "var(--color-mist)", fontSize: 13 }}>
              {miPostulacion.estado === "pendiente" && "Ya te postulaste — pendiente de que el autor elija."}
              {miPostulacion.estado === "rechazada" && "No fuiste el elegido esta vez."}
            </div>
          ) : publicacion.estado === "abierta" ? (
            <AccionPostulante publicacionId={publicacion.id} />
          ) : (
            <div style={{ marginTop: 20, padding: "12px 16px", borderRadius: 10, border: "1px dashed var(--color-borde)", color: "var(--color-mist)", fontSize: 13 }}>
              Esta oferta ya no está abierta para postularse.
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Fila({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
      <span style={{ color: "var(--color-mist)" }}>{etiqueta}</span>
      <span style={destacado ? { fontFamily: "var(--font-mono)", color: "var(--color-acento-claro)", fontWeight: 600 } : undefined}>{valor}</span>
    </div>
  );
}

function badgeStyle(color: string): CSSProperties {
  return { fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 5, background: color, color: "#fff" };
}
