create table postulaciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id),
  postulante_id uuid not null references usuarios (id),
  estado estado_postulacion_enum not null default 'pendiente',
  creado_en timestamptz not null default now(),
  unique (publicacion_id, postulante_id)
);

create index postulaciones_publicacion_idx on postulaciones (publicacion_id);
create index postulaciones_postulante_idx on postulaciones (postulante_id);

-- Regla central: solo un postulante "elegida" activo a la vez por publicación
-- (no hay reparto parcial de trabajo — ver spec §2, máquina de estados).
create unique index postulaciones_una_elegida_por_publicacion_idx
  on postulaciones (publicacion_id)
  where estado = 'elegida';
