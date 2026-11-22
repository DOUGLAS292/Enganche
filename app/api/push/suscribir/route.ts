import { NextResponse } from "next/server";
import { after } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";
import { excedioLimite, registrarIntento } from "@/lib/rateLimit";
import { endpointPermitido, enviarPushAEndpoint } from "@/lib/push/enviar";

const MAX_DISPOSITIVOS_POR_USUARIO = 8;
const LIMITE = 30;
const VENTANA_MS = 60 * 60 * 1000;

function textoValido(valor: unknown, max: number): valor is string {
  return typeof valor === "string" && valor.length > 0 && valor.length <= max;
}

export async function POST(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  if (await excedioLimite("push_suscribir", usuarioId, LIMITE, VENTANA_MS)) {
    return NextResponse.json({ ok: false, error: "Demasiados intentos. Espera un momento." }, { status: 429 });
  }
  await registrarIntento("push_suscribir", usuarioId);

  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!textoValido(endpoint, 2048) || !textoValido(p256dh, 256) || !textoValido(auth, 256) || !endpointPermitido(endpoint)) {
    return NextResponse.json({ ok: false, error: "Suscripción no válida." }, { status: 400 });
  }
  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, 300);

  // Un mismo dispositivo siempre tiene el mismo endpoint: si otra persona
  // inicia sesión en él, los avisos pasan a ser de la persona actual.
  await query(
    `insert into push_suscripciones (usuario_id, endpoint, p256dh, auth, user_agent)
     values ($1, $2, $3, $4, $5)
     on conflict (endpoint) do update
       set usuario_id = excluded.usuario_id, p256dh = excluded.p256dh, auth = excluded.auth,
           user_agent = excluded.user_agent, fallos = 0`,
    [usuarioId, endpoint, p256dh, auth, userAgent]
  );

  // Se conservan solo los dispositivos más recientes de cada usuario.
  await query(
    `delete from push_suscripciones
     where usuario_id = $1 and id not in (
       select id from push_suscripciones where usuario_id = $1 order by creado_en desc limit $2
     )`,
    [usuarioId, MAX_DISPOSITIVOS_POR_USUARIO]
  );

  if (body?.prueba === true) {
    after(() =>
      enviarPushAEndpoint(usuarioId, endpoint, {
        titulo: "¡Avisos activados! 🔔",
        cuerpo: "Te avisaremos aquí de postulaciones, mensajes y ofertas urgentes.",
        url: "/",
        tag: "bienvenida",
      })
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }
  const body = await request.json().catch(() => null);
  const endpoint = body?.endpoint;
  if (!textoValido(endpoint, 2048)) {
    return NextResponse.json({ ok: false, error: "Falta el dispositivo." }, { status: 400 });
  }
  await query("delete from push_suscripciones where usuario_id = $1 and endpoint = $2", [usuarioId, endpoint]);
  return NextResponse.json({ ok: true });
}
