-- Fase 5: el panel de comisiones en /admin solo lo puede ver Douglas.
alter table usuarios add column es_admin boolean not null default false;
