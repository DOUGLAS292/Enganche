-- Aviso al autor cuando tiene postulantes esperando hace varios días y
-- todavía no ha elegido a nadie (el "otro lado" del aviso de expiración:
-- ese avisa por falta de postulantes, este avisa por falta de decisión).
alter table publicaciones
  add column aviso_postulantes_enviado boolean not null default false;
