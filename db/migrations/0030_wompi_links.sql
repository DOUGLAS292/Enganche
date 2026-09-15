-- Guarda el id del link de pago de Wompi generado para cada comisión e
-- impulso urgente, para poder mostrar el botón "Pagar con Wompi" y para
-- que el webhook (transaction.updated) sepa a cuál fila corresponde un
-- pago aprobado. Nulo mientras WOMPI_LLAVE_PRIVADA no esté configurada —
-- en ese caso se sigue usando el flujo manual existente.
alter table comisiones add column wompi_link_id text;
alter table impulsos_urgentes add column wompi_link_id text;
