-- Códigos OTP de un solo uso para el login/registro por WhatsApp (Fase 1).
-- Un renglón por celular: pedir un código nuevo reemplaza el anterior.
create table otps (
  celular text primary key,
  codigo_hash text not null,
  expira_en timestamptz not null,
  intentos int not null default 0,
  creado_en timestamptz not null default now()
);
