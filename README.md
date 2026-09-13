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

### Fase 2 — Publicar + feed por cercanía ✅

- [x] `/publicar` — formulario de oferta (tipo de trabajo, nivel del sistema
      con sugerencias de proyecto, cantidad, valor libre, entrega, ciudad) con
      captura opcional de ubicación exacta (Geolocation API del navegador)
- [x] `/feed` — pide tu ubicación al abrir y consulta con `ST_DWithin` /
      `ST_Distance` (radio ajustable 2–50 km, default 10 km); si no hay
      ubicación, cae a filtrar por ciudad escrita a mano — nunca deja al
      usuario sin poder ver ofertas
- [x] Filtros por tipo de trabajo y nivel del sistema
- [x] `/publicaciones/[id]` — detalle con reputación del autor (rating,
      trabajos completados, verificado); postularse queda para Fase 3
- [x] Consultas geoespaciales verificadas contra la base real vía el
      conector MCP de Supabase (0 m en el mismo punto, excluida a 10 km desde
      Bogotá, encontrada a 500 km) — no solo compiladas, probadas con datos
- [x] **Desplegado en producción** en Vercel + Supabase (pooler `sa-east-1`),
      probado de punta a punta por Douglas: login, registro, publicar y ver
      ofertas funcionando en `enganche.vercel.app`

### Fase 3 — Postulación + chat ✅

- [x] "Postularme" — cualquiera puede postularse a cualquier oferta abierta
      (sin filtro por perfil, como pide el spec); no se puede postular dos
      veces a la misma oferta ni a la propia
- [x] El autor ve sus postulantes (reputación incluida) y **elige uno** —
      la publicación pasa a `en_proceso` y las demás postulaciones quedan
      `pendiente`, no rechazadas
- [x] Regla central impuesta por la base de datos, no solo por el código:
      **solo puede haber un postulante `elegida` a la vez** por publicación
      (índice único parcial) — probado forzando el error contra la base real
- [x] **Reapertura**: si el elegido no responde, el autor reabre la oferta →
      vuelve a `abierta`, el elegido pasa a `rechazada`, y los demás
      postulantes siguen disponibles sin tener que volver a postularse —
      probado contra la base real, coincide exactamente con el spec
- [x] Botón "Cancelar publicación" (abierta → cancelada)
- [x] Chat 1-a-1 por publicación, solo entre el autor y el elegido — el
      celular de la otra parte se revela ahí (nunca antes), con enlace directo
      a WhatsApp
- [x] `/postulaciones` — "Mis postulaciones" con el estado de cada una

**Pendiente para más adelante (no bloquea Fase 4):** las notificaciones reales
(push / WhatsApp) de "fuiste elegido" y "se reabrió la oferta" que pide el
spec — hoy el cambio de estado ocurre correctamente en la base, pero avisar
al usuario fuera de la app depende del mismo WhatsApp Business API que Fase 1
dejó pendiente de aprobación por Meta.

Siguiente: **Fase 4 — Cierre + calificación + comisión** (`docs/SPEC.md §4`).

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
app/publicar/         Formulario de oferta (con ubicación opcional)
app/feed/             Feed por cercanía con filtros
app/publicaciones/[id] Detalle: postularse, elegir, reabrir, cancelar
app/publicaciones/[id]/chat  Chat 1-a-1 autor ↔ elegido
app/postulaciones/     "Mis postulaciones" del usuario
app/api/auth/         Rutas de login/registro/sesión
app/api/publicaciones/ Crear/listar ofertas + postular/elegir/reabrir/mensajes
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
