-- Fija la ruta de búsqueda de las dos funciones de disparador (aviso del
-- linter de seguridad de Supabase: function_search_path_mutable).
alter function public.incrementar_trabajos_completados() set search_path = public, pg_temp;
alter function public.recalcular_rating_usuario() set search_path = public, pg_temp;
