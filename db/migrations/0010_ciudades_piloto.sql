-- Soporta la regla de "primer mes sin comisión" por ciudad nueva (ver spec §2,
-- "Arranque en frío por ciudad"). El cálculo de comisión (Fase 4) debe:
--   1. buscar la fila de la ciudad de la publicación aquí;
--   2. si no existe fila, o now() < fecha_activacion_comision, la comisión es 0;
--   3. si ya se activó, usar porcentaje_comision (default 3%).
create table ciudades_piloto (
  ciudad text primary key,
  region text not null,
  fecha_lanzamiento timestamptz not null default now(),
  fecha_activacion_comision timestamptz,
  porcentaje_comision numeric(4, 3) not null default 0.030,
  creado_en timestamptz not null default now()
);
