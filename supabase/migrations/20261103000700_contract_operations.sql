-- Feature 003: transactional contract operations.

-- Archived contracts keep the cancellation fields of the state they came from.
alter table public.contracts drop constraint contracts_status_requirements;

alter table public.contracts add constraint contracts_status_requirements check (
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
  (status in ('cancelled', 'annulled', 'archived') or (
    cancelled_at is null
    and cancellation_reason is null
  ))
);

create or replace function public.next_contract_number(p_owner_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_next integer;
begin
  insert into public.contract_counters (owner_id, series, next_value)
  values (p_owner_id, 'default', 1)
  on conflict (owner_id, series) do nothing;

  select next_value
  into v_next
  from public.contract_counters
  where owner_id = p_owner_id
    and series = 'default'
  for update;

  if v_next is null then
    raise exception 'contract_number_exhausted' using errcode = '22003';
  end if;

  if v_next > 99999 then
    raise exception 'contract_number_exhausted' using errcode = '22003';
  end if;

  update public.contract_counters
  set next_value = v_next + 1
  where owner_id = p_owner_id
    and series = 'default';

  return v_next;
end;
$$;

create or replace function public.build_contract_snapshot(
  p_contract public.contracts,
  p_template public.contract_templates,
  p_brand public.brand_settings
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_client public.clients;
  v_event public.events;
begin
  select *
  into v_client
  from public.clients
  where id = p_contract.client_id
    and owner_id = p_contract.owner_id;

  if not found then
    raise exception 'contract_incomplete' using errcode = '23514';
  end if;

  select *
  into v_event
  from public.events
  where id = p_contract.event_id
    and owner_id = p_contract.owner_id
    and client_id = p_contract.client_id;

  if not found then
    raise exception 'contract_incomplete' using errcode = '23514';
  end if;

  return jsonb_build_object(
    'schema_version', 1,
    'generated_at', now(),
    'template', jsonb_build_object(
      'id', p_template.id,
      'version', p_template.version,
      'conditions', p_template.conditions
    ),
    'brand', jsonb_build_object(
      'business_name', p_brand.business_name,
      'phone', p_brand.phone,
      'whatsapp', p_brand.whatsapp,
      'social_links', p_brand.social_links,
      'logo_storage_path', p_brand.logo_storage_path,
      'signature_storage_path', p_brand.signature_storage_path
    ),
    'contract', jsonb_build_object(
      'description', p_contract.description,
      'total_amount_cents', p_contract.total_amount_cents,
      'mobility_amount_cents', p_contract.mobility_amount_cents,
      'client_visible_notes', p_contract.client_visible_notes
    ),
    'client', jsonb_build_object(
      'id', v_client.id,
      'full_name', v_client.full_name,
      'phone_e164', v_client.phone_e164
    ),
    'event', jsonb_build_object(
      'id', v_event.id,
      'event_type', v_event.event_type,
      'starts_at', v_event.starts_at,
      'venue_name', v_event.venue_name,
      'venue_address', v_event.venue_address,
      'district', v_event.district,
      'city', v_event.city,
      'guest_count', v_event.guest_count
    )
  );
end;
$$;

create or replace function public.confirm_contract(
  p_contract_id uuid,
  p_expected_version integer
)
returns public.contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
  v_template public.contract_templates;
  v_brand public.brand_settings;
  v_snapshot jsonb;
  v_number integer;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status <> 'draft' then
    raise exception 'contract_invalid_transition' using errcode = '55000';
  end if;

  if v_contract.version <> p_expected_version then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  if v_contract.template_id is not null then
    select *
    into v_template
    from public.contract_templates
    where id = v_contract.template_id
      and owner_id = v_owner_id
      and is_active;

    if not found then
      raise exception 'contract_template_unavailable' using errcode = 'P0002';
    end if;
  else
    select *
    into v_template
    from public.contract_templates
    where owner_id = v_owner_id
      and is_active
    order by version desc
    limit 1;

    if not found then
      raise exception 'contract_template_unavailable' using errcode = 'P0002';
    end if;
  end if;

  select *
  into v_brand
  from public.brand_settings
  where owner_id = v_owner_id;

  if not found then
    raise exception 'contract_brand_unavailable' using errcode = 'P0002';
  end if;

  if length(btrim(v_contract.description)) = 0
     or v_contract.total_amount_cents <= 0 then
    raise exception 'contract_incomplete' using errcode = '23514';
  end if;

  v_snapshot := public.build_contract_snapshot(v_contract, v_template, v_brand);
  v_number := public.next_contract_number(v_owner_id);

  update public.contracts
  set contract_number = v_number,
      template_id = v_template.id,
      template_snapshot = v_snapshot,
      confirmed_at = now(),
      status = 'pending_signature',
      version = version + 1
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.sign_contract(
  p_contract_id uuid,
  p_expected_version integer,
  p_signed_by_name text,
  p_signed_at timestamptz default now()
)
returns public.contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if p_signed_by_name is null or length(btrim(p_signed_by_name)) = 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status <> 'pending_signature' then
    raise exception 'contract_invalid_transition' using errcode = '55000';
  end if;

  if v_contract.version <> p_expected_version then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  update public.contracts
  set signed_at = coalesce(p_signed_at, now()),
      signed_by_name = btrim(p_signed_by_name),
      status = 'signed',
      version = version + 1
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.cancel_contract(
  p_contract_id uuid,
  p_expected_version integer,
  p_reason text,
  p_cancelled_at timestamptz default now()
)
returns public.contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status not in ('draft', 'pending_signature') then
    raise exception 'contract_invalid_transition' using errcode = '55000';
  end if;

  if v_contract.version <> p_expected_version then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  update public.contracts
  set cancelled_at = coalesce(p_cancelled_at, now()),
      cancellation_reason = btrim(p_reason),
      status = 'cancelled',
      version = version + 1
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.annul_and_replace_contract(
  p_contract_id uuid,
  p_expected_version integer,
  p_reason text,
  p_cancelled_at timestamptz default now(),
  p_replacement_event_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
  v_annulled public.contracts;
  v_replacement public.contracts;
  v_replacement_event public.events;
  v_event_id uuid;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if p_reason is null or length(btrim(p_reason)) = 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status <> 'signed' then
    raise exception 'contract_invalid_transition' using errcode = '55000';
  end if;

  if v_contract.version <> p_expected_version then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  if p_replacement_event_id is not null then
    select *
    into v_replacement_event
    from public.events
    where id = p_replacement_event_id
      and owner_id = v_owner_id;

    if not found or v_replacement_event.client_id <> v_contract.client_id then
      raise exception 'replacement_event_invalid' using errcode = '23503';
    end if;
  end if;

  v_event_id := coalesce(p_replacement_event_id, v_contract.event_id);

  update public.contracts
  set cancelled_at = coalesce(p_cancelled_at, now()),
      cancellation_reason = btrim(p_reason),
      status = 'annulled',
      version = version + 1
  where id = p_contract_id
  returning * into v_annulled;

  insert into public.contracts (
    owner_id,
    client_id,
    event_id,
    template_id,
    description,
    total_amount_cents,
    mobility_amount_cents,
    client_visible_notes,
    internal_notes,
    supersedes_contract_id
  )
  values (
    v_owner_id,
    v_contract.client_id,
    v_event_id,
    v_contract.template_id,
    v_contract.description,
    v_contract.total_amount_cents,
    v_contract.mobility_amount_cents,
    v_contract.client_visible_notes,
    v_contract.internal_notes,
    v_contract.id
  )
  returning * into v_replacement;

  return jsonb_build_object(
    'annulled_contract', to_jsonb(v_annulled),
    'replacement_contract', to_jsonb(v_replacement)
  );
end;
$$;

create or replace function public.archive_contract(
  p_contract_id uuid,
  p_expected_version integer
)
returns public.contracts
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status not in ('signed', 'cancelled', 'annulled') then
    raise exception 'contract_invalid_transition' using errcode = '55000';
  end if;

  if v_contract.version <> p_expected_version then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  update public.contracts
  set status = 'archived',
      version = version + 1
  where id = p_contract_id
  returning * into v_contract;

  return v_contract;
end;
$$;

create or replace function public.record_contract_payment(
  p_contract_id uuid,
  p_amount_cents integer,
  p_kind public.payment_kind,
  p_method public.payment_method,
  p_paid_at timestamptz default now(),
  p_note text default null
)
returns public.contract_payments
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_owner_id uuid := auth.uid();
  v_contract public.contracts;
  v_payment public.contract_payments;
begin
  if v_owner_id is null then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if p_amount_cents is null or p_amount_cents <= 0 then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  if p_kind is null or p_method is null then
    raise exception 'invalid_input' using errcode = '22023';
  end if;

  select *
  into v_contract
  from public.contracts
  where id = p_contract_id
  for update;

  if not found then
    raise exception 'contract_not_found' using errcode = 'P0002';
  end if;

  if v_contract.owner_id <> v_owner_id then
    raise exception 'contract_forbidden' using errcode = '42501';
  end if;

  if v_contract.status not in ('draft', 'pending_signature', 'signed') then
    raise exception 'payment_state_not_allowed' using errcode = '55000';
  end if;

  insert into public.contract_payments (
    owner_id,
    contract_id,
    amount_cents,
    kind,
    method,
    paid_at,
    note
  )
  values (
    v_owner_id,
    p_contract_id,
    p_amount_cents,
    p_kind,
    p_method,
    coalesce(p_paid_at, now()),
    p_note
  )
  returning * into v_payment;

  return v_payment;
end;
$$;

-- Audit trigger: semantic transitions with before/after snapshots.
create or replace function public.audit_contract_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_action text;
begin
  if tg_op = 'INSERT' then
    v_action := case
      when new.supersedes_contract_id is null then 'contract.created'
      else 'contract.replacement_created'
    end;

    insert into public.contract_audit_log (owner_id, contract_id, action, changes)
    values (
      new.owner_id,
      new.id,
      v_action,
      jsonb_build_object(
        'after', jsonb_build_object(
          'status', new.status,
          'version', new.version,
          'contract_number', new.contract_number,
          'confirmed_at', new.confirmed_at,
          'signed_at', new.signed_at,
          'signed_by_name', new.signed_by_name,
          'cancelled_at', new.cancelled_at,
          'cancellation_reason', new.cancellation_reason,
          'supersedes_contract_id', new.supersedes_contract_id
        )
      )
    );

    return new;
  end if;

  if new.status is distinct from old.status then
    v_action := case new.status
      when 'pending_signature' then 'contract.confirmed'
      when 'signed' then 'contract.signed'
      when 'cancelled' then 'contract.cancelled'
      when 'annulled' then 'contract.annulled'
      when 'archived' then 'contract.archived'
      else 'contract.updated'
    end;
  else
    v_action := 'contract.updated';
  end if;

  insert into public.contract_audit_log (owner_id, contract_id, action, changes)
  values (
    new.owner_id,
    new.id,
    v_action,
    jsonb_build_object(
      'before', jsonb_build_object(
        'status', old.status,
        'version', old.version,
        'contract_number', old.contract_number,
        'confirmed_at', old.confirmed_at,
        'signed_at', old.signed_at,
        'signed_by_name', old.signed_by_name,
        'cancelled_at', old.cancelled_at,
        'cancellation_reason', old.cancellation_reason,
        'supersedes_contract_id', old.supersedes_contract_id
      ),
      'after', jsonb_build_object(
        'status', new.status,
        'version', new.version,
        'contract_number', new.contract_number,
        'confirmed_at', new.confirmed_at,
        'signed_at', new.signed_at,
        'signed_by_name', new.signed_by_name,
        'cancelled_at', new.cancelled_at,
        'cancellation_reason', new.cancellation_reason,
        'supersedes_contract_id', new.supersedes_contract_id
      )
    )
  );

  return new;
end;
$$;

-- Payments are written only through record_contract_payment.
drop policy if exists contract_payments_insert_own on public.contract_payments;
revoke insert on table public.contract_payments from authenticated;

-- Internal helpers stay hidden from API roles.
revoke execute on function public.next_contract_number(uuid) from public, anon, authenticated;
revoke execute on function public.build_contract_snapshot(
  public.contracts,
  public.contract_templates,
  public.brand_settings
) from public, anon, authenticated;

-- Public RPCs: authenticated only.
revoke execute on function public.confirm_contract(uuid, integer) from public, anon;
revoke execute on function public.sign_contract(uuid, integer, text, timestamptz) from public, anon;
revoke execute on function public.cancel_contract(uuid, integer, text, timestamptz) from public, anon;
revoke execute on function public.annul_and_replace_contract(uuid, integer, text, timestamptz, uuid) from public, anon;
revoke execute on function public.archive_contract(uuid, integer) from public, anon;
revoke execute on function public.record_contract_payment(
  uuid,
  integer,
  public.payment_kind,
  public.payment_method,
  timestamptz,
  text
) from public, anon;

grant execute on function public.confirm_contract(uuid, integer) to authenticated;
grant execute on function public.sign_contract(uuid, integer, text, timestamptz) to authenticated;
grant execute on function public.cancel_contract(uuid, integer, text, timestamptz) to authenticated;
grant execute on function public.annul_and_replace_contract(uuid, integer, text, timestamptz, uuid) to authenticated;
grant execute on function public.archive_contract(uuid, integer) to authenticated;
grant execute on function public.record_contract_payment(
  uuid,
  integer,
  public.payment_kind,
  public.payment_method,
  timestamptz,
  text
) to authenticated;
