create table if not exists otp_solicitudes_ip (
  id bigint generated always as identity primary key,
  ip text not null,
  creado_en timestamptz not null default now()
);

create index if not exists otp_solicitudes_ip_ip_creado_idx on otp_solicitudes_ip (ip, creado_en);
