-- Avisos internos del administrador a un usuario (moderación del mercado).
create table if not exists avisos_usuario (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  mensaje text not null,
  enviado_por uuid references usuarios(id) on delete set null,
  creado_en timestamptz not null default now(),
  leido_en timestamptz
);
create index if not exists avisos_usuario_pendientes_idx on avisos_usuario (usuario_id) where leido_en is null;
alter table avisos_usuario enable row level security;
