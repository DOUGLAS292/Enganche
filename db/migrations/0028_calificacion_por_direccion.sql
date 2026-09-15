-- Douglas notó que "cumplió el tiempo" y "calidad esperada" no tienen
-- sentido cuando el ganador califica al autor (el que lo contrató) — esas
-- preguntas evalúan el trabajo ejecutado, no a quien contrata. Decisión de
-- negocio (sept-2026): para no ahogar a los primeros ofertantes con
-- criterios que los asusten de usar la app, esa dirección se simplifica a
-- solo estrellas + "buena comunicación" — nada de pago a tiempo, material
-- completo ni comentario libre.
alter table calificaciones alter column cumplio_tiempo drop not null;
alter table calificaciones alter column calidad_esperada drop not null;
alter table calificaciones add column buena_comunicacion boolean;
