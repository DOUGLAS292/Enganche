-- Cambio de modelo (decisión de Douglas, sept-2026): los 30 días sin
-- comisión ya no son por ciudad nueva, son por USUARIO — cada persona que
-- trabaja en Enganche (el elegido, quien paga la comisión) tiene un único
-- periodo de gracia de 30 días en toda su vida en la plataforma, contado
-- desde su primer trabajo completado, sin importar en qué ciudad. La tabla
-- ciudades_piloto quedó sin uso porque implementaba el modelo anterior
-- (por ciudad, no por usuario) y nunca llegó a tener datos reales.
alter table usuarios add column comision_gratis_hasta timestamptz;

drop table ciudades_piloto;
