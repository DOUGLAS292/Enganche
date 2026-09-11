create table publicaciones (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null references usuarios (id),
  tipo_trabajo tipo_trabajo_enum not null,
  nivel_sistema nivel_sistema_enum not null,
  sistema_o_proyecto text not null,
  cantidad text not null,
  tiempo_entrega text,
  valor_ofertado numeric(12, 0) not null,
  ciudad text not null,
  ubicacion geography(Point, 4326),
  region text,
  estado estado_publicacion_enum not null default 'abierta',
  ganador_id uuid references usuarios (id),
  veces_reabierta int not null default 0,
  creado_en timestamptz not null default now()
);

create index publicaciones_ubicacion_idx on publicaciones using gist (ubicacion);
create index publicaciones_estado_idx on publicaciones (estado);
create index publicaciones_ciudad_idx on publicaciones (ciudad);
create index publicaciones_region_idx on publicaciones (region);
create index publicaciones_nivel_sistema_idx on publicaciones (nivel_sistema);

-- Soporta el promedio de precio de referencia por tipo de trabajo + nivel + zona
-- (ver spec §2, "Precio de referencia por zona") sin mezclar niveles distintos.
create index publicaciones_precio_referencia_idx
  on publicaciones (region, tipo_trabajo, nivel_sistema)
  where estado = 'completada';
