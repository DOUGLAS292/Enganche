-- Registra cuándo aceptó cada usuario los Términos y condiciones, exigido
-- desde el registro (checkbox obligatorio en /registro).
alter table usuarios add column terminos_aceptados_en timestamptz;
