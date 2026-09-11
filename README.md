# Enganche

Marketplace de demanda para producción e instalación de sistemas de aluminio y vidrio — piloto v1 (Cali, lanzando a nivel nacional desde el día uno).

Especificación completa del producto en **[`docs/SPEC.md`](docs/SPEC.md)**.

## Origen de este repo

Este no es el primer intento: `DOUGLAS292/Backend_app` y `DOUGLAS292/frontend-conect`
fueron un prototipo previo (FastAPI + Supabase, HTML/Bootstrap plano, oct. 2025)
sobre la misma idea. Se revisaron antes de arrancar este repo y se rescató lo
reutilizable:

- Las categorías de "tipo de proyecto" del formulario de ofertas original están
  en [`lib/constants/proyectos.ts`](lib/constants/proyectos.ts), reorganizadas
  por nivel de complejidad.
- El resto se reconstruye desde cero en **Next.js + PostgreSQL/PostGIS**, el
  stack que define `docs/SPEC.md §3`, porque el modelo de datos de Enganche
  (8 tablas, máquina de estados, comisión, garantías, geolocalización) es
  bastante más amplio que el prototipo original.

## Estado

### Fase 0 — esqueleto de datos ✅

- [x] 8 tablas: `usuarios`, `publicaciones`, `postulaciones`, `mensajes`,
      `calificaciones`, `comisiones`, `garantias`, `ciudades_piloto`
- [x] Extensión PostGIS + índices GIST para `ST_DWithin` / `ST_Distance`
- [x] Reglas de negocio impuestas a nivel de base de datos:
      - un solo postulante `elegida` activo por publicación (índice único parcial)
      - `rating_promedio` y `trabajos_completados` recalculados por trigger
- [x] Runner de migraciones propio (`npm run migrate`), sin dependencias pesadas
- [x] Endpoint `/api/health` para verificar la conexión a PostGIS

### Fase 1 — Auth + Registro (OTP por WhatsApp) ✅

- [x] Login/registro sin contraseñas, formulario de dos pasos: `/entrar`
      (celular → código de 6 dígitos) y `/registro` (perfil, solo para
      celulares nuevos)
- [x] Códigos OTP de un solo uso: hasheados (`AUTH_SECRET` como pepper),
      expiran a los 5 minutos, máximo 5 intentos, 60s de espera entre reenvíos
      (tabla `otps`, migración `0012`)
- [x] `usuarios.celular` nunca se confía del cliente al crear la cuenta: sale
      de una cookie firmada (JWT, 15 min) que solo existe tras pasar el OTP
- [x] Sesión sin contraseña vía cookie httpOnly firmada (JWT, 30 días) —
      `lib/auth/session.ts`
- [x] Envío por **WhatsApp Business Cloud API (Meta)** — `lib/auth/whatsapp.ts`.
      **Mientras no configures `WHATSAPP_ACCESS_TOKEN`**, el código se imprime
      en la consola del servidor y viaja en la respuesta de
      `/api/auth/otp/solicitar`, para poder probar todo el flujo hoy mismo sin
      esperar la aprobación de Meta.

**Pendiente de tu lado, no bloquea seguir con Fase 2:** dar de alta un WhatsApp
Business Account en [Meta Business Manager](https://business.facebook.com),
activar la Cloud API para un número, y crear + hacer aprobar una plantilla de
mensaje **categoría "Authentication"** (ej. `enganche_otp`, en español, con un
parámetro de cuerpo para el código). Ese proceso lo controla Meta y puede
tardar de horas a un par de días — no es algo que yo pueda hacer por ti. Con
`WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_OTP_TEMPLATE`
puestos en `.env` (o en Vercel al desplegar), el envío real se activa solo,
sin tocar código.

Siguiente: **Fase 2 — Publicar + feed por cercanía** (`docs/SPEC.md §4`).

## Poner esto a andar

### 1. Base de datos (PostgreSQL + PostGIS)

Recomendado para el piloto: [Supabase](https://supabase.com) (gratis para
empezar, PostGIS viene preinstalado, connection string lista en
*Project Settings → Database → Connection string → URI*). Railway es la
alternativa si prefieres eso.

### 2. Variables de entorno

```bash
cp .env.example .env
# completa DATABASE_URL con la connection string de Supabase/Railway
# genera y pega un AUTH_SECRET:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Deja `WHATSAPP_*` vacío por ahora — sin esas variables, el login funciona
igual en modo desarrollo (el código OTP sale en pantalla). Ver Fase 1 arriba.

### 3. Instalar y migrar

```bash
npm install
npm run migrate   # crea las 8 tablas + triggers + extensión PostGIS
```

### 4. Correr en local

```bash
npm run dev
```

Abre `http://localhost:3000` — el botón "Verificar conexión a PostGIS" confirma
que `DATABASE_URL` y la extensión quedaron bien configuradas.

## Estructura

```
db/migrations/       Migraciones SQL numeradas (tablas, índices, triggers)
scripts/migrate.mjs  Runner de migraciones (sin dependencias de ORM)
lib/db.ts            Pool de conexión a Postgres (pg)
lib/auth/            OTP, sesión (JWT en cookie) y envío por WhatsApp
lib/validation/       Normalización de celular colombiano
lib/constants/        Listas de referencia para los formularios (Fase 2)
app/entrar/           Paso 1-2 del login: celular → código
app/registro/         Perfil, solo para celulares nuevos verificados
app/api/auth/         Rutas de login/registro/sesión
app/                  Next.js App Router
docs/SPEC.md          Especificación técnica completa del producto
```

## Probar el login hoy mismo (sin WhatsApp real)

1. `npm run dev`, abre `http://localhost:3000/entrar`
2. Escribe cualquier celular colombiano (10 dígitos, empieza en 3)
3. Como `WHATSAPP_ACCESS_TOKEN` no está configurado, el código de 6 dígitos
   aparece directo en la pantalla ("Modo desarrollo") — cópialo
4. Verifica el código → si el celular es nuevo, te lleva a `/registro` a
   completar el perfil; si ya existe, entra directo
