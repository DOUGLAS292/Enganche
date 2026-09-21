-- Índices en llaves foráneas sin cubrir (detectadas por el advisor de
-- Supabase): con más usuarios estas columnas se filtran/joinean todo el
-- tiempo (mensajes por emisor, publicaciones por autor/ganador, etc.) y
-- sin índice cada consulta hace un escaneo completo de la tabla.
create index if not exists calificaciones_calificador_id_idx on calificaciones (calificador_id);
create index if not exists garantias_reportado_por_id_idx on garantias (reportado_por_id);
create index if not exists impulsos_urgentes_solicitado_por_id_idx on impulsos_urgentes (solicitado_por_id);
create index if not exists mensajes_emisor_id_idx on mensajes (emisor_id);
create index if not exists mensajes_ganador_id_idx on mensajes (ganador_id);
create index if not exists mensajes_leidos_publicacion_id_idx on mensajes_leidos (publicacion_id);
create index if not exists publicaciones_autor_id_idx on publicaciones (autor_id);
create index if not exists publicaciones_ganador_id_idx on publicaciones (ganador_id);

-- RLS: estas tablas no tenían Row Level Security activo, así que si la
-- llave "anon" de Supabase se llegara a filtrar algún día, cualquiera
-- podría leer o escribir estas filas directo por la API REST de Supabase
-- (sin pasar por el backend de la app). La app siempre se conecta con el
-- rol "postgres" (bypassrls = true, confirmado), así que esto no afecta
-- en nada su funcionamiento normal — solo cierra esa puerta de escape.
-- Sin políticas = acceso denegado por defecto para "anon"/"authenticated".
alter table mensajes_leidos enable row level security;
alter table impulsos_urgentes enable row level security;
alter table otp_solicitudes_ip enable row level security;
alter table rate_limits enable row level security;
