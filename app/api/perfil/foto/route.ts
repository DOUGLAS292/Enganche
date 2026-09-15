import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { obtenerUsuarioIdDeSesion } from "@/lib/auth/session";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

// Sube la foto directamente al bucket público "avatares" de Supabase
// Storage usando la llave anon (pública, no es secreta) — quien controla
// quién puede subir y a qué usuario se le guarda la foto es esta misma
// ruta, validando la sesión igual que el resto de la app.
export async function POST(request: Request) {
  const usuarioId = await obtenerUsuarioIdDeSesion();
  if (!usuarioId) {
    return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ ok: false, error: "Subida de fotos no configurada todavía." }, { status: 500 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("foto");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ ok: false, error: "Falta la foto." }, { status: 400 });
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return NextResponse.json({ ok: false, error: "Solo se aceptan fotos JPG, PNG o WEBP." }, { status: 400 });
  }
  if (archivo.size > TAMANO_MAXIMO_BYTES) {
    return NextResponse.json({ ok: false, error: "La foto no puede pesar más de 5 MB." }, { status: 400 });
  }

  const extension = archivo.type === "image/png" ? "png" : archivo.type === "image/webp" ? "webp" : "jpg";
  const ruta = `${usuarioId}-${Date.now()}.${extension}`;

  const subida = await fetch(`${supabaseUrl}/storage/v1/object/avatares/${ruta}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseAnonKey}`,
      apikey: supabaseAnonKey,
      "Content-Type": archivo.type,
    },
    body: await archivo.arrayBuffer(),
  });

  if (!subida.ok) {
    const detalle = await subida.text();
    console.error(`[Enganche] Falló la subida de foto a Supabase Storage (${subida.status}): ${detalle}`);
    return NextResponse.json({ ok: false, error: "No se pudo subir la foto. Intenta de nuevo." }, { status: 502 });
  }

  const fotoUrl = `${supabaseUrl}/storage/v1/object/public/avatares/${ruta}`;
  await query("update usuarios set foto_url = $1 where id = $2", [fotoUrl, usuarioId]);

  return NextResponse.json({ ok: true, fotoUrl });
}
