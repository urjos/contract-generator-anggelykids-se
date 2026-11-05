create or replace function public.enforce_contract_version()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.version <> old.version + 1 then
    raise exception 'contract_version_mismatch' using errcode = '40001';
  end if;

  if new.owner_id is distinct from old.owner_id
     or new.created_at is distinct from old.created_at then
    raise exception 'contract_immutable_fields' using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_contract_amounts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_paid bigint;
begin
  select coalesce(sum(p.amount_cents), 0)
  into v_paid
  from public.contract_payments p
  where p.contract_id = new.id;

  if new.total_amount_cents < v_paid then
    raise exception 'contract_total_below_paid' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_payment_total()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_total integer;
  v_paid bigint;
begin
  select c.total_amount_cents
  into v_total
  from public.contracts c
  where c.id = new.contract_id
    and c.owner_id = new.owner_id
  for update;

  if v_total is null then
    raise exception 'contract_not_found' using errcode = '23503';
  end if;

  select coalesce(sum(p.amount_cents), 0)
  into v_paid
  from public.contract_payments p
  where p.contract_id = new.contract_id;

  if v_paid + new.amount_cents > v_total then
    raise exception 'payment_exceeds_total' using errcode = '23514';
  end if;

  return new;
end;
$$;

create or replace function public.prevent_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'append_only_table' using errcode = '42501';
end;
$$;

create or replace function public.prevent_delete()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'immutable_table' using errcode = '42501';
end;
$$;

create or replace function public.enforce_template_immutability()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.owner_id is distinct from old.owner_id
     or new.version is distinct from old.version
     or new.conditions is distinct from old.conditions
     or new.brand_snapshot is distinct from old.brand_snapshot
     or new.created_at is distinct from old.created_at then
    raise exception 'contract_template_immutable' using errcode = '42501';
  end if;

  return new;
end;
$$;

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
    insert into public.contract_audit_log (owner_id, contract_id, action, changes)
    values (
      new.owner_id,
      new.id,
      'contract.created',
      jsonb_build_object(
        'status', new.status,
        'version', new.version,
        'total_amount_cents', new.total_amount_cents
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
        'total_amount_cents', old.total_amount_cents
      ),
      'after', jsonb_build_object(
        'status', new.status,
        'version', new.version,
        'contract_number', new.contract_number,
        'total_amount_cents', new.total_amount_cents
      )
    )
  );

  return new;
end;
$$;

create or replace function public.audit_payment_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.contract_audit_log (owner_id, contract_id, action, changes)
  values (
    new.owner_id,
    new.contract_id,
    'payment.recorded',
    jsonb_build_object(
      'payment_id', new.id,
      'amount_cents', new.amount_cents,
      'kind', new.kind,
      'method', new.method,
      'paid_at', new.paid_at
    )
  );

  return new;
end;
$$;

create or replace function public.audit_document_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.contract_audit_log (owner_id, contract_id, action, changes)
  values (
    new.owner_id,
    new.contract_id,
    'document.generated',
    jsonb_build_object(
      'document_id', new.id,
      'template_version', new.template_version
    )
  );

  return new;
end;
$$;

create trigger contracts_enforce_version
before update on public.contracts
for each row execute function public.enforce_contract_version();

create trigger contracts_enforce_amounts
before update of total_amount_cents on public.contracts
for each row execute function public.enforce_contract_amounts();

create trigger contracts_audit
after insert or update on public.contracts
for each row execute function public.audit_contract_change();

create trigger contract_payments_enforce_total
before insert on public.contract_payments
for each row execute function public.enforce_payment_total();

create trigger contract_payments_prevent_update
before update on public.contract_payments
for each row execute function public.prevent_update();

create trigger contract_payments_prevent_delete
before delete on public.contract_payments
for each row execute function public.prevent_delete();

create trigger contract_payments_audit
after insert on public.contract_payments
for each row execute function public.audit_payment_change();

create trigger contract_documents_prevent_update
before update on public.contract_documents
for each row execute function public.prevent_update();

create trigger contract_documents_prevent_delete
before delete on public.contract_documents
for each row execute function public.prevent_delete();

create trigger contract_documents_audit
after insert on public.contract_documents
for each row execute function public.audit_document_change();

create trigger contract_audit_log_prevent_update
before update on public.contract_audit_log
for each row execute function public.prevent_update();

create trigger contract_templates_prevent_delete
before delete on public.contract_templates
for each row execute function public.prevent_delete();

create trigger contract_templates_enforce_immutability
before update on public.contract_templates
for each row execute function public.enforce_template_immutability();
