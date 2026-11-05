create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  client_id uuid not null,
  event_id uuid not null,
  template_id uuid,
  contract_number integer
    check (contract_number is null or (contract_number > 0 and contract_number <= 99999)),
  status public.contract_status not null default 'draft',
  version integer not null default 1 check (version > 0),
  description text not null default '',
  total_amount_cents integer not null default 0 check (total_amount_cents >= 0),
  mobility_amount_cents integer not null default 0 check (mobility_amount_cents >= 0),
  client_visible_notes text,
  internal_notes text,
  template_snapshot jsonb
    check (template_snapshot is null or jsonb_typeof(template_snapshot) = 'object'),
  supersedes_contract_id uuid,
  signed_by_name text
    check (signed_by_name is null or length(btrim(signed_by_name)) > 0),
  signed_at timestamptz,
  signature_storage_path text,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text
    check (cancellation_reason is null or length(btrim(cancellation_reason)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_id_owner_key unique (id, owner_id),
  constraint contracts_owner_number_key unique (owner_id, contract_number),
  constraint contracts_client_owner_fkey foreign key (client_id, owner_id)
    references public.clients (id, owner_id) on delete restrict,
  constraint contracts_event_client_owner_fkey foreign key (event_id, client_id, owner_id)
    references public.events (id, client_id, owner_id) on delete restrict,
  constraint contracts_template_owner_fkey foreign key (template_id, owner_id)
    references public.contract_templates (id, owner_id) on delete restrict,
  constraint contracts_supersedes_owner_fkey foreign key (supersedes_contract_id, owner_id)
    references public.contracts (id, owner_id) on delete restrict,
  constraint contracts_supersedes_not_self
    check (supersedes_contract_id is null or supersedes_contract_id <> id),
  constraint contracts_mobility_within_total
    check (mobility_amount_cents <= total_amount_cents),
  constraint contracts_confirmation_fields_together check (
    (contract_number is null and template_snapshot is null and confirmed_at is null)
    or
    (contract_number is not null and template_snapshot is not null and confirmed_at is not null)
  ),
  constraint contracts_status_requirements check (
    (status <> 'draft' or (
      contract_number is null
      and template_snapshot is null
      and confirmed_at is null
      and signed_at is null
      and signed_by_name is null
      and signature_storage_path is null
      and cancelled_at is null
      and cancellation_reason is null
    ))
    and
    (status not in ('pending_signature', 'signed', 'annulled') or (
      contract_number is not null
      and template_snapshot is not null
      and confirmed_at is not null
    ))
    and
    (status <> 'signed' or (signed_at is not null and signed_by_name is not null))
    and
    (status not in ('cancelled', 'annulled') or (
      cancelled_at is not null
      and cancellation_reason is not null
    ))
    and
    (status in ('cancelled', 'annulled') or (
      cancelled_at is null
      and cancellation_reason is null
    ))
  )
);

create index contracts_owner_status_idx on public.contracts (owner_id, status);
create index contracts_owner_created_at_idx on public.contracts (owner_id, created_at desc);
create index contracts_client_idx on public.contracts (client_id);
create index contracts_event_idx on public.contracts (event_id);

create table public.contract_payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  contract_id uuid not null,
  amount_cents integer not null check (amount_cents > 0),
  kind public.payment_kind not null,
  method public.payment_method not null,
  paid_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_payments_contract_owner_fkey foreign key (contract_id, owner_id)
    references public.contracts (id, owner_id) on delete restrict
);

create index contract_payments_contract_paid_at_idx
  on public.contract_payments (contract_id, paid_at);
create index contract_payments_owner_paid_at_idx
  on public.contract_payments (owner_id, paid_at);

create table public.contract_documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  contract_id uuid not null,
  storage_path text not null unique,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  template_version integer not null check (template_version > 0),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contract_documents_contract_owner_fkey foreign key (contract_id, owner_id)
    references public.contracts (id, owner_id) on delete restrict,
  constraint contract_documents_contract_version_key unique (contract_id, template_version)
);

create index contract_documents_contract_idx on public.contract_documents (contract_id);

create table public.contract_audit_log (
  id bigint generated always as identity primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  contract_id uuid not null,
  action text not null check (length(btrim(action)) > 0),
  changes jsonb not null default '{}'::jsonb check (jsonb_typeof(changes) = 'object'),
  created_at timestamptz not null default now(),
  constraint contract_audit_log_contract_owner_fkey foreign key (contract_id, owner_id)
    references public.contracts (id, owner_id) on delete cascade
);

create index contract_audit_log_contract_created_at_idx
  on public.contract_audit_log (contract_id, created_at desc);
create index contract_audit_log_owner_created_at_idx
  on public.contract_audit_log (owner_id, created_at desc);

create view public.contract_financials
with (security_invoker = true)
as
select
  c.id as contract_id,
  c.owner_id,
  c.total_amount_cents,
  coalesce(sum(p.amount_cents), 0)::integer as paid_amount_cents,
  (c.total_amount_cents - coalesce(sum(p.amount_cents), 0))::integer as balance_cents
from public.contracts c
left join public.contract_payments p on p.contract_id = c.id
group by c.id, c.owner_id, c.total_amount_cents;

create trigger contracts_set_updated_at
before update on public.contracts
for each row execute function public.set_updated_at();

create trigger contract_payments_set_updated_at
before update on public.contract_payments
for each row execute function public.set_updated_at();

create trigger contract_documents_set_updated_at
before update on public.contract_documents
for each row execute function public.set_updated_at();
