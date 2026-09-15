import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { query } from "@/lib/db";
import { formatFecha } from "@/lib/format";
import SubirFotoBoton from "./SubirFotoBoton";

const TIPO_USUARIO_ETIQUETA: Record<string, string> = {
  empresa: "Empresa",
  taller: "Taller",
  independiente: "Independiente",
};

const OFRECE_ETIQUETA: Record<string, string> = {
  produccion: "Producción",
  instalacion: "Instalación",
  ambos: "Producción e instalación",
};

type Usuario = {
  id: string;
  nombre_razon_social: string;
  tipo_usuario: string;
  ciudad: string | null;
  ofrece: string;
  verificado: boolean;
  rating_promedio: number | null;
  trabajos_completados: number;
  creado_en: string;
  foto_url: string | null;
};

type Calificacion = {
  estrellas: number;
  cumplio_tiempo: boolean;
  calidad_esperada: boolean;
  creado_en: string;
  calificador_id: string;
  calificador_nombre: string;
  sistema_o_proyecto: string;
  tipo_trabajo: string;
  ciudad: string;
};

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    redirect("/entrar");
  }

  const { id } = await params;

  const result = await query<Usuario>(
    `select id, nombre_razon_social, tipo_usuario, ciudad, ofrece, verificado,
            rating_promedio, trabajos_completados, creado_en, foto_url
     from usuarios where id = $1`,
    [id]
  );
  const perfil = result.rows[0];
  if (!perfil) {
    notFound();
  }

  const calificacionesResult = await query<Calificacion>(
    `select c.estrellas, c.cumplio_tiempo, c.calidad_esperada, c.creado_en,
            c.calificador_id, cal.nombre_razon_social as calificador_nombre,
            p.sistema_o_proyecto, p.tipo_trabajo, p.ciudad
     from calificaciones c
     join usuarios cal on cal.id = c.calificador_id
     join publicaciones p on p.id = c.publicacion_id
     where c.calificado_id = $1
     order by c.creado_en desc`,
    [id]
  );
  const calificaciones = calificacionesResult.rows;

  const total = calificaciones.length;
  const pctCumplioTiempo = total > 0 ? Math.round((100 * calificaciones.filter((c) => c.cumplio_tiempo).length) / total) : null;
  const pctCalidadEsperada = total > 0 ? Math.round((100 * calificaciones.filter((c) => c.calidad_esperada).length) / total) : null;

  const esMiPropioPerfil = id === usuarioId;

  return (
    <main className="reticula" style={{ maxWidth: 560, margin: "0 auto", padding: "32px 20px 80px" }}>
      <Link href="/" className="enlace-volver">
        ← Inicio
      </Link>

      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 14 }}>
        {perfil.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={perfil.foto_url}
            alt={perfil.nombre_razon_social}
            width={56}
            height={56}
            style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", border: "1px solid var(--color-borde)", flexShrink: 0 }}
          />
        ) : (
          <div className="icono-marco" style={{ width: 56, height: 56, fontSize: 26 }}>👤</div>
        )}
        <div style={{ minWidth: 0 }}>
          <h1 className="titular" style={{ fontSize: 21, margin: 0, fontWeight: 700 }}>
            {perfil.nombre_razon_social}
            {perfil.verificado ? " ✓" : ""}
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-mist)" }}>
            {TIPO_USUARIO_ETIQUETA[perfil.tipo_usuario] ?? perfil.tipo_usuario}
            {perfil.ciudad ? ` · ${perfil.ciudad}` : ""} · Ofrece {OFRECE_ETIQUETA[perfil.ofrece] ?? perfil.ofrece}
          </p>
        </div>
      </div>

      {esMiPropioPerfil && (
        <>
          <p style={{ marginTop: 10, fontSize: 12, color: "var(--color-mist-tenue)" }}>
            Así es como te ve el resto del gremio.
          </p>
          <SubirFotoBoton />
        </>
      )}

      <div className="panel" style={{ marginTop: 20, padding: "18px 16px", display: "flex", gap: 18, alignItems: "center" }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <p style={{ margin: 0, fontSize: 32, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--color-acento-claro)" }}>
            {perfil.rating_promedio ? `★ ${perfil.rating_promedio}` : "—"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--color-mist)" }}>
            {total > 0 ? `${total} calificación${total === 1 ? "" : "es"}` : "sin calificar"}
          </p>
        </div>
        <div style={{ flex: 1, borderLeft: "1px solid var(--color-borde)", paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          <FilaEstadistica etiqueta="Trabajos completados" valor={String(perfil.trabajos_completados)} />
          <FilaEstadistica etiqueta="Cumplió el tiempo acordado" valor={pctCumplioTiempo != null ? `${pctCumplioTiempo}%` : "—"} />
          <FilaEstadistica etiqueta="Calidad esperada" valor={pctCalidadEsperada != null ? `${pctCalidadEsperada}%` : "—"} />
        </div>
      </div>

      <h2 style={{ fontSize: 15, marginTop: 28 }}>
        Historial de trabajos{total > 0 ? ` (${total})` : ""}
      </h2>

      {total === 0 && (
        <p style={{ color: "var(--color-mist)", fontSize: 13 }}>
          Todavía no tiene calificaciones — {esMiPropioPerfil ? "aquí van a aparecer las tuyas" : "es nuevo en Enganche"}.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
        {calificaciones.map((c, i) => (
          <div key={i} className="panel" style={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-acento-claro)" }}>{"★".repeat(c.estrellas)}</span>
              <span style={{ fontSize: 11, color: "var(--color-mist-tenue)" }}>{formatFecha(c.creado_en)}</span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: 13 }}>
              {c.sistema_o_proyecto} <span style={{ color: "var(--color-mist)" }}>· {c.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"} · {c.ciudad}</span>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-mist)" }}>
              {c.cumplio_tiempo ? "✓ Cumplió el tiempo" : "✗ No cumplió el tiempo"} · {c.calidad_esperada ? "✓ Calidad esperada" : "✗ Calidad no esperada"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--color-mist-tenue)" }}>
              Calificado por{" "}
              <Link href={`/perfil/${c.calificador_id}`} style={{ color: "var(--color-azul-suave)" }}>
                {c.calificador_nombre}
              </Link>
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}

function FilaEstadistica({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
      <span style={{ color: "var(--color-mist)" }}>{etiqueta}</span>
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{valor}</span>
    </div>
  );
}
