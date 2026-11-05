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
values
  (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'other@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}'::text, true);
select throws_ok(
  'select count(*) from public.clients',
  '42501',
  null,
  'anon cannot read clients'
);
select throws_ok(
  'select count(*) from public.contracts',
  '42501',
  null,
  'anon cannot read contracts'
);
reset role;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$insert into public.clients (full_name, phone_e164)
    values ('Cliente Uno', '+51987654321')$$,
  'owner can insert a client'
);

select is(
  (select count(*)::int from public.clients),
  1,
  'owner sees own clients'
);

select lives_ok(
  $$insert into public.events (client_id, event_type, starts_at, venue_address)
    select id, 'children_show', now() + interval '1 day', 'Av. Siempre Viva 123'
    from public.clients
    limit 1$$,
  'owner can insert an event'
);

select lives_ok(
  $$insert into public.contracts (client_id, event_id, description, total_amount_cents)
    select e.client_id, e.id, 'Contrato borrador', 10000
    from public.events e
    limit 1$$,
  'owner can insert a draft contract'
);

select throws_ok(
  $$insert into public.contracts (
      client_id,
      event_id,
      status,
      contract_number,
      template_snapshot,
      confirmed_at
    )
    select e.client_id, e.id, 'pending_signature', 1, '{}'::jsonb, now()
    from public.events e
    limit 1$$,
  '42501',
  null,
  'client cannot insert a confirmed contract'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}'::text,
  true
);

select is(
  (select count(*)::int from public.clients),
  0,
  'other user cannot see clients'
);

select is(
  (select count(*)::int from public.contracts),
  0,
  'other user cannot see contracts'
);

select throws_ok(
  $$insert into public.clients (owner_id, full_name, phone_e164)
    values (
      '11111111-1111-1111-1111-111111111111',
      'Intruso',
      '+51911111111'
    )$$,
  '42501',
  null,
  'other user cannot insert a client for the owner'
);

reset role;

insert into public.contracts (
  owner_id,
  client_id,
  event_id,
  status,
  contract_number,
  template_snapshot,
  confirmed_at,
  version
)
select
  '11111111-1111-1111-1111-111111111111',
  e.client_id,
  e.id,
  'pending_signature',
  1,
  '{}'::jsonb,
  now(),
  1
from public.events e
where e.owner_id = '11111111-1111-1111-1111-111111111111'
limit 1;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

with updated as (
  update public.contracts
  set version = version + 1
  where contract_number = 1
  returning 1
)
select is(
  (select count(*) from updated),
  0::bigint,
  'confirmed contract cannot be updated by the client'
);

with deleted as (
  delete from public.contracts
  where contract_number = 1
  returning 1
)
select is(
  (select count(*) from deleted),
  0::bigint,
  'confirmed contract cannot be deleted by the client'
);

select lives_ok(
  $$insert into public.contract_payments (contract_id, amount_cents, kind, method)
    select id, 5000, 'deposit', 'cash'
    from public.contracts
    where status = 'draft'
    limit 1$$,
  'owner can record a deposit on a draft'
);

with deleted as (
  delete from public.contracts
  where status = 'draft'
  returning 1
)
select is(
  (select count(*) from deleted),
  0::bigint,
  'draft with a payment cannot be deleted'
);

select cmp_ok(
  (select count(*)::int from public.contract_audit_log),
  '>',
  0,
  'audit log is populated'
);

select throws_ok(
  'select count(*) from public.contract_counters',
  '42501',
  null,
  'contract counters are not directly accessible'
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
