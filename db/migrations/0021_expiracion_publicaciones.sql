-- Auto-expiración por inactividad (regla acordada con Douglas): una
-- publicación abierta que lleva 15 días sin recibir una postulación nueva
-- pasa a 'expirada' (estado nuevo, distinto de 'cancelada' — cancelada es
-- una decisión del autor, expirada es por inactividad, y conviene poder
-- distinguirlas en reportes). Dos días antes (día 13) se avisa al autor
-- por WhatsApp para que renueve o cierre manualmente.
alter type estado_publicacion_enum add value 'expirada';

alter table publicaciones
  add column ultima_actividad_en timestamptz not null default now(),
  add column aviso_expiracion_enviado boolean not null default false;

-- Publicaciones abiertas que ya existían: su última actividad real es la
-- postulación más reciente que hayan recibido, o su fecha de creación si
-- no tienen ninguna — no la fecha de esta migración.
update publicaciones p
set ultima_actividad_en = coalesce(
  (select max(po.creado_en) from postulaciones po where po.publicacion_id = p.id),
  p.creado_en
)
where p.estado = 'abierta';
