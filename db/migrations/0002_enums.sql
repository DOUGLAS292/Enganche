create type tipo_usuario_enum as enum ('empresa', 'taller', 'independiente');
create type ofrece_enum as enum ('produccion', 'instalacion', 'ambos');
create type tipo_trabajo_enum as enum ('produccion', 'instalacion');
create type nivel_sistema_enum as enum ('tradicional', 'superior', 'especializada');
create type estado_publicacion_enum as enum ('abierta', 'en_proceso', 'completada', 'cancelada');
create type estado_postulacion_enum as enum ('pendiente', 'elegida', 'rechazada');
create type estado_comision_enum as enum ('pendiente', 'marcada_pagada', 'confirmada');
create type estado_garantia_enum as enum ('abierto', 'atendido', 'no_atendido');
