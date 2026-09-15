-- "Urgente": el autor paga una tarifa fija para que se avise de inmediato
-- por WhatsApp a los postulantes que califican cerca, en vez de esperar a
-- que naveguen el feed. Piloto (sept-2026): sin pasarela de pago todavía —
-- mismo patrón manual que ya funciona con la comisión (el autor solicita,
-- paga por fuera, el admin confirma), pero con solo 2 pasos porque aquí
-- quien solicita y quien paga es la misma persona.
create type estado_impulso_enum as enum ('pendiente', 'confirmada', 'rechazada');

create table impulsos_urgentes (
  id uuid primary key default gen_random_uuid(),
  publicacion_id uuid not null unique references publicaciones (id),
  solicitado_por_id uuid not null references usuarios (id),
  valor numeric(12, 0) not null default 18000,
  estado estado_impulso_enum not null default 'pendiente',
  creado_en timestamptz not null default now(),
  confirmada_en timestamptz
);

create index impulsos_urgentes_estado_idx on impulsos_urgentes (estado);
