create table calificaciones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id),
  calificador_id uuid not null references usuarios (id),
  calificado_id uuid not null references usuarios (id),
  estrellas int not null check (estrellas between 1 and 5),
  cumplio_tiempo boolean not null,
  calidad_esperada boolean not null,
  creado_en timestamptz not null default now(),
  unique (publicacion_id, calificador_id)
);

create index calificaciones_calificado_idx on calificaciones (calificado_id);
