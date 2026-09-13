-- Necesario para contar la ventana de garantía de 30 días (ver spec §6):
-- "fecha_reporte debe estar dentro de los 30 días desde completada".
alter table publicaciones add column completada_en timestamptz;
