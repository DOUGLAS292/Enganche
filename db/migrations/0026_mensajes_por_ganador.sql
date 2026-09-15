-- Bug real encontrado por Douglas y confirmado con un caso en vivo: al
-- reabrir una publicación y elegir a alguien nuevo, el chat mostraba TODA
-- la conversación anterior con el postulante rechazado — el nuevo elegido
-- veía mensajes privados que no eran con él. El chat debe ser personal
-- entre el autor y CADA postulante elegido, aunque sea la misma oferta.
--
-- Se guarda quién era el ganador_id de la publicación en el momento de
-- cada mensaje. Antes de este cambio, un mensaje solo podía insertarse
-- mientras había un ganador asignado (el acceso al chat lo exige), así
-- que para cada mensaje ya existente, su "ronda" es recuperable.
alter table mensajes add column ganador_id uuid references usuarios (id);

-- Caso general: publicaciones que nunca se reabrieron (la inmensa mayoría)
-- — su ganador_id actual es el único que ha existido, así que es correcto
-- para todos sus mensajes.
update mensajes m
set ganador_id = p.ganador_id
from publicaciones p
where p.id = m.publicacion_id and m.ganador_id is null;

-- Caso "4 puertas serie 70 y 1 vitrina 1101" (b42a9fd0): se reabrió una
-- vez. Los primeros 3 mensajes fueron con Wiston (postulante rechazado
-- después), el backfill de arriba los dejó mal asignados al ganador
-- actual (Aluminios Jesús) — se corrigen a mano con el postulante real
-- de esa ronda, reconstruido por el contenido y el orden de los mensajes.
update mensajes
set ganador_id = 'bd6e69ce-7e1d-4c94-8c32-bc48dc3340a5'
where id in (
  'c2146e4e-aa97-47f9-8dca-4ae42fe3b93f',
  'c81aec7d-c0b8-4f7c-91f5-e848dd92449c',
  '7952bbd5-5b72-4995-a6cf-8b21efcb1264'
);

-- Caso "Ventanas" (a8fbf430): publicación cancelada, con 2 mensajes que
-- quedaron huérfanos del ganador real de esa ronda tras el backfill general.
-- Se corrigen al ganador_id que la publicación tenía en ese momento.
update mensajes
set ganador_id = 'fb014e53-07cf-49e1-b866-5293c975cd58'
where publicacion_id = 'a8fbf430-5648-43d6-97ce-192941ce92dd';
