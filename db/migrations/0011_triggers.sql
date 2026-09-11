-- Recalcula rating_promedio del usuario calificado cada vez que entra una
-- calificación (ver spec §2, "Reglas de confianza").
create or replace function recalcular_rating_usuario() returns trigger as $$
begin
  update usuarios
  set rating_promedio = (
    select round(avg(estrellas)::numeric, 1)
    from calificaciones
    where calificado_id = new.calificado_id
  )
  where id = new.calificado_id;
  return new;
end;
$$ language plpgsql;

create trigger calificaciones_recalcular_rating
  after insert on calificaciones
  for each row execute function recalcular_rating_usuario();

-- Suma un trabajo completado al ganador cuando la publicación pasa a
-- "completada" (ver spec §2, "Reglas de confianza").
create or replace function incrementar_trabajos_completados() returns trigger as $$
begin
  if new.estado = 'completada'
     and old.estado is distinct from 'completada'
     and new.ganador_id is not null then
    update usuarios
    set trabajos_completados = trabajos_completados + 1
    where id = new.ganador_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger publicaciones_incrementar_trabajos_completados
  after update on publicaciones
  for each row execute function incrementar_trabajos_completados();
