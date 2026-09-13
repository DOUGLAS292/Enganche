-- Bug real encontrado en auditoría: lib/constants/regiones.ts solo mapea 8
-- ciudades. Cualquier otra ciudad (el piloto lanza a nivel nacional desde el
-- día uno, ver spec §1) llega aquí con region = null, y el insert en
-- ciudades_piloto (ruta /completar) fallaba por la restricción not null,
-- dejando el trabajo marcado "completada" sin generar su comisión.
alter table ciudades_piloto alter column region drop not null;
