-- Avisos en el celular (Web Push). Cada fila es un navegador o app instalada
-- de un usuario que activó los avisos. El endpoint identifica el dispositivo;
-- las claves p256dh y auth sirven para cifrar el mensaje solo para él.
create table if not exists push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references usuarios(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  fallos int not null default 0,
  creado_en timestamptz not null default now(),
  ultimo_envio_en timestamptz
);
create index if not exists push_suscripciones_usuario_idx on push_suscripciones (usuario_id);

-- Sin políticas = acceso denegado para anon/authenticated (la app usa postgres).
alter table push_suscripciones enable row level security;
