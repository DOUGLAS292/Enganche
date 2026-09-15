-- Permite al admin rechazar un pago marcado como "pagada" cuando el dinero
-- nunca llegó, en vez de dejarlo varado en ese estado para siempre. Una
-- comisión rechazada bloquea de inmediato al responsable (no espera los 7
-- días de gracia, porque ya hubo un intento de pago cuestionado) hasta que
-- la vuelva a marcar como pagada.
alter type estado_comision_enum add value 'rechazada';
