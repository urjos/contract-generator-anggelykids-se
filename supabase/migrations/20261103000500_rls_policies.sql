alter table public.clients enable row level security;
alter table public.events enable row level security;
alter table public.service_catalog enable row level security;
alter table public.contract_templates enable row level security;
alter table public.contracts enable row level security;
alter table public.contract_payments enable row level security;
alter table public.contract_documents enable row level security;
alter table public.contract_audit_log enable row level security;
alter table public.contract_counters enable row level security;
alter table public.brand_settings enable row level security;

revoke all on table
  public.clients,
  public.events,
  public.service_catalog,
  public.contract_templates,
  public.contracts,
  public.contract_payments,
  public.contract_documents,
  public.contract_audit_log,
  public.contract_counters,
  public.brand_settings,
  public.contract_financials
from anon;

revoke all on table
  public.clients,
  public.events,
  public.service_catalog,
  public.contract_templates,
  public.contracts,
  public.contract_payments,
  public.contract_documents,
  public.contract_audit_log,
  public.contract_counters,
  public.brand_settings,
  public.contract_financials
from authenticated;

revoke all on sequence public.contract_audit_log_id_seq from anon, authenticated;

grant select, insert, update, delete on table public.clients to authenticated;
grant select, insert, update, delete on table public.events to authenticated;
grant select, insert, update on table public.service_catalog to authenticated;
grant select, insert, update on table public.contract_templates to authenticated;
grant select, insert, update, delete on table public.contracts to authenticated;
grant select, insert on table public.contract_payments to authenticated;
grant select on table public.contract_documents to authenticated;
grant select on table public.contract_audit_log to authenticated;
grant select on table public.brand_settings to authenticated;
grant select on table public.contract_financials to authenticated;

grant all on table
  public.clients,
  public.events,
  public.service_catalog,
  public.contract_templates,
  public.contracts,
  public.contract_payments,
  public.contract_documents,
  public.contract_audit_log,
  public.contract_counters,
  public.brand_settings,
  public.contract_financials
to service_role;

grant all on sequence public.contract_audit_log_id_seq to service_role;

create policy clients_select_own
on public.clients for select
to authenticated
using (owner_id = (select auth.uid()));

create policy clients_insert_own
on public.clients for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy clients_update_own
on public.clients for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy clients_delete_own
on public.clients for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy events_select_own
on public.events for select
to authenticated
using (owner_id = (select auth.uid()));

create policy events_insert_own
on public.events for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy events_update_own
on public.events for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy events_delete_own
on public.events for delete
to authenticated
using (owner_id = (select auth.uid()));

create policy service_catalog_select_own
on public.service_catalog for select
to authenticated
using (owner_id = (select auth.uid()));

create policy service_catalog_insert_own
on public.service_catalog for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy service_catalog_update_own
on public.service_catalog for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy contract_templates_select_own
on public.contract_templates for select
to authenticated
using (owner_id = (select auth.uid()));

create policy contract_templates_insert_own
on public.contract_templates for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy contract_templates_update_own
on public.contract_templates for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy contracts_select_own
on public.contracts for select
to authenticated
using (owner_id = (select auth.uid()));

create policy contracts_insert_own_draft
on public.contracts for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and status = 'draft'
  and contract_number is null
  and confirmed_at is null
  and template_snapshot is null
  and signed_at is null
  and signed_by_name is null
  and signature_storage_path is null
  and cancelled_at is null
  and cancellation_reason is null
);

create policy contracts_update_own_draft
on public.contracts for update
to authenticated
using (
  owner_id = (select auth.uid())
  and status = 'draft'
)
with check (
  owner_id = (select auth.uid())
  and status = 'draft'
  and contract_number is null
  and confirmed_at is null
  and template_snapshot is null
  and signed_at is null
  and signed_by_name is null
  and signature_storage_path is null
  and cancelled_at is null
  and cancellation_reason is null
);

create policy contracts_delete_own_draft
on public.contracts for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and status = 'draft'
  and not exists (
    select 1
    from public.contract_payments p
    where p.contract_id = contracts.id
  )
  and not exists (
    select 1
    from public.contract_documents d
    where d.contract_id = contracts.id
  )
);

create policy contract_payments_select_own
on public.contract_payments for select
to authenticated
using (owner_id = (select auth.uid()));

create policy contract_payments_insert_own
on public.contract_payments for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1
    from public.contracts c
    where c.id = contract_payments.contract_id
      and c.owner_id = (select auth.uid())
  )
);

create policy contract_documents_select_own
on public.contract_documents for select
to authenticated
using (owner_id = (select auth.uid()));

create policy contract_audit_log_select_own
on public.contract_audit_log for select
to authenticated
using (owner_id = (select auth.uid()));

create policy brand_settings_select_own
on public.brand_settings for select
to authenticated
using (owner_id = (select auth.uid()));

create policy brand_settings_insert_own
on public.brand_settings for insert
to authenticated
with check (
  id = 1
  and owner_id = (select auth.uid())
);

create policy brand_settings_update_own
on public.brand_settings for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  id = 1
  and owner_id = (select auth.uid())
);
