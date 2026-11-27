// Valores mínimos de referencia por metro cuadrado (COP). Protegen a quien
// ejecuta el trabajo (el operario) y evitan ofertas con errores de digitación
// o falsas, que confunden a quienes se postulan. Los metros cuadrados son obligatorios. Se ajustan aquí.
export const PRECIO_MINIMO_INSTALACION_M2 = 15_000;
// Producción con la planta del ofertante puesta al servicio de quien trabaja
// (el operario solo pone la mano de obra).
export const PRECIO_MINIMO_PRODUCCION_PLANTA_OFERTANTE_M2 = 12_000;
// Producción en el taller de quien se postula (pone su planta y su equipo).
export const PRECIO_MINIMO_PRODUCCION_TALLER_POSTULANTE_M2 = 15_000;

export type MinimoPorM2 = { porM2: number; descripcion: string };

export function minimoPorM2(tipoTrabajo: string, lugarFabricacion: string | null | undefined): MinimoPorM2 | null {
  if (tipoTrabajo === "instalacion") {
    return { porM2: PRECIO_MINIMO_INSTALACION_M2, descripcion: "de instalación" };
  }
  if (tipoTrabajo === "produccion") {
    if (lugarFabricacion === "taller_postulante") {
      return { porM2: PRECIO_MINIMO_PRODUCCION_TALLER_POSTULANTE_M2, descripcion: "de producción en el taller de quien se postula" };
    }
    if (lugarFabricacion === "instalaciones_ofertante") {
      return { porM2: PRECIO_MINIMO_PRODUCCION_PLANTA_OFERTANTE_M2, descripcion: "de producción en tu planta, con la mano de obra de quien se postula" };
    }
  }
  return null;
}

export function valorMinimo(mtr2: number, minimo: MinimoPorM2): number {
  return Math.round(mtr2 * minimo.porM2);
}
