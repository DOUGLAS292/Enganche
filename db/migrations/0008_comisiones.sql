create table comisiones (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null unique references publicaciones (id),
  valor_comision numeric(12, 0) not null,
  responsable_pago_id uuid not null references usuarios (id),
  estado estado_comision_enum not null default 'pendiente',
  creado_en timestamptz not null default now(),
  confirmada_en timestamptz
);

create index comisiones_estado_idx on comisiones (estado);
create index comisiones_responsable_pago_idx on comisiones (responsable_pago_id);
