begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '99999999-9999-9999-9999-999999999999',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'audit@example.test',
  '',
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(),
  now()
)
on conflict (id) do nothing;

insert into public.clients (id, owner_id, full_name, phone_e164)
values (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '99999999-9999-9999-9999-999999999999',
  'Cliente de auditoría',
  '+51987654322'
);

insert into public.events (
  id,
  owner_id,
  client_id,
  event_type,
  starts_at,
  venue_address
)
values (
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'private_show',
  now() + interval '2 days',
  'Jr. Auditoría 456'
);

insert into public.contracts (
  id,
  owner_id,
  client_id,
  event_id,
  total_amount_cents,
  version
)
values (
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  '99999999-9999-9999-9999-999999999999',
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  10000,
  1
);

select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    order by id desc
    limit 1
  ),
  'contract.created',
  'creating a contract writes an audit entry'
);

update public.contracts
set description = 'Contrato actualizado',
    version = 2
where id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    order by id desc
    limit 1
  ),
  'contract.updated',
  'updating a contract writes an audit entry'
);

select is(
  (
    select (changes->'after'->>'version')::int
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
      and action = 'contract.updated'
    order by id desc
    limit 1
  ),
  2,
  'audit entry stores the updated version'
);

insert into public.contract_payments (
  id,
  owner_id,
  contract_id,
  amount_cents,
  kind,
  method
)
values (
  'dddddddd-dddd-dddd-dddd-dddddddddddd',
  '99999999-9999-9999-9999-999999999999',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  1000,
  'deposit',
  'plin'
);

select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    order by id desc
    limit 1
  ),
  'payment.recorded',
  'recording a payment writes an audit entry'
);

select is(
  (
    select (changes->>'amount_cents')::int
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
      and action = 'payment.recorded'
    order by id desc
    limit 1
  ),
  1000,
  'payment audit entry stores the amount'
);

insert into public.contract_documents (
  id,
  owner_id,
  contract_id,
  storage_path,
  sha256,
  template_version
)
values (
  'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  '99999999-9999-9999-9999-999999999999',
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'cccccccc-cccc-cccc-cccc-cccccccccccc/1/documento.pdf',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  1
);

select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    order by id desc
    limit 1
  ),
  'document.generated',
  'registering a document writes an audit entry'
);

select cmp_ok(
  (
    select count(*)::int
    from public.contract_audit_log
    where contract_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
  ),
  '>=',
  4,
  'contract audit entries are appended'
);

do $$
begin
  if extensions.num_failed() > 0 then
    raise exception 'pgTAP failed: % assertion(s)', extensions.num_failed();
  end if;
end;
$$;

select * from finish();
rollback;
