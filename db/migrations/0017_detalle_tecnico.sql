-- Detalle técnico opcional por publicación (ver ejemplo real de Douglas:
-- hoja de cotización con referencias V-1, V-2... cada una con ancho/alto/
-- cantidad/especificación), más los campos de cronograma y acceso que
-- también trae esa hoja (fechas, seguridad, horario).
alter table publicaciones add column fecha_inicio date;
alter table publicaciones add column fecha_fin date;
alter table publicaciones add column requiere_seguridad boolean not null default false;
alter table publicaciones add column horario_acceso text;

create table publicacion_items (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id) on delete cascade,
  orden int not null default 0,
  referencia text,
  ubicacion text,
  ancho_mm int,
  alto_mm int,
  cantidad int not null default 1,
  especificacion text,
  creado_en timestamptz not null default now()
);

create index publicacion_items_publicacion_idx on publicacion_items (publicacion_id);
