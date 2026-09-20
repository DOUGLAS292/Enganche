import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import { formatCOP } from "@/lib/format";

export default async function AdminEstadisticas() {
  const adminId = await obtenerUsuarioIdAdmin();
  if (!adminId) {
    redirect("/");
  }

  const [
    usuariosPorTipo,
    usuariosVerificados,
    usuariosNuevos,
    usuariosActivos,
    publicacionesPorEstado,
    postulacionesPorEstado,
    comisiones,
    urgentes,
    calidad,
    garantiasPorEstado,
    topCiudades,
    inactivosResult,
  ] = await Promise.all([
    query<{ tipo_usuario: string; total: string }>(
      "select tipo_usuario, count(*) as total from usuarios group by tipo_usuario"
    ),
    query<{ total: string }>("select count(*) as total from usuarios where verificado = true"),
    query<{ ultimos_7: string; ultimos_30: string }>(
      `select
         count(*) filter (where creado_en > now() - interval '7 days') as ultimos_7,
         count(*) filter (where creado_en > now() - interval '30 days') as ultimos_30
       from usuarios`
    ),
    query<{ publicaron: string; postularon: string; total: string }>(
      `select
         (select count(distinct autor_id) from publicaciones) as publicaron,
         (select count(distinct postulante_id) from postulaciones) as postularon,
         (select count(*) from usuarios) as total`
    ),
    query<{ estado: string; total: string }>(
      "select estado, count(*) as total from publicaciones group by estado"
    ),
    query<{ estado_postulacion: string; total: string }>(
      "select estado_postulacion, count(*) as total from postulaciones group by estado_postulacion"
    ),
    query<{ estado: string; total: string; suma: string }>(
      "select estado::text, count(*) as total, coalesce(sum(valor_comision), 0) as suma from comisiones group by estado"
    ),
    query<{ estado: string; total: string; suma: string }>(
      "select estado::text, count(*) as total, coalesce(sum(valor), 0) as suma from impulsos_urgentes group by estado"
    ),
    query<{ promedio_estrellas: string | null; pct_cumplio_tiempo: string | null; total_calificaciones: string }>(
      `select
         round(avg(estrellas)::numeric, 2) as promedio_estrellas,
         round(100.0 * count(*) filter (where cumplio_tiempo = true) / nullif(count(*) filter (where cumplio_tiempo is not null), 0), 0) as pct_cumplio_tiempo,
         count(*) as total_calificaciones
       from calificaciones`
    ),
    query<{ estado: string; total: string }>(
      "select estado, count(*) as total from garantias group by estado"
    ),
    query<{ ciudad: string; total: string }>(
      "select ciudad, count(*) as total from publicaciones group by ciudad order by total desc limit 8"
    ),
    // "Desistieron": se registraron pero nunca publicaron ni se postularon a nada.
    query<{ total: string }>(
      `select count(*) as total from usuarios u
       where not exists (select 1 from publicaciones p where p.autor_id = u.id)
         and not exists (select 1 from postulaciones po where po.postulante_id = u.id)`
    ),
  ]);

  const totalUsuarios = Number(usuariosActivos.rows[0]?.total ?? 0);
  const publicaronCount = Number(usuariosActivos.rows[0]?.publicaron ?? 0);
  const postularonCount = Number(usuariosActivos.rows[0]?.postularon ?? 0);
  const inactivos = Number(inactivosResult.rows[0]?.total ?? 0);

  const porTipo = Object.fromEntries(usuariosPorTipo.rows.map((f) => [f.tipo_usuario, Number(f.total)]));
  const porEstadoPub = Object.fromEntries(publicacionesPorEstado.rows.map((f) => [f.estado, Number(f.total)]));
  const porEstadoPost = Object.fromEntries(postulacionesPorEstado.rows.map((f) => [f.estado_postulacion, Number(f.total)]));
  const porEstadoComision = Object.fromEntries(
    comisiones.rows.map((f) => [f.estado, { total: Number(f.total), suma: Number(f.suma) }])
  );
  const porEstadoUrgente = Object.fromEntries(
    urgentes.rows.map((f) => [f.estado, { total: Number(f.total), suma: Number(f.suma) }])
  );
  const porEstadoGarantia = Object.fromEntries(garantiasPorEstado.rows.map((f) => [f.estado, Number(f.total)]));

  const totalPublicaciones = Object.values(porEstadoPub).reduce((a, b) => a + b, 0);
  const totalPostulaciones = Object.values(porEstadoPost).reduce((a, b) => a + b, 0);

  return (
    <main className="reticula" style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/admin" className="enlace-volver">
        ← Panel admin
      </Link>
      <h1 className="titular" style={{ fontSize: 24, marginTop: 14, fontWeight: 700 }}>
        Estadísticas
      </h1>
      <p style={{ color: "var(--color-mist)", fontSize: 13 }}>Todo lo que pasa en Enganche, en un solo lugar.</p>

      <Seccion titulo="Usuarios">
        <Grilla>
          <Stat etiqueta="Total registrados" valor={totalUsuarios} />
          <Stat etiqueta="Verificados" valor={Number(usuariosVerificados.rows[0]?.total ?? 0)} />
          <Stat etiqueta="Nuevos (7 días)" valor={Number(usuariosNuevos.rows[0]?.ultimos_7 ?? 0)} color="#15803d" />
          <Stat etiqueta="Nuevos (30 días)" valor={Number(usuariosNuevos.rows[0]?.ultimos_30 ?? 0)} color="#15803d" />
          <Stat etiqueta="Empresas" valor={porTipo.empresa ?? 0} />
          <Stat etiqueta="Talleres" valor={porTipo.taller ?? 0} />
          <Stat etiqueta="Independientes" valor={porTipo.independiente ?? 0} />
        </Grilla>
      </Seccion>

      <Seccion titulo="Activación">
        <Grilla>
          <Stat etiqueta="Publicaron algo" valor={publicaronCount} color="#15803d" />
          <Stat etiqueta="Se postularon" valor={postularonCount} color="#15803d" />
          <Stat etiqueta="Nunca hicieron nada (desistieron)" valor={inactivos} color="#dc2626" />
        </Grilla>
      </Seccion>

      <Seccion titulo={`Ofertas publicadas (${totalPublicaciones})`}>
        <Grilla>
          <Stat etiqueta="Abiertas" valor={porEstadoPub.abierta ?? 0} color="#15803d" />
          <Stat etiqueta="Enganchadas (en proceso)" valor={porEstadoPub.en_proceso ?? 0} color="var(--color-azul-suave)" />
          <Stat etiqueta="Completadas (cerradas)" valor={porEstadoPub.completada ?? 0} color="var(--color-marca)" />
          <Stat etiqueta="Canceladas" valor={porEstadoPub.cancelada ?? 0} color="#dc2626" />
          <Stat etiqueta="Expiradas" valor={porEstadoPub.expirada ?? 0} color="#a16207" />
        </Grilla>
      </Seccion>

      <Seccion titulo={`Postulaciones (${totalPostulaciones})`}>
        <Grilla>
          <Stat etiqueta="Pendientes" valor={porEstadoPost.pendiente ?? 0} />
          <Stat etiqueta="Elegidas" valor={porEstadoPost.elegida ?? 0} color="#15803d" />
          <Stat etiqueta="No elegidas" valor={porEstadoPost.rechazada ?? 0} color="var(--color-mist)" />
        </Grilla>
      </Seccion>

      <Seccion titulo="Ingresos — Comisión (3% por trabajo completado)">
        <Grilla>
          <StatDinero etiqueta="Confirmado (cobrado)" valor={porEstadoComision.confirmada?.suma ?? 0} cantidad={porEstadoComision.confirmada?.total ?? 0} color="#15803d" />
          <StatDinero etiqueta="Pendiente por cobrar" valor={porEstadoComision.pendiente?.suma ?? 0} cantidad={porEstadoComision.pendiente?.total ?? 0} color="var(--color-acento-claro)" />
          <StatDinero etiqueta="Rechazado" valor={porEstadoComision.rechazada?.suma ?? 0} cantidad={porEstadoComision.rechazada?.total ?? 0} color="#dc2626" />
        </Grilla>
      </Seccion>

      <Seccion titulo="Ingresos — Urgente">
        <Grilla>
          <StatDinero etiqueta="Confirmado (cobrado)" valor={porEstadoUrgente.confirmada?.suma ?? 0} cantidad={porEstadoUrgente.confirmada?.total ?? 0} color="#15803d" />
          <StatDinero etiqueta="Pendiente" valor={porEstadoUrgente.pendiente?.suma ?? 0} cantidad={porEstadoUrgente.pendiente?.total ?? 0} color="var(--color-acento-claro)" />
        </Grilla>
      </Seccion>

      <Seccion titulo="Calidad del servicio">
        <Grilla>
          <Stat etiqueta="Calificación promedio" valor={calidad.rows[0]?.promedio_estrellas ? `★ ${calidad.rows[0].promedio_estrellas}` : "—"} esTexto />
          <Stat etiqueta="Cumplió el tiempo" valor={calidad.rows[0]?.pct_cumplio_tiempo ? `${calidad.rows[0].pct_cumplio_tiempo}%` : "—"} esTexto />
          <Stat etiqueta="Total calificaciones" valor={Number(calidad.rows[0]?.total_calificaciones ?? 0)} />
          <Stat etiqueta="Garantías abiertas" valor={porEstadoGarantia.abierto ?? 0} color="#a16207" />
          <Stat etiqueta="Garantías atendidas" valor={porEstadoGarantia.atendido ?? 0} color="#15803d" />
        </Grilla>
      </Seccion>

      <Seccion titulo="Top ciudades">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
          {topCiudades.rows.map((c) => (
            <div key={c.ciudad} className="panel" style={{ padding: "8px 14px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13 }}>{c.ciudad}</span>
              <span style={{ fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{c.total}</span>
            </div>
          ))}
        </div>
      </Seccion>
    </main>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 28 }}>
      <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>{titulo}</h2>
      {children}
    </div>
  );
}

function Grilla({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>;
}

function Stat({
  etiqueta,
  valor,
  color = "var(--color-texto)",
  esTexto = false,
}: {
  etiqueta: string;
  valor: number | string;
  color?: string;
  esTexto?: boolean;
}) {
  return (
    <div className="panel" style={{ flex: 1, minWidth: 140, padding: "10px 12px" }}>
      <p style={{ margin: 0, fontSize: 11, color: "var(--color-mist)" }}>{etiqueta}</p>
      <p style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>
        {esTexto ? valor : Number(valor).toLocaleString("es-CO")}
      </p>
    </div>
  );
}

function StatDinero({
  etiqueta,
  valor,
  cantidad,
  color,
}: {
  etiqueta: string;
  valor: number;
  cantidad: number;
  color: string;
}) {
  return (
    <div className="panel" style={{ flex: 1, minWidth: 160, padding: "10px 12px" }}>
      <p style={{ margin: 0, fontSize: 11, color: "var(--color-mist)" }}>
        {etiqueta} ({cantidad})
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 16, fontWeight: 700, fontFamily: "var(--font-mono)", color }}>{formatCOP(valor)}</p>
    </div>
  );
}
