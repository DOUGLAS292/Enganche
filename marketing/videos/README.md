# Videos de Enganche

Videos verticales (1080×1920, 30 fps) hechos con las **pantallas reales de la app**, voz en off de ElevenLabs y subtítulos.

| Video | Archivo de salida | Duración aprox. |
|---|---|---|
| **Lanzamiento con Luci** (modelo oficial) | `enganche_lanzamiento_luci.mp4` | 35 s |
| Lanzamiento (solo app) | `enganche_lanzamiento.mp4` | 32 s |
| Explicativo 1 · Crea tu cuenta | `enganche_01_crea_tu_cuenta.mp4` | 33 s |
| Explicativo 2 · Publica una oferta | `enganche_02_publica_una_oferta.mp4` | 31 s |
| Explicativo 3 · Encuentra trabajo | `enganche_03_encuentra_trabajo.mp4` | 33 s |
| Explicativo 4 · Elige y coordina | `enganche_04_elige_y_coordina.mp4` | 29 s |
| Explicativo 5 · Cierra el trabajo | `enganche_05_cierra_el_trabajo.mp4` | 33 s |

Los `.mp4` no se guardan en el repositorio por su tamaño. Copias comprimidas (720×1280) en Google Drive: *01. APP ENGANCHE → Videos*. Los subtítulos (`.srt`) y el guion de cada video sí están aquí, en `subtitulos/` y `GUIONES.md`.

## Cómo se producen

Todo vive en `produccion/`:

1. **Base de datos local de demostración.** PostgreSQL 16 con PostGIS, migraciones con `npm run migrate`. La migración `0025` necesita el esquema `storage` de Supabase; en local se crea un esquema mínimo (`storage.buckets` y `storage.objects`) solo para que pase.
2. **App en modo desarrollo** (`npx next dev -p 3000`) con un `.env.local` propio. En desarrollo el código OTP llega en la respuesta de `/api/auth/otp/solicitar`, así que no hace falta WhatsApp.
3. **`seed.js`** crea por la API real dos usuarios de demostración (una empresa y un taller, nombres ficticios) y dos ofertas.
4. **`tour.js`** recorre la app en un navegador con tamaño de celular (390×844, 2×). Registra un usuario por la interfaz y lleva una oferta por todo el ciclo: postulación, elección, chat y trabajo completado. Guarda una captura por pantalla en `shots/`. Oculta el indicador de desarrollo de Next.js y el aviso "Modo desarrollo" del código OTP.
5. **`fix_full.js`** recaptura las pantallas largas sin la barra inferior fija, para que no quede flotando en medio de la página.
6. **`build_explainers.py`** arma los 5 explicativos con la plantilla `explainer.html`. **`build_launch.py`** arma el lanzamiento con la plantilla `launch.html`, y **`build_launch_luci.py`** el lanzamiento con Luci (`launch_luci.html`, foto en `brand/luci.jpg`, copia de `marketing/marca/luci_referencia.jpg`). Los tres generan la voz por escena con ElevenLabs (usa la variable `ELEVENLABS_API_KEY`), ajustan la duración de cada escena a su audio, renderizan los cuadros con `render_frames.js` (Chromium) y unen todo con ffmpeg.

Las rutas de `shots/`, `brand/icon.png` y `audio/` son relativas a la carpeta de trabajo donde se corren los scripts. `brand/icon.png` es una copia de `public/icons/icon-512.png`.

## Identidad visual

- Colores de la app: marca `#04253A`, acento `#FF7F00`, azul `#2F76A3`, fondo `#C7DEF2`, ámbar `#FFAD01`.
- Tipografías de la app: Unbounded (títulos), Manrope (texto) e IBM Plex Mono (datos).
- Logo: el ícono de la app (ventana con sol).

## Pendientes

- Confirmar el ícono de la app como logo oficial de la marca, y el canal de contacto público de Enganche, para agregarlos al cierre.
- Las tomas fotorrealistas con la modelo en Google Flow siguen pendientes. Hacen falta las fotos de referencia de la modelo y una sesión de Flow con la cuenta de la empresa.
- Los nombres "Constructora Ejemplo S.A.S.", "Taller El Vidriero" y "Andrés Instalaciones" son ficticios, solo para la demostración.
