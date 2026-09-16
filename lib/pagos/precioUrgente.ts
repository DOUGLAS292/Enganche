// Precio de lanzamiento (sept-2026): $12.000 los primeros 60 días como
// gancho para los primeros usuarios, luego sube a su precio normal de
// $20.000. Es una promoción de la plataforma completa por fecha, no un
// beneficio por usuario (a diferencia del periodo de gracia de comisión).
const FECHA_INICIO_PROMOCION = new Date("2026-09-16T00:00:00-05:00");
const DIAS_PROMOCION = 60;
const VALOR_PROMOCION = 12000;
const VALOR_REGULAR = 20000;

export function valorUrgenteVigente(): number {
  const finPromocion = new Date(FECHA_INICIO_PROMOCION.getTime() + DIAS_PROMOCION * 24 * 60 * 60 * 1000);
  return Date.now() < finPromocion.getTime() ? VALOR_PROMOCION : VALOR_REGULAR;
}
