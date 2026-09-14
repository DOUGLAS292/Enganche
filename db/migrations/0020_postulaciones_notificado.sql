-- Aviso en pantalla de "fuiste elegido" / "se reabrió la oferta", mismo
-- patrón que mensajes_leidos: hoy el postulante solo se entera si entra
-- por su cuenta a revisar. Default true para no marcar como "nuevo" las
-- postulaciones pendientes ya existentes; solo se pone en false cuando
-- pasa a elegida o a rechazada (por reabrir).
alter table postulaciones add column notificado boolean not null default true;
