-- Rastrea hasta qué momento leyó cada usuario los mensajes de una publicación,
-- para poder mostrar un aviso de "mensajes nuevos" en pantalla (ver hallazgo
-- real: Douglas no se enteró de que Eliecer le había contestado en el chat).
create table mensajes_leidos (
  usuario_id uuid not null references usuarios (id),
  publicacion_id uuid not null references publicaciones (id) on delete cascade,
  leido_hasta timestamptz not null default now(),
  primary key (usuario_id, publicacion_id)
);
