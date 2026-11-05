-- Feature 002: enums and shared helpers.

create type public.contract_status as enum (
  'draft',
  'pending_signature',
  'signed',
  'cancelled',
  'annulled',
  'archived'
);

create type public.payment_kind as enum (
  'deposit',
  'balance'
);

create type public.payment_method as enum (
  'cash',
  'yape',
  'plin',
  'bank_transfer',
  'other'
);

create type public.service_category as enum (
  'classic_themed',
  'huntrix',
  'sensory_stimulation',
  'christmas',
  'other'
);

create type public.event_type as enum (
  'children_show',
  'private_show',
  'hora_loca',
  'other'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Mantiene updated_at en la hora actual para tablas mutables.';
