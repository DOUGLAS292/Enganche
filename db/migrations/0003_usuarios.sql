create table usuarios (
  id uuid primary key default gen_random_uuid(),
  celular text not null unique,
  tipo_usuario tipo_usuario_enum not null,
  nombre_razon_social text not null,
  documento text,
  ciudad text,
  ubicacion geography(Point, 4326),
  ofrece ofrece_enum not null,
  sistema_linea text,
  foto_url text,
  anos_experiencia int,
  verificado boolean not null default false,
  rating_promedio numeric(2,1),
  trabajos_completados int not null default 0,
  creado_en timestamptz not null default now()
);

create index usuarios_ubicacion_idx on usuarios using gist (ubicacion);
create index usuarios_ciudad_idx on usuarios (ciudad);
