-- Medir por qué canal pidieron código los usuarios (WhatsApp o SMS).
-- Solo guardamos el canal y la fecha: nada que identifique al usuario.
create table if not exists otp_canal_elegido (
  id bigserial primary key,
  canal text not null check (canal in ('whatsapp', 'sms')),
  creado_en timestamptz not null default now()
);
create index if not exists otp_canal_elegido_creado_en_idx on otp_canal_elegido (creado_en);

-- Sin políticas = acceso denegado para anon/authenticated (la app usa postgres).
alter table otp_canal_elegido enable row level security;
