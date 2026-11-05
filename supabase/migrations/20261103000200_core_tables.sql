create table public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  full_name text not null check (length(btrim(full_name)) between 2 and 160),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_id_owner_key unique (id, owner_id)
);

create index clients_owner_idx on public.clients (owner_id);
create index clients_owner_phone_idx on public.clients (owner_id, phone_e164);
create index clients_owner_name_idx on public.clients (owner_id, lower(full_name));

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  client_id uuid not null,
  event_type public.event_type not null,
  starts_at timestamptz not null,
  venue_name text,
  venue_address text not null check (length(btrim(venue_address)) between 5 and 300),
  district text,
  city text,
  guest_count integer check (guest_count is null or guest_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_id_client_owner_key unique (id, client_id, owner_id),
  constraint events_client_owner_fkey foreign key (client_id, owner_id)
    references public.clients (id, owner_id) on delete restrict
);

create index events_owner_idx on public.events (owner_id);
create index events_client_idx on public.events (client_id);
create index events_owner_starts_at_idx on public.events (owner_id, starts_at);

create table public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  category public.service_category not null,
  name text not null check (length(btrim(name)) between 2 and 120),
  description text not null default '',
  price_cents integer not null check (price_cents >= 0),
  duration_minutes integer check (duration_minutes is null or duration_minutes > 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index service_catalog_owner_category_name_uidx
  on public.service_catalog (owner_id, category, lower(name));
create index service_catalog_owner_active_sort_idx
  on public.service_catalog (owner_id, is_active, sort_order);

create table public.contract_templates (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  version integer not null check (version > 0),
  conditions jsonb not null default '[]'::jsonb check (jsonb_typeof(conditions) = 'array'),
  brand_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(brand_snapshot) = 'object'),
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_templates_owner_version_key unique (owner_id, version),
  constraint contract_templates_id_owner_key unique (id, owner_id)
);

create unique index contract_templates_one_active_per_owner_uidx
  on public.contract_templates (owner_id) where is_active;

create table public.brand_settings (
  id smallint primary key default 1 check (id = 1),
  owner_id uuid not null unique references auth.users(id) on delete restrict,
  business_name text not null default 'Anggely Kids Shows y Eventos'
    check (length(btrim(business_name)) > 0),
  phone text not null check (length(btrim(phone)) > 0),
  whatsapp text not null check (length(btrim(whatsapp)) > 0),
  social_links jsonb not null default '{}'::jsonb check (jsonb_typeof(social_links) = 'object'),
  logo_storage_path text,
  signature_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contract_counters (
  owner_id uuid not null references auth.users(id) on delete cascade,
  series text not null default 'default' check (length(btrim(series)) > 0),
  next_value integer not null default 1 check (next_value between 1 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (owner_id, series)
);

create trigger clients_set_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger service_catalog_set_updated_at
before update on public.service_catalog
for each row execute function public.set_updated_at();

create trigger contract_templates_set_updated_at
before update on public.contract_templates
for each row execute function public.set_updated_at();

create trigger brand_settings_set_updated_at
before update on public.brand_settings
for each row execute function public.set_updated_at();

create trigger contract_counters_set_updated_at
before update on public.contract_counters
for each row execute function public.set_updated_at();
