create table garantias (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null references publicaciones (id),
  reportado_por_id uuid not null references usuarios (id),
  reportado_contra_id uuid not null references usuarios (id),
  descripcion text not null,
  estado estado_garantia_enum not null default 'abierto',
  fecha_reporte timestamptz not null default now(),
  fecha_resolucion timestamptz
);

create index garantias_publicacion_idx on garantias (publicacion_id);
create index garantias_reportado_contra_idx on garantias (reportado_contra_id);
