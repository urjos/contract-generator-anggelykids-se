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
    'a3333333-3333-3333-3333-333333333333',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'read-owner@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'b4444444-4444-4444-4444-444444444444',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'read-other@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  )
on conflict (id) do nothing;

insert into public.clients (id, owner_id, full_name, phone_e164)
values
  (
    'c3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'Cliente Lectura',
    '+51987650033'
  ),
  (
    'c4444444-4444-4444-4444-444444444444',
    'b4444444-4444-4444-4444-444444444444',
    'Cliente Lectura Ajena',
    '+51987650044'
  );

insert into public.events (
  id,
  owner_id,
  client_id,
  event_type,
  starts_at,
  venue_address,
  venue_name,
  district,
  city,
  guest_count
)
values
  (
    'e3333333-3333-3333-3333-333333333333',
    'a3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'children_show',
    '2026-12-01T18:00:00Z',
    'Av. Lectura 123',
    'Salón Lectura',
    'Miraflores',
    'Lima',
    30
  ),
  (
    'e4444444-4444-4444-4444-444444444444',
    'b4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'private_show',
    '2026-12-02T18:00:00Z',
    'Av. Ajena 456',
    null,
    null,
    null,
    null
  );

insert into public.contracts (
  id,
  owner_id,
  client_id,
  event_id,
  status,
  contract_number,
  template_snapshot,
  confirmed_at,
  description,
  total_amount_cents,
  client_visible_notes,
  internal_notes
)
values
  (
    'd3333333-0000-0000-0000-000000000001',
    'a3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'e3333333-3333-3333-3333-333333333333',
    'pending_signature',
    1,
    '{}'::jsonb,
    now(),
    'Contrato lectura uno',
    10000,
    'Nota visible uno',
    'Nota interna uno'
  ),
  (
    'd3333333-0000-0000-0000-000000000002',
    'a3333333-3333-3333-3333-333333333333',
    'c3333333-3333-3333-3333-333333333333',
    'e3333333-3333-3333-3333-333333333333',
    'pending_signature',
    2,
    '{}'::jsonb,
    now(),
    'Contrato lectura dos',
    20000,
    null,
    null
  ),
  (
    'd4444444-0000-0000-0000-000000000001',
    'b4444444-4444-4444-4444-444444444444',
    'c4444444-4444-4444-4444-444444444444',
    'e4444444-4444-4444-4444-444444444444',
    'pending_signature',
    1,
    '{}'::jsonb,
    now(),
    'Contrato ajeno',
    30000,
    null,
    null
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
  'd3333333-0000-0000-0000-0000000000a1',
  'a3333333-3333-3333-3333-333333333333',
  'd3333333-0000-0000-0000-000000000002',
  5000,
  'deposit',
  'cash'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a3333333-3333-3333-3333-333333333333","role":"authenticated"}'::text,
  true
);

select is(
  (select count(*)::int from public.contract_overview),
  2,
  'the read model returns only the owner contracts'
);
select is(
  (
    select paid_amount_cents
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  0,
  'a contract without payments reports zero paid'
);
select is(
  (
    select balance_cents
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  10000,
  'a contract without payments reports the full balance'
);
select is(
  (
    select paid_amount_cents
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000002'
  ),
  5000,
  'the read model exposes the derived paid amount'
);
select is(
  (
    select balance_cents
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000002'
  ),
  15000,
  'the read model exposes the derived balance'
);
select is(
  (
    select client_name
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  'Cliente Lectura',
  'the read model includes the client name'
);
select is(
  (
    select client_phone
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  '+51987650033',
  'the read model includes the client phone'
);
select is(
  (
    select event_type::text
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  'children_show',
  'the read model includes the event type'
);
select is(
  (
    select venue_name
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  'Salón Lectura',
  'the read model includes the venue name'
);
select is(
  (
    select count(*)::int
    from public.contract_overview
    where contract_id = 'd4444444-0000-0000-0000-000000000001'
  ),
  0,
  'the read model hides contracts of other owners'
);
select is(
  (
    select count(*)::int
    from public.contract_overview
    where contract_number = 2
  ),
  1,
  'contracts can be filtered by number'
);
select is(
  (
    select count(*)::int
    from public.contract_overview
    where status = 'pending_signature'
  ),
  2,
  'contracts can be filtered by status'
);
select is(
  (
    select count(*)::int
    from public.contract_overview
    where client_phone = '+51987650033'
  ),
  2,
  'contracts can be filtered by client phone'
);
select is(
  (
    select description
    from public.contract_overview
    where contract_number = 1
  ),
  'Contrato lectura uno',
  'contracts can be filtered and read by number'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"b4444444-4444-4444-4444-444444444444","role":"authenticated"}'::text,
  true
);

select is(
  (select count(*)::int from public.contract_overview),
  1,
  'another owner only sees their own read model rows'
);
select is(
  (
    select contract_number
    from public.contract_overview
    limit 1
  ),
  1,
  'another owner sees their own contract number'
);
select is(
  (
    select count(*)::int
    from public.contract_overview
    where contract_id = 'd3333333-0000-0000-0000-000000000001'
  ),
  0,
  'another owner cannot see the first owner contract'
);

reset role;

set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}'::text, true);

select throws_ok(
  'select count(*) from public.contract_overview',
  '42501',
  null,
  'anon cannot read the contract read model'
);

reset role;

do $$
begin
  if extensions.num_failed() > 0 then
    raise exception 'pgTAP failed: % assertion(s)', extensions.num_failed();
  end if;
end;
$$;

select * from finish();
rollback;
