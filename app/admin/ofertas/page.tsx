import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioIdAdmin } from "@/lib/auth/admin";
import { query } from "@/lib/db";
import { formatCOP, formatFecha } from "@/lib/format";
import { minimoPorM2, valorMinimo } from "@/lib/constants/precios";
import AccionesOferta from "./AccionesOferta";

type Oferta = {
  id: string;
  autor_id: string;
  tipo_trabajo: string;
  sistema_o_proyecto: string;
  ciudad: string;
  mtr2: string | null;
  valor_ofertado: number;
  lugar_fabricacion: string | null;
  estado: string;
  creado_en: string;
  autor_nombre: string;
  autor_celular: string;
  postulaciones: string;
};

export default async function AdminOfertas() {
  if (!(await obtenerUsuarioIdAdmin())) redirect("/");

  const { rows } = await query<Oferta>(
    `select p.id, p.autor_id, p.tipo_trabajo, p.sistema_o_proyecto, p.ciudad, p.mtr2, p.valor_ofertado,
            p.lugar_fabricacion, p.estado, p.creado_en,
            u.nombre_razon_social as autor_nombre, u.celular as autor_celular,
            (select count(*) from postulaciones x where x.publicacion_id = p.id)::text as postulaciones
       from publicaciones p
       join usuarios u on u.id = p.autor_id
      order by p.creado_en desc
      limit 60`
  );

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "32px 20px 60px" }}>
      <Link href="/admin" className="enlace-volver">← Panel</Link>
      <h1 className="titular" style={{ fontSize: 26, margin: "12px 0 4px" }}>Ofertas publicadas</h1>
      <p style={{ color: "var(--color-mist)", fontSize: 13, margin: "0 0 16px" }}>
        Revisa que los valores sean reales. Si algo no cuadra, cancela la oferta y avisa al autor.
      </p>
      {rows.map((o) => {
        const m2 = o.mtr2 ? Number(o.mtr2) : null;
        const minimo = minimoPorM2(o.tipo_trabajo, o.lugar_fabricacion);
        const porM2 = m2 ? Math.round(o.valor_ofertado / m2) : null;
        const sospechosa = !!(m2 && minimo && o.valor_ofertado < valorMinimo(m2, minimo));
        return (
          <div key={o.id} className="panel" style={{ padding: "14px 16px", marginBottom: 12, borderColor: sospechosa ? "#dc2626" : undefined }}>
            <Link href={`/publicaciones/${o.id}`} style={{ fontSize: 15, fontWeight: 600, color: "var(--color-texto)" }}>
              {o.sistema_o_proyecto}
            </Link>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-mist)" }}>
              {o.tipo_trabajo === "instalacion" ? "Instalación" : "Producción"} · {o.ciudad} · {o.estado} · {formatFecha(o.creado_en)}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 13 }}>
              {m2 ? `${m2} m²` : "sin m²"} · {formatCOP(o.valor_ofertado)}
              {porM2 ? ` · ${formatCOP(porM2)}/m²` : ""} · {o.postulaciones} postulaciones
            </p>
            {sospechosa && <p style={{ margin: "4px 0 0", fontSize: 12, color: "#dc2626" }}>Por debajo del mínimo de referencia.</p>}
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-mist)" }}>
              Autor: {o.autor_nombre} · {o.autor_celular}
            </p>
            <AccionesOferta publicacionId={o.id} autorId={o.autor_id} puedeCancelar={o.estado === "abierta"} />
          </div>
        );
      })}
    </main>
  );
}
