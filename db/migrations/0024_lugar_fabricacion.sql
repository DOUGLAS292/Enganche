-- Solo para tipo_trabajo = 'produccion': aclara si el trabajo se hace en
-- las instalaciones de quien ofrece (pone taller y maquinaria, el
-- postulante solo pone mano de obra) o si el postulante debe tener su
-- propio taller (le llegan los materiales, pero fabrica en su propio
-- espacio). En instalación no aplica — el trabajo siempre es en la obra
-- del cliente, así que la columna queda null para esos casos.
create type lugar_fabricacion_enum as enum ('instalaciones_ofertante', 'taller_postulante');

alter table publicaciones add column lugar_fabricacion lugar_fabricacion_enum;
