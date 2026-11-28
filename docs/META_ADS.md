# Pauta en Meta — Enganche

Memoria de trabajo de la publicidad de Enganche en Meta (Facebook e Instagram),
para retomarla en cualquier sesión. Actualizar al cerrar cada campaña.

## Reglas fijas (Douglas)

- Ninguna campaña puede durar más de **15 días** ni quedar sin fecha de fin.
- Nada de gasto ilimitado: toda campaña lleva presupuesto y fecha de fin.
- No activar, pausar ni cambiar presupuesto sin la confirmación de Douglas.
- No confundir con La Ventanería: Enganche tiene su propio negocio, página y
  cuenta publicitaria, y su propio repositorio (este).

## Cuentas y activos

| Activo | Dato |
|---|---|
| Portafolio comercial (Business) | enganche.app — ID 1006464485785396 |
| Cuenta publicitaria | Enganche — ID 1466673848927026 (COP, con método de pago) |
| Página de Facebook | Enganche.App — ID 1285833877954587 |
| Instagram | @enganche.app — ID 17841426384206413 |
| Sitio | https://www.enganchecolombia.com |
| Base de datos | Supabase, proyecto "Enganche" (uqzqgbaeumvfydzclyce) |

La cuenta 287774072 es personal y **no** es de Enganche: no usarla.

## Público objetivo

Aluminieros, vidrieros, instaladores, talleres y constructoras de aluminio y
vidrio en **todo Colombia**. Lanzamiento nacional (ver `docs/SPEC.md`).

## Campaña activa

**Enganche - registro aluminieros y vidrieros - 15 dias** (ID 120250964758660410)

- Objetivo: tráfico, optimización por clics en el enlace.
- Inicio: 22 nov 2026. Fin: 6 dic 2026, 00:00.
- Presupuesto: 10.000 COP/día; subido a **20.000 COP/día** el 27 nov 2026.
- Conjunto: "Aluminieros y vidrieros - Colombia - registro" (ID 120250964759890410).
  Colombia, 25–60 años (sugerencia, con público Advantage+), 12 intereses:
  material de construcción, vidrio, metal, remodelaciones, carpintería (2),
  ventana, acero inoxidable, construcción, espejo, trabajos en metal,
  mecanizado.
- Anuncio: "Reel LLEGO ENGANCHE - Registro" (ID 120250964869730410), creativo
  1140930888912100, botón "Registrarse". Su enlace es `http://www.enganchecolombia.com/`.

- Anuncios nuevos (28 nov 2026), en el mismo conjunto, enlace `https://www.enganchecolombia.com/`
  y botón "Registrarse":
  - "Imagen - Aluminieros y vidrieros - Registro" (ID 120251059458710410,
    creativo 1833293757790028, imagen `docs/anuncios/enganche-a.png`).
  - "Imagen - Talleres y constructoras - Registro" (ID 120251059458850410,
    creativo 1665120915354878, imagen `docs/anuncios/enganche-b.png`).

## Resultados (22–27 nov 2026)

- Gasto 55.171 COP, 10.111 impresiones, 6.620 personas alcanzadas.
- 1.057 clics al enlace (52 COP por clic, 10,5 % de clic), pero solo 401
  visitas cargaron la página.
- Registros nuevos en la app desde el inicio: 25 (51 usuarios en total el 27
  nov). Por día: 22 nov 1, 23 nov 12, 24 nov 9, 25 nov 2, 26 nov 1, 27 nov 0.
  Ciudades: Medellín, Bogotá, Cali, Cartagena y otras.
- El 27 nov Douglas probó el registro desde otro número: el SMS llegó en 4
  segundos, así que el registro funciona.

## Lecciones

- El asistente "Crear anuncio" del resumen de anuncios crea una campaña nueva
  y la deja **activa**. Crear anuncios siempre dentro de la campaña y el
  conjunto que ya existen.
- Meta no permite mezclar optimizaciones distintas (clics y visitas a la
  página) dentro de una campaña con presupuesto de campaña.
- Al 28 nov: 63.473 COP, 1.198 clics, pero solo 445 visitas cargaron la página
  (37 %). El conjunto salía en todas las ubicaciones, incluidas Audience Network,
  Marketplace, estados de WhatsApp y Threads, que traen clics accidentales. El 28
  nov se dejó solo en Facebook e Instagram (feed, historias y reels).
- El video del reel vive en la página, no en la biblioteca de la cuenta: para
  crear un anuncio nuevo con otro enlace hay que subir el archivo del video a
  la cuenta publicitaria.

- Para subir imágenes a Meta desde la sesión hace falta permitir el host
  `rupload.facebook.com` en el entorno (se agregó el 28 nov).

## Píxel de Meta

- Código listo en la app: `app/MetaPixel.tsx` carga el píxel si existe
  `NEXT_PUBLIC_META_PIXEL_ID`, y `app/registro/RegistroForm.tsx` envía el
  evento `CompleteRegistration` al crear la cuenta (sin datos personales).
- **Pendiente:** el negocio enganche.app debe aceptar los términos del píxel en
  Events Manager; luego crear el píxel, poner su ID en la variable
  `NEXT_PUBLIC_META_PIXEL_ID` de Vercel y volver a desplegar.
- Con el píxel funcionando: crear una campaña nueva optimizada para registros,
  públicos similares a los registrados y retargeting a quien vio el video.

## Pendientes

1. Aceptar términos del píxel y configurar `NEXT_PUBLIC_META_PIXEL_ID`.
2. Subir el video del reel a la cuenta publicitaria para crear un anuncio con
   `https://www.enganchecolombia.com`.
3. 30 nov 2026: comparar registros diarios (Supabase) con clics de Meta.
4. Al cierre (6 dic): decidir si se repite la campaña por máximo 15 días.
