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
  '33333333-3333-3333-3333-333333333333',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'constraints@example.test',
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
  '44444444-4444-4444-4444-444444444444',
  '33333333-3333-3333-3333-333333333333',
  'Cliente de prueba',
  '+51987654321'
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
  '55555555-5555-5555-5555-555555555555',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  'children_show',
  now() + interval '1 day',
  'Av. Siempre Viva 123'
);

insert into public.contract_templates (
  id,
  owner_id,
  version,
  conditions,
  brand_snapshot,
  is_active
)
values (
  '77777777-7777-7777-7777-777777777777',
  '33333333-3333-3333-3333-333333333333',
  1,
  '["v1"]'::jsonb,
  '{}'::jsonb,
  false
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
  '66666666-6666-6666-6666-666666666666',
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  10000,
  1
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
  '88888888-8888-8888-8888-888888888888',
  '33333333-3333-3333-3333-333333333333',
  '66666666-6666-6666-6666-666666666666',
  6000,
  'deposit',
  'cash'
);

select throws_ok(
  $$insert into public.clients (owner_id, full_name, phone_e164)
    values (
      '33333333-3333-3333-3333-333333333333',
      'Teléfono inválido',
      '12345'
    )$$,
  '23514',
  null,
  'phone_e164 rejects a non E.164 number'
);

select lives_ok(
  $$update public.contract_templates
    set is_active = true
    where id = '77777777-7777-7777-7777-777777777777'$$,
  'template activation is allowed'
);

select throws_ok(
  $$update public.contract_templates
    set conditions = '["v2"]'::jsonb
    where id = '77777777-7777-7777-7777-777777777777'$$,
  '42501',
  null,
  'template content is immutable'
);

select throws_ok(
  $$insert into public.contract_templates (
      owner_id,
      version,
      conditions,
      brand_snapshot,
      is_active
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      2,
      '["v2"]'::jsonb,
      '{}'::jsonb,
      true
    )$$,
  '23505',
  null,
  'only one active template is allowed per owner'
);

select throws_ok(
  $$insert into public.contracts (
      owner_id,
      client_id,
      event_id,
      total_amount_cents,
      mobility_amount_cents
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      100,
      200
    )$$,
  '23514',
  null,
  'mobility cannot exceed the total amount'
);

select throws_ok(
  $$insert into public.contract_payments (
      owner_id,
      contract_id,
      amount_cents,
      kind,
      method
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      '66666666-6666-6666-6666-666666666666',
      5000,
      'balance',
      'yape'
    )$$,
  '23514',
  'payment_exceeds_total',
  'a payment cannot exceed the contract total'
);

select throws_ok(
  $$update public.contracts
    set total_amount_cents = 5000,
        version = version + 1
    where id = '66666666-6666-6666-6666-666666666666'$$,
  '23514',
  'contract_total_below_paid',
  'the total cannot be reduced below paid amount'
);

select throws_ok(
  $$update public.contracts
    set description = 'sin incrementar versión'
    where id = '66666666-6666-6666-6666-666666666666'$$,
  '40001',
  'contract_version_mismatch',
  'contract updates require an incremented version'
);

select throws_ok(
  $$update public.contract_payments
    set amount_cents = 1
    where id = '88888888-8888-8888-8888-888888888888'$$,
  '42501',
  'append_only_table',
  'payments cannot be updated'
);

select throws_ok(
  $$delete from public.contract_payments
    where id = '88888888-8888-8888-8888-888888888888'$$,
  '42501',
  'immutable_table',
  'payments cannot be deleted'
);

select throws_ok(
  $$update public.contract_audit_log
    set action = 'tampered'
    where id = (select min(id) from public.contract_audit_log)$$,
  '42501',
  'append_only_table',
  'audit entries cannot be updated'
);

insert into public.contracts (
  owner_id,
  client_id,
  event_id,
  status,
  contract_number,
  template_snapshot,
  confirmed_at
)
values (
  '33333333-3333-3333-3333-333333333333',
  '44444444-4444-4444-4444-444444444444',
  '55555555-5555-5555-5555-555555555555',
  'pending_signature',
  1,
  '{}'::jsonb,
  now()
);

select throws_ok(
  $$insert into public.contracts (
      owner_id,
      client_id,
      event_id,
      status,
      contract_number,
      template_snapshot,
      confirmed_at
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      'pending_signature',
      1,
      '{}'::jsonb,
      now()
    )$$,
  '23505',
  null,
  'contract numbers are unique per owner'
);

select throws_ok(
  $$insert into public.contracts (
      owner_id,
      client_id,
      event_id,
      status,
      contract_number,
      template_snapshot,
      confirmed_at
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      'signed',
      2,
      '{}'::jsonb,
      now()
    )$$,
  '23514',
  null,
  'signed contracts require signed_at and signed_by_name'
);

select throws_ok(
  $$insert into public.contracts (
      owner_id,
      client_id,
      event_id,
      status,
      contract_number,
      template_snapshot,
      confirmed_at,
      cancelled_at
    )
    values (
      '33333333-3333-3333-3333-333333333333',
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      'cancelled',
      3,
      '{}'::jsonb,
      now(),
      now()
    )$$,
  '23514',
  null,
  'cancelled contracts require a cancellation reason'
);

select is(
  (
    select balance_cents
    from public.contract_financials
    where contract_id = '66666666-6666-6666-6666-666666666666'
  ),
  4000,
  'contract_financials returns the derived balance'
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
