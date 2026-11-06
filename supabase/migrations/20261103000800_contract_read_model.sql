-- Feature 003: contract read model.

create or replace view public.contract_overview
with (security_invoker = true)
as
select
  c.id as contract_id,
  c.owner_id,
  c.contract_number,
  c.status,
  c.version,
  c.description,
  c.total_amount_cents,
  c.mobility_amount_cents,
  coalesce(f.paid_amount_cents, 0)::integer as paid_amount_cents,
  coalesce(f.balance_cents, c.total_amount_cents)::integer as balance_cents,
  cl.full_name as client_name,
  cl.phone_e164 as client_phone,
  e.starts_at as event_starts_at,
  e.event_type,
  e.venue_name,
  e.venue_address,
  e.district,
  e.city,
  e.guest_count,
  c.client_visible_notes,
  c.internal_notes,
  c.template_id,
  c.template_snapshot,
  c.supersedes_contract_id,
  c.confirmed_at,
  c.signed_at,
  c.cancelled_at,
  c.cancellation_reason,
  c.created_at,
  c.updated_at
from public.contracts c
join public.clients cl
  on cl.id = c.client_id
  and cl.owner_id = c.owner_id
join public.events e
  on e.id = c.event_id
  and e.client_id = c.client_id
  and e.owner_id = c.owner_id
left join public.contract_financials f
  on f.contract_id = c.id;

revoke all on table public.contract_overview from public, anon, authenticated;
grant select on table public.contract_overview to authenticated;
grant select on table public.contract_overview to service_role;
