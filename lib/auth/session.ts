import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "enganche_sesion";
const TELEFONO_VERIFICADO_COOKIE = "enganche_tel_verificado";
const SESSION_MAX_AGE_SEG = 60 * 60 * 24 * 30; // 30 días
const TELEFONO_VERIFICADO_MAX_AGE_SEG = 60 * 15; // 15 minutos

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("Falta la variable de entorno AUTH_SECRET");
  return new TextEncoder().encode(secret);
}

function cookieBase() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

// --- Sesión completa (usuario ya registrado) ---

export async function crearSesion(usuarioId: string): Promise<void> {
  const jwt = await new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SEG}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, jwt, { ...cookieBase(), maxAge: SESSION_MAX_AGE_SEG });
}

export async function obtenerUsuarioIdDeSesion(): Promise<string | null> {
  const store = await cookies();
  const jwt = store.get(SESSION_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function cerrarSesion(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// --- Celular verificado por OTP, pendiente de completar el registro ---

export async function marcarTelefonoVerificado(celular: string): Promise<void> {
  const jwt = await new SignJWT({ celular })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TELEFONO_VERIFICADO_MAX_AGE_SEG}s`)
    .sign(secretKey());

  const store = await cookies();
  store.set(TELEFONO_VERIFICADO_COOKIE, jwt, {
    ...cookieBase(),
    maxAge: TELEFONO_VERIFICADO_MAX_AGE_SEG,
  });
}

export async function obtenerTelefonoVerificado(): Promise<string | null> {
  const store = await cookies();
  const jwt = store.get(TELEFONO_VERIFICADO_COOKIE)?.value;
  if (!jwt) return null;
  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    return typeof payload.celular === "string" ? payload.celular : null;
  } catch {
    return null;
  }
}

export async function limpiarTelefonoVerificado(): Promise<void> {
  const store = await cookies();
  store.delete(TELEFONO_VERIFICADO_COOKIE);
}
