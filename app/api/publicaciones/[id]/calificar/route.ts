import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const { id } = await params;

  const publicacion = await query<{ autor_id: string; ganador_id: string | null; estado: string }>(
    "select autor_id, ganador_id, estado from publicaciones where id = $1",
    [id]
  );
  const fila = publicacion.rows[0];
  if (!fila || !fila.ganador_id || (usuarioId !== fila.autor_id && usuarioId !== fila.ganador_id)) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 403 });
  }
  if (fila.estado !== "completada") {
    return NextResponse.json({ ok: false, error: "Solo puedes calificar un trabajo completado." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const estrellas = Number(body?.estrellas);
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return NextResponse.json({ ok: false, error: "Elige de 1 a 5 estrellas." }, { status: 400 });
  }

  const calificaAlGanador = usuarioId === fila.autor_id;
  const calificadoId = calificaAlGanador ? fila.ganador_id : fila.autor_id;

  // El autor califica el trabajo ejecutado (tiempo y calidad). El ganador
  // califica a quien lo contrató — decisión de negocio (sept-2026): para
  // no ahogar a los primeros ofertantes, esa dirección se queda solo en
  // estrellas + buena comunicación, sin preguntas que puedan asustarlos.
  const cumplioTiempo = calificaAlGanador ? Boolean(body?.cumplioTiempo) : null;
  const calidadEsperada = calificaAlGanador ? Boolean(body?.calidadEsperada) : null;
  const buenaComunicacion = calificaAlGanador ? null : Boolean(body?.buenaComunicacion);

  try {
    await query(
      `insert into calificaciones (publicacion_id, calificador_id, calificado_id, estrellas, cumplio_tiempo, calidad_esperada, buena_comunicacion)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [id, usuarioId, calificadoId, estrellas, cumplioTiempo, calidadEsperada, buenaComunicacion]
    );
  } catch (err) {
    const codigo = err instanceof Error && "code" in err ? (err as { code?: string }).code : undefined;
    if (codigo === "23505") {
      return NextResponse.json({ ok: false, error: "Ya calificaste este trabajo." }, { status: 409 });
    }
    throw err;
  }

  return NextResponse.json({ ok: true });
}
