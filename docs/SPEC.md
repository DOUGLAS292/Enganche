# Enganche — Especificación técnica del núcleo (v1 · piloto Cali)

> Documento fuente: pegado por Douglas el 2026-09-11 en la sesión de Claude Code
> que arrancó este repositorio. Se conserva aquí tal cual, sin editar, como
> referencia de diseño para todas las fases. Los cambios de alcance posteriores
> se registran en el historial de git de este archivo, no reescribiendo el
> texto original.

Marketplace de demanda para producción e instalación de sistemas de aluminio y vidrio.
Modelo: tablero abierto de demanda + comisión por conexión cerrada.

---

## 1. Modelo de datos

### `usuarios`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| celular | text, único | Es el identificador de login |
| tipo_usuario | enum: empresa / taller / independiente | |
| nombre_razon_social | text | |
| documento | text | Cédula o NIT, sin validación fuerte en piloto |
| ciudad | text | |
| ubicacion | geography(Point, 4326) | Lat/long, PostGIS |
| ofrece | enum: produccion / instalacion / ambos | |
| sistema_linea | text libre | Ej. "Serie 50", "Línea Vital" |
| foto_url | text, nullable | |
| anos_experiencia | int, nullable | |
| verificado | boolean, default false | true tras confirmar OTP + documento |
| rating_promedio | numeric(2,1), default null | Calculado, no editable directo |
| trabajos_completados | int, default 0 | Calculado |
| creado_en | timestamp | |

### `publicaciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| autor_id | uuid (FK usuarios) | Quien publica el trabajo |
| tipo_trabajo | enum: produccion / instalacion | |
| sistema_o_proyecto | text libre | "Sistema a producir" o "Tipo de proyecto" |
| cantidad | text | m² o unidades, texto libre para flexibilidad |
| tiempo_entrega | text | Texto libre en piloto (ej. "8 días") |
| valor_ofertado | numeric(12,0) | En COP. Precio totalmente libre, definido por el autor |
| ciudad | text | |
| ubicacion | geography(Point, 4326) | |
| region | text | Derivada de ciudad/departamento, para agregación de precios (ej. "Suroccidente") |
| estado | enum: abierta / en_proceso / completada / cancelada | default abierta |
| ganador_id | uuid (FK usuarios), nullable | Se llena al elegir postulante |
| veces_reabierta | int, default 0 | Contador de reaperturas |
| creado_en | timestamp | |

### `postulaciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| publicacion_id | uuid (FK) | |
| postulante_id | uuid (FK usuarios) | |
| estado | enum: pendiente / elegida / rechazada | |
| creado_en | timestamp | |

### `mensajes`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| publicacion_id | uuid (FK) | Un hilo de chat por publicación conectada |
| emisor_id | uuid (FK usuarios) | |
| contenido | text | |
| creado_en | timestamp | |

### `calificaciones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| publicacion_id | uuid (FK) | |
| calificador_id | uuid (FK usuarios) | |
| calificado_id | uuid (FK usuarios) | |
| estrellas | int (1–5) | |
| cumplio_tiempo | boolean | |
| calidad_esperada | boolean | |
| creado_en | timestamp | |

### `comisiones`
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid (PK) | |
| publicacion_id | uuid (FK), único | Una comisión por publicación cerrada |
| valor_comision | numeric(12,0) | = valor_ofertado × porcentaje_comision |
| responsable_pago_id | uuid (FK usuarios) | Quien ejecutó el trabajo, por defecto |
| estado | enum: pendiente / marcada_pagada / confirmada | |
| creado_en | timestamp | |
| confirmada_en | timestamp, nullable | La confirma el admin (Douglas) en el piloto |

---

## 2. Reglas de negocio centrales

**Máquina de estados de una publicación**
```
abierta → (autor elige postulante) → en_proceso → (autor marca completado) → completada
abierta → (autor cancela) → cancelada
en_proceso → (autor reabre) → abierta   [ver "Reapertura" abajo]
```
Solo el `autor_id` puede cambiar el estado. Solo se puede elegir un postulante activo a la vez por publicación (no hay reparto parcial de trabajo).

**Reapertura de publicación**
Si el acuerdo con el postulante elegido no se concreta (no responde, se cae el trato antes de iniciar), el `autor_id` puede reabrir la publicación desde el chat o el detalle, con un botón "Reabrir publicación". Efecto:
- `publicacion.estado` vuelve a `abierta`
- `publicacion.ganador_id` se limpia
- La `postulacion` anterior pasa a `estado = rechazada`
- Las demás postulaciones previas (si las hay) siguen disponibles para elegir de nuevo, sin que la gente tenga que volver a postularse
- Se dispara notificación automática a TODOS los postulantes anteriores avisando que la publicación volvió a abrirse (dado que este usuario no siempre está pendiente de la app — perfil "todero" del pequeño empresario/independiente, con poco tiempo frente al celular)
- Se guarda un registro simple de reaperturas por publicación (contador), como insumo futuro para detectar publicaciones problemáticas o usuarios que no responden tras ser elegidos

**Postulación libre, sin filtro por perfil**
Cualquier usuario puede postularse a cualquier publicación, sin importar si marcó "producción", "instalación" o "ambos" en su perfil. Razón: en la práctica del gremio, alguien puede producir sin tener taller propio, o requerir usar instalaciones del que publica, o instalar sin fabricar. Es responsabilidad del autor de la publicación evaluar, en el detalle de cada postulante (historial, rating, y lo que se hable en el chat), si esa persona cumple lo que necesita. El campo `sistema_o_proyecto` puede incluir texto como "se requiere taller propio" de forma informativa, sin validación automática del sistema en esta v1.

**Cálculo de comisión**
```
valor_comision = valor_ofertado × porcentaje_comision
```
`porcentaje_comision` es una constante global configurable, fijada en **3%** para el piloto (ajustable sin cambiar código si más adelante se necesita mover). Se calcula automáticamente al pasar la publicación a `completada`, y crea el registro en `comisiones`.

**La comisión no depende de que ambas partes califiquen.** Basta con que el `autor_id` marque "trabajo completado" para que `publicacion.estado = completada` y se genere el registro de comisión de inmediato. La calificación mutua se dispara en paralelo (ambas partes pueden calificar cuando quieran, cada una de forma independiente), pero no es un requisito ni un bloqueante para el cobro. Esto reconoce que buena parte de los usuarios del gremio no son muy activos digitalmente, y exigir doble confirmación dejaría comisiones "colgadas" indefinidamente.

> Nota: al 3%, el ejemplo del prototipo ($980.000) genera $29.400 de comisión en vez de los $78.400 mostrados en la pantalla de cierre. Con un margen tan bajo, el modelo depende de volumen alto de trabajos cerrados más que de valor por transacción — vale la pena tenerlo en mente al proyectar cuántas conexiones mensuales se necesitan para que el piloto sea rentable.

**Nota sobre informalidad tributaria (resuelto, no requiere cambio de diseño)**
El pago del trabajo en sí (entre el autor y el ganador) siempre ocurre fuera de la plataforma, por los mismos medios que ya usan hoy (Nequi, Daviplata, transferencia, llave). Enganche solo cobra la comisión, y esa cuenta de cobro es entre el usuario y Douglas/La Ventanería como dueño de la plataforma — no involucra a un tercero ni "registra" a los usuarios ante nada. No hay exposición fiscal nueva para los talleres/independientes por usar la plataforma.

**Aclaración clave: el precio es fijo y no negociable, no hay regateo entre postulantes**
El valor ofertado lo define únicamente el autor de la publicación, con base en su propio conocimiento de costos, márgenes y condiciones ya cerradas con su cliente final (incluyendo la urgencia del trabajo — un mismo tipo de instalación puede valer más si se necesita para mañana que si hay quince días de plazo). Los postulantes NO proponen un precio alternativo ni compiten entre sí por precio; solo deciden si aceptan (se postulan) o no al valor ya publicado. No hay negociación de precio dentro del flujo de la app.

Esto es intencional y central para el objetivo de mediano plazo: que el valor por metro cuadrado (o por unidad) de cada tipo de trabajo — producción en Línea Superior, producción en línea de exportación/europea, instalación tradicional, instalación de fachadas, etc. — se vaya estandarizando por región y a nivel nacional a partir del promedio real de lo que el gremio efectivamente paga, sin que haya pelea de "está caro" o "está barato" entre quienes se enganchan. La comparación de precios NO debe habilitarse como funcionalidad entre postulantes de una misma publicación.

**Clasificación por nivel — "pirámide" de complejidad técnica**
Para evitar que el campo de sistema/línea quede totalmente disperso (Serie 50, S50, "línea de siempre", etc., todo escrito distinto), y para poder comparar precios de forma justa (no mezclar un trabajo tradicional simple con una fachada institucional especializada), se introduce un selector de **nivel** obligatorio al publicar, además del campo de texto libre:

- **Nivel 1 — Tradicional:** línea básica, la de siempre, la más informal y extendida en el gremio desde hace décadas. Base de la pirámide, mayor volumen de oferta y demanda.
- **Nivel 2 — Superior / Universal:** líneas de gama media, más técnicas que la tradicional (ej. Línea Superior).
- **Nivel 3 — Especializada:** líneas de alta gama, institucionales, fachadas especiales (ej. Línea Koncept, fachadas de gran formato).

El campo de texto libre (`sistema_o_proyecto`) sigue existiendo dentro de cada nivel, para que el usuario escriba el detalle exacto (marca, referencia). Este nivel se usa tanto para filtrar publicaciones como, sobre todo, para el cálculo del precio de referencia por zona: los promedios de precio por metro cuadrado se calculan **por nivel**, no mezclados, ya que un metro cuadrado de Nivel 1 y uno de Nivel 3 no son comparables en costo ni en complejidad.

Campo nuevo en `publicaciones`: `nivel_sistema` — enum: `tradicional` / `superior` / `especializada`.

**Precio de referencia por zona (dato que se acumula, no se impone)**
El valor que ofrece cada publicación queda totalmente libre — no hay validación ni sugerencia de precio en el piloto. Sin embargo, desde el día uno se captura `valor_ofertado`, `tipo_trabajo`, `sistema_o_proyecto` y `region` de cada publicación completada, de forma que con el tiempo se pueda calcular un precio promedio de referencia por tipo de trabajo y zona (empezando por el suroccidente colombiano). Esto es un objetivo de mediano plazo de Douglas: usar los datos históricos de la plataforma para ayudar a estandarizar precios del gremio a nivel nacional. No requiere desarrollo adicional en el piloto, solo asegurar que estos campos se guardan de forma limpia y consistente desde el inicio.

**Emparejamiento geográfico**
Consulta tipo:
```sql
SELECT * FROM publicaciones
WHERE estado = 'abierta'
  AND ST_DWithin(ubicacion, :ubicacion_usuario, :radio_metros)
ORDER BY ST_Distance(ubicacion, :ubicacion_usuario) ASC;
```
Radio por defecto en el piloto: 10 km. El usuario puede ajustar el radio desde el filtro del Home.

**Lanzamiento abierto desde el día uno, a nivel nacional**
A diferencia del piloto cerrado con 5 talleres aliados del proyecto de cotizador/red de talleres, Enganche se lanza abierto a todo el gremio desde el inicio, y a nivel **nacional**, no solo Cali — aprovechando contactos personales de Douglas con gremios y personas en distintas ciudades (confirmado: ya tiene con quién arrancar en Medellín). Promoción por Facebook y grupos de WhatsApp regionales y nacionales del sector.

Esto implica que la moderación básica de publicaciones (spam, publicaciones falsas, contenido inapropiado) y el reporte de usuarios problemáticos son prioridad desde la Fase 1, no algo que se pueda posponer confiando en una comunidad pequeña y conocida.

**Periodo de gracia — primeros 30 días sin comisión, por usuario** *(actualizado sept-2026: el modelo original era por ciudad nueva; Douglas decidió cambiarlo a por usuario tras la auditoría de 10 casos reales — ver razón abajo)*
Cada usuario que trabaja en Enganche (el elegido para un trabajo, quien paga la comisión) tiene un único periodo de 30 días sin comisión en toda su vida en la plataforma, contado desde su **primer trabajo completado**, sin importar en qué ciudad esté ni cuántas ciudades distintas toque durante ese mes. Pasados esos 30 días desde su propio inicio, todo lo que complete después cobra el 3% normal — incluso si entra por primera vez a una ciudad totalmente nueva para la plataforma.

Se descartó el modelo original (gratis por ciudad nueva, sin importar el usuario) porque no reflejaba cómo se mueve realmente el gremio: un mismo tallerista puede trabajar en Cali, y dos semanas después en Armenia — bajo el modelo por ciudad, cada ciudad nueva le regalaría otro mes gratis distinto; bajo el modelo por usuario, tiene un solo mes de bienvenida y ya.

Implicación técnica: cada usuario tiene una columna `comision_gratis_hasta` (fecha), que se fija la primera vez que se le paga una comisión (aunque sea $0) y nunca se reinicia. El cálculo en `completar` compara `now()` contra esa fecha, no contra ninguna tabla de ciudades.

**Visión de producto a largo plazo:** Enganche no se piensa solo como tablero de ofertas puntuales, sino como un **directorio nacional del gremio de sistemas vidriados** — un lugar donde cualquiera en el sector, en cualquier ciudad del país, puede encontrar y validar (por calificación e historial) a quién contratar para producción o instalación, de forma permanente y no solo transaccional.

**Disparadores de notificación**
| Evento | Se notifica a |
|---|---|
| Nueva publicación dentro del radio de un usuario | Usuarios con `ofrece` compatible, ubicados dentro del radio |
| Nueva postulación recibida | `autor_id` de la publicación |
| Postulante elegido | Postulante elegido (y rechazo silencioso a los no elegidos) |
| Trabajo marcado completado | Ambas partes (dispara pantalla de calificación) |
| Publicación reabierta | Todos los postulantes anteriores de esa publicación |

**Notificaciones críticas también por WhatsApp (no solo push in-app)**
Contexto: usuarios en municipios pequeños o zonas rurales (ej. Cauca, Nariño) suelen tener conexión intermitente o datos limitados, y pueden perder oportunidades de trabajo si dependen solo de la app abierta con internet estable. WhatsApp, en cambio, ya es su canal de uso diario y más liviano.

Mecanismo: usando la misma integración de WhatsApp Business API ya prevista para el OTP de login, Enganche envía automáticamente un mensaje corto (no es un número personal ni chat manual) para los eventos más críticos:
- Fuiste elegido como ganador de una publicación
- La publicación a la que aplicaste fue reabierta (ver sección de reapertura)
- Te reportaron una solicitud de garantía
- Tienes una comisión pendiente de pago

Cada mensaje incluye un enlace directo de regreso a la pantalla correspondiente dentro de la app. Esto no reemplaza las notificaciones push/in-app, las complementa para los eventos de mayor impacto económico para el usuario.
| Comisión pendiente > 48h sin marcar pagada | `responsable_pago_id` |

**Reglas de confianza**
- `verificado = true` solo tras OTP confirmado. El documento se guarda pero no se valida contra fuente externa en el piloto (eso es fase 2, con Confecámaras/Registraduría).
- El número de celular de ambas partes solo se revela dentro del chat una vez `postulacion.estado = elegida`.
- `rating_promedio` y `trabajos_completados` se recalculan por trigger cada vez que se inserta una fila en `calificaciones` con `publicacion.estado = completada`.

---

## 3. Stack técnico recomendado (piloto)

| Capa | Herramienta | Por qué |
|---|---|---|
| Frontend | Next.js (React) | Web responsive, un solo código para móvil y escritorio, fácil de convertir a app empaquetada después |
| Backend | Next.js API routes o Node/Express | Simplicidad para el piloto, sin microservicios todavía |
| Base de datos | PostgreSQL + PostGIS | Necesario para las consultas geográficas |
| Autenticación | OTP por WhatsApp (API de Meta) o SMS (Twilio) | Sin contraseñas, como se definió |
| Notificaciones | Web push o WhatsApp API | Empezar simple, sin app store todavía |
| Hosting | Vercel (frontend) + Supabase o Railway (Postgres/PostGIS) | Bajo costo, escalable, ideal para validar antes de invertir en infraestructura propia |

---

## 4. Fases de construcción sugeridas

1. **Fase 0 — Esqueleto de datos**: crear las 6 tablas, migraciones, y conexión a PostGIS.
2. **Fase 1 — Auth + Registro**: OTP por WhatsApp, formulario de dos pasos.
3. **Fase 2 — Publicar + Feed**: formulario de publicación, feed ordenado por cercanía.
4. **Fase 3 — Postulación + Chat**: postularse, elegir, chat interno.
5. **Fase 4 — Cierre + Calificación + Comisión**: marcar completado, calificar, generar cuenta de cobro.
6. **Fase 5 — Panel de comisiones (admin)**: vista simple para Douglas de comisiones pendientes/pagadas.

Esta secuencia es la que le pasaríamos a Claude Code, fase por fase, para poder probar cada bloque antes de avanzar al siguiente.

---

## 5. Riesgo de desintermediación y estrategia de fidelización

**El riesgo (confirmado como real por Douglas, no hipotético):**
Dos usuarios que se conectan y trabajan bien juntos dentro de la plataforma pueden, en conexiones futuras, coordinarse directamente por fuera (WhatsApp, llamada) para evitar pagar la comisión. Es el riesgo estructural de cualquier marketplace de servicios (mismo patrón que Uber, Rappi, Upwork enfrentan).

**Decisión de enfoque:** no se combate con candados técnicos agresivos (esconder datos, prohibir contacto), porque en un gremio informal esas barreras se saltan fácilmente y generan desconfianza hacia la plataforma. Se combate haciendo que **quedarse en la plataforma valga más que salirse**. Esto es tanto estrategia de producto como de negocio — Douglas lo señaló como un frente de trabajo propio, a desarrollar con cuidado, no solo una regla técnica aislada.

**Palancas de fidelización a explorar (para desarrollar en detalle más adelante, no bloqueantes para la Fase 0):**
- Reputación y rating solo se acumulan por trabajos cerrados *dentro* de la plataforma — el historial visible (que da acceso a mejores oportunidades) es un activo que se pierde si el usuario opera por fuera.
- Volumen de oportunidades: entre más ofertas activas haya en la plataforma, más caro sale para cualquier usuario "salirse", porque se pierde acceso al flujo constante de nuevas demandas, no solo a un contacto puntual.
- Enganche no se vende solo como intermediario que cobra comisión, sino como generador de empleo y de alianzas estructuradas para el gremio — un relato honesto de valor colectivo (más trabajo circulando, mejor for­mal­i­za­ción del sector) que le da sentido a que la comisión exista, más allá de la transacción individual.
- Posibles mecanismos futuros (evaluar en fase de escalamiento, no en el piloto): beneficios crecientes por antigüedad/volumen en la plataforma (ej. comisión decreciente para usuarios de alto volumen recurrente), insignias de confianza verificada que solo se ganan operando dentro del sistema, acceso prioritario a publicaciones grandes para usuarios con buen historial interno.

Este punto queda abierto como línea de trabajo continua — se revisita con más profundidad cuando haya datos reales de uso del piloto que muestren si la desintermediación efectivamente ocurre y con qué frecuencia.

---

## 6. Garantía posventa

**Contexto real del oficio:** en sistemas vidriados, los problemas no siempre aparecen el mismo día de la instalación — puede haber goteras, mal sellado, una nave descarrilada, un rodamiento mal ajustado, que se detectan días o semanas después de marcar el trabajo como "completado" y de haberse generado la comisión.

**Regla:** el cierre de una publicación (`estado = completada`) no es definitivo para efectos de calificación. Queda abierta a una ventana de **garantía de 30 días** después del cierre, dentro de la cual el autor (quien ofertó el trabajo) puede abrir un "reporte de garantía" contra el ganador (quien se enganchó), directamente desde el chat de esa publicación.

**Flujo de un reporte de garantía:**
1. Autor abre "Reporte de garantía" dentro de los 30 días posteriores al cierre, describe el problema.
2. Se notifica al ganador de la publicación.
3. Si el ganador responde y atiende la garantía (a través del mismo chat, coordinando la solución) → no hay impacto negativo en su calificación; incluso puede reforzar positivamente su reputación de "responde por su trabajo".
4. Si el ganador **no responde o no atiende** la garantía dentro de un plazo razonable (a definir, ej. 5-7 días desde el reporte) → esto afecta negativamente su calificación/reputación, marcándolo como alguien que no respalda su trabajo. El autor, al no recibir respuesta, deberá resolver el problema con el cliente final por su cuenta (con sus propios operarios o como pueda), y ese desenlace queda reflejado en el historial del ganador.

**Tabla nueva sugerida: `garantias`**
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid | PK |
| publicacion_id | uuid (FK publicaciones) | |
| reportado_por_id | uuid (FK usuarios) | Siempre el autor de la publicación |
| reportado_contra_id | uuid (FK usuarios) | Siempre el ganador |
| descripcion | text | |
| estado | enum: abierto / atendido / no_atendido | |
| fecha_reporte | timestamp | Debe estar dentro de los 30 días desde `completada` |
| fecha_resolucion | timestamp, nullable | |

El campo `estado = no_atendido` de una garantía es un insumo directo para el cálculo de reputación (junto a los ratings normales), reduciendo el score de transparencia/confiabilidad del usuario reportado.

---

## 7. Panorama del gremio y validaciones pendientes (investigación de mercado)

**Contexto de mercado que valida el modelo (hallazgos de investigación):**
- Más del 80% del empleo en construcción en Colombia ya es informal (informe Argos 2026) — el público objetivo de Enganche es la mayoría del gremio, no un nicho marginal. Confirma tamaño de mercado direccionable.
- El sector formal perdió 136.000 empleos en 2025 (Camacol) y el mercado se está desplazando hacia autoconstrucción y remodelación informal (Bancolombia) — más personas que antes trabajaban formal ahora buscan trabajo independiente, exactamente el público de Enganche.
- El costo de mano de obra subió fuertemente en 2026 (salario mínimo +23,7%, costo de mano de obra en construcción +13,9% según Bancolombia) — esto presiona márgenes de talleres pequeños, lo que hace más importante comunicar que Enganche genera más trabajo, no que es un costo adicional.
- Ya existen grupos masivos de Facebook de bolsa de empleo en construcción/aluminio/vidrio, gratuitos pero desordenados y con riesgo de estafas — son a la vez el canal de adquisición de usuarios más obvio para el lanzamiento Y el argumento de venta (orden y verificación vs. caos).

**Pendiente de validación legal (no bloqueante para Fase 0, sí antes de escalar en volumen):**
Colombia tiene una reforma laboral reciente (Ley 2466) que regula plataformas digitales de trabajo, exigiendo aportes a salud y pensión sobre los ingresos generados a través de ellas (ej. caso Rappi). Lectura de trabajo de Douglas, pendiente de confirmar con abogado laboralista antes de escalar fuerte: Enganche se distingue de ese modelo porque **no fija el precio, no dirige ni organiza la ejecución del trabajo, y no es quien paga al que ejecuta** — solo conecta oferta y demanda y cobra una comisión por la conexión, más parecido a un tablón de anuncios verificado que a una plataforma tipo Rappi. Esta distinción (quién fija el precio y quién dirige el trabajo) es probablemente el criterio legal relevante, pero debe confirmarse formalmente antes de crecer en volumen nacional.

**Nota de movilidad de usuarios (baja prioridad, no requiere cambio técnico):**
El radio de búsqueda (10km default) no distingue si el usuario se moviliza a pie, en bus o en vehículo propio con herramienta. Se deja como responsabilidad del propio usuario evaluar si puede cumplir el traslado antes de postularse, igual que hace hoy de forma manual. Mejora futura posible: mostrar tiempo estimado de viaje en vez de solo distancia en línea recta.
