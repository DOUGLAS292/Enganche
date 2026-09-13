import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { regionParaCiudad } from "@/lib/constants/regiones";

const TIPOS_TRABAJO = ["produccion", "instalacion"];
const NIVELES_SISTEMA = ["tradicional", "superior", "especializada"];

export async function GET(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const radioKm = Number(searchParams.get("radioKm") ?? "10") || 10;
  const ciudad = searchParams.get("ciudad")?.trim();
  const tipoTrabajo = searchParams.get("tipoTrabajo");
  const nivelSistema = searchParams.get("nivelSistema");

  const condiciones: string[] = ["p.estado = 'abierta'"];
  const params: unknown[] = [];

  if (tipoTrabajo && TIPOS_TRABAJO.includes(tipoTrabajo)) {
    params.push(tipoTrabajo);
    condiciones.push(`p.tipo_trabajo = $${params.length}`);
  }
  if (nivelSistema && NIVELES_SISTEMA.includes(nivelSistema)) {
    params.push(nivelSistema);
    condiciones.push(`p.nivel_sistema = $${params.length}`);
  }

  let distanciaSelect = "null as distancia_m";
  let orderBy = "p.creado_en desc";
  const tieneLatLng = lat && lng && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));

  if (tieneLatLng) {
    params.push(Number(lng), Number(lat));
    const lngIdx = params.length - 1;
    const latIdx = params.length;
    const punto = `ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography`;
    // Una oferta sin ubicación guardada (compartirla al publicar es opcional)
    // no debe desaparecer del feed: se muestra sin distancia calculada, en
    // vez de quedar excluida por el filtro de cercanía.
    distanciaSelect = `case when p.ubicacion is not null then ST_Distance(p.ubicacion, ${punto}) end as distancia_m`;
    params.push(radioKm * 1000);
    condiciones.push(`(p.ubicacion is null or ST_DWithin(p.ubicacion, ${punto}, $${params.length}))`);
    orderBy = "distancia_m asc nulls last, p.creado_en desc";
  } else if (ciudad) {
    params.push(`%${ciudad}%`);
    condiciones.push(`p.ciudad ilike $${params.length}`);
  }

  const sql = `
    select
      p.id, p.tipo_trabajo, p.nivel_sistema, p.sistema_o_proyecto, p.cantidad,
      p.tiempo_entrega, p.valor_ofertado, p.ciudad, p.region, p.creado_en,
      u.nombre_razon_social as autor_nombre, u.rating_promedio as autor_rating,
      u.trabajos_completados as autor_trabajos, u.verificado as autor_verificado,
      ${distanciaSelect}
    from publicaciones p
    join usuarios u on u.id = p.autor_id
    where ${condiciones.join(" and ")}
    order by ${orderBy}
    limit 100
  `;

  const result = await query(sql, params);
  return NextResponse.json({ ok: true, publicaciones: result.rows });
}

export async function POST(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const tipoTrabajo = String(body?.tipoTrabajo ?? "");
  const nivelSistema = String(body?.nivelSistema ?? "");
  const sistemaOProyecto = String(body?.sistemaOProyecto ?? "").trim();
  const cantidad = String(body?.cantidad ?? "").trim();
  const tiempoEntrega = body?.tiempoEntrega ? String(body.tiempoEntrega).trim() : null;
  const valorOfertado = Number(body?.valorOfertado);
  const ciudad = String(body?.ciudad ?? "").trim();
  const lat = body?.lat != null && Number.isFinite(Number(body.lat)) ? Number(body.lat) : null;
  const lng = body?.lng != null && Number.isFinite(Number(body.lng)) ? Number(body.lng) : null;

  if (
    !TIPOS_TRABAJO.includes(tipoTrabajo) ||
    !NIVELES_SISTEMA.includes(nivelSistema) ||
    !sistemaOProyecto ||
    !cantidad ||
    !ciudad ||
    !Number.isFinite(valorOfertado) ||
    valorOfertado <= 0
  ) {
    return NextResponse.json({ ok: false, error: "Completa los campos obligatorios." }, { status: 400 });
  }

  const region = regionParaCiudad(ciudad);

  const params: unknown[] = [
    usuarioId,
    tipoTrabajo,
    nivelSistema,
    sistemaOProyecto,
    cantidad,
    tiempoEntrega,
    valorOfertado,
    ciudad,
    region,
  ];

  let ubicacionExpr = "null";
  if (lat != null && lng != null) {
    params.push(lng, lat);
    ubicacionExpr = `ST_SetSRID(ST_MakePoint($${params.length - 1}, $${params.length}), 4326)::geography`;
  }

  const creado = await query<{ id: string }>(
    `insert into publicaciones
       (autor_id, tipo_trabajo, nivel_sistema, sistema_o_proyecto, cantidad,
        tiempo_entrega, valor_ofertado, ciudad, region, ubicacion, estado, creado_en)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, ${ubicacionExpr}, 'abierta', now())
     returning id`,
    params
  );

  return NextResponse.json({ ok: true, id: creado.rows[0].id });
}
