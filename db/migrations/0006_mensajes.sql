create table mensajes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id),
  emisor_id uuid not null references usuarios (id),
  contenido text not null,
  creado_en timestamptz not null default now()
);

create index mensajes_publicacion_idx on mensajes (publicacion_id, creado_en);
