// Sugerencias de "sistema o proyecto" para el formulario de publicar (Fase 2).
// El texto libre siempre gana — esto es solo autocompletado, rescatado del
// primer prototipo (frontend-conect/offers.html) y reorganizado por nivel.
export const PROYECTOS_SUGERIDOS: Record<
  "tradicional" | "superior" | "especializada",
  string[]
> = {
  tradicional: ["Ventanas y puertas", "Divisiones de ambiente", "Vitrinas comerciales"],
  superior: ["Fachadas residenciales", "Cortasoles", "Pasamanos"],
  especializada: ["Fachadas institucionales de gran formato", "Muro cortina"],
};
