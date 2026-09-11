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

## Estado — Fase 0: esqueleto de datos ✅

- [x] 8 tablas: `usuarios`, `publicaciones`, `postulaciones`, `mensajes`,
      `calificaciones`, `comisiones`, `garantias`, `ciudades_piloto`
- [x] Extensión PostGIS + índices GIST para `ST_DWithin` / `ST_Distance`
- [x] Reglas de negocio impuestas a nivel de base de datos:
      - un solo postulante `elegida` activo por publicación (índice único parcial)
      - `rating_promedio` y `trabajos_completados` recalculados por trigger
- [x] Runner de migraciones propio (`npm run migrate`), sin dependencias pesadas
- [x] Endpoint `/api/health` para verificar la conexión a PostGIS

Siguiente: **Fase 1 — Auth por OTP de WhatsApp** (`docs/SPEC.md §4`).

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
```

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
db/migrations/     Migraciones SQL numeradas (tablas, índices, triggers)
scripts/migrate.mjs  Runner de migraciones (sin dependencias de ORM)
lib/db.ts           Pool de conexión a Postgres (pg)
lib/constants/       Listas de referencia para los formularios (Fase 2)
app/                 Next.js App Router
docs/SPEC.md         Especificación técnica completa del producto
```
