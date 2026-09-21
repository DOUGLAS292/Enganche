alter table usuarios add column if not exists feed_visto_hasta timestamptz not null default now();
