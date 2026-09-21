-- Límite de tasa genérico, reutilizable por cualquier endpoint (no solo
-- OTP): cada intento se registra con una "bolsa" (bucket) y una clave (IP,
-- usuario, etc.), y se cuenta cuántos caen dentro de la ventana de tiempo.
create table if not exists rate_limits (
  id bigint generated always as identity primary key,
  bucket text not null,
  clave text not null,
  creado_en timestamptz not null default now()
);

create index if not exists rate_limits_bucket_clave_creado_idx on rate_limits (bucket, clave, creado_en);
