import { query } from "@/lib/db";

// Compartida entre la confirmación manual del admin y el webhook de
// Wompi: cuando Wompi ya aprobó el pago, no hace falta pasar primero por
// "marcada_pagada" (eso es solo para cuando el ganador paga por fuera de
// la app y avisa él mismo) — se confirma directo desde cualquier estado
// que no sea ya "confirmada".
export async function confirmarComisionPorId(comisionId: string): Promise<boolean> {
  const actualizada = await query(
    `update comisiones
       set estado = 'confirmada', confirmada_en = now()
     where id = $1 and estado != 'confirmada'
     returning id`,
    [comisionId]
  );
  return Boolean(actualizada.rows[0]);
}
