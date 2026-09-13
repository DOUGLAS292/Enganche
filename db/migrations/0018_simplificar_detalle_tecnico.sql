-- Se simplifica el detalle técnico de la Fase 4/5: sin desglose por ítem,
-- solo un campo manual de m² a nivel de toda la publicación (el resto de
-- campos del ejemplo de Douglas — fechas, seguridad, horario — ya se
-- agregaron en la migración 0017).
drop table publicacion_items;

alter table publicaciones add column mtr2 numeric(10, 2);
