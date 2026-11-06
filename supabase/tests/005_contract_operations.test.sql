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
    'a1111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operations-owner@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'operations-other@example.test',
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
    'c1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'Cliente Operaciones',
    '+51987650011'
  ),
  (
    'c2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'Cliente Ajeno',
    '+51987650022'
  );

insert into public.events (
  id,
  owner_id,
  client_id,
  event_type,
  starts_at,
  venue_address
)
values
  (
    'e1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    'children_show',
    now() + interval '5 days',
    'Av. Operaciones 123'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'c2222222-2222-2222-2222-222222222222',
    'private_show',
    now() + interval '6 days',
    'Av. Ajena 456'
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
  'f1111111-1111-1111-1111-111111111111',
  'a1111111-1111-1111-1111-111111111111',
  1,
  '["Condición de prueba"]'::jsonb,
  '{}'::jsonb,
  true
);

insert into public.brand_settings (id, owner_id, business_name, phone, whatsapp)
values (1, 'a1111111-1111-1111-1111-111111111111', 'Marca Test', '+51900000000', '+51900000000')
on conflict (id) do update
set owner_id = excluded.owner_id,
    business_name = excluded.business_name,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp;

insert into public.contracts (
  id,
  owner_id,
  client_id,
  event_id,
  description,
  total_amount_cents,
  mobility_amount_cents,
  client_visible_notes,
  internal_notes
)
values
  ('d0000000-0000-0000-0000-000000000001', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato uno', 10000, 1000, 'Nota pública 1', 'Nota interna 1'),
  ('d0000000-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato dos', 11000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato tres', 12000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000004', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato cuatro', 12000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000005', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato cinco', 13000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000006', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', '', 14000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000007', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato siete', 15000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000008', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato ocho', 16000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000009', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato nueve', 17000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000010', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato diez', 18000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000011', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato once', 19000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000012', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato doce', 20000, 2000, 'Nota pública 12', 'Nota interna 12'),
  ('d0000000-0000-0000-0000-000000000013', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato trece', 21000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000014', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato catorce', 22000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000015', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato quince', 23000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000016', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato dieciséis', 24000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000017', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato diecisiete', 25000, 0, null, null),
  ('d0000000-0000-0000-0000-000000000018', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato dieciocho', 0, 0, null, null),
  ('d0000000-0000-0000-0000-000000000019', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Contrato diecinueve', 26000, 0, null, null),
  ('d0000000-0000-0000-0000-0000000000b1', 'b2222222-2222-2222-2222-222222222222', 'c2222222-2222-2222-2222-222222222222', 'e2222222-2222-2222-2222-222222222222', 'Contrato B', 27000, 0, null, null);

-- Confirmation: gapless numbering 1, 2, 3.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000001', 1)$$,
  'confirming a draft assigns the first number'
);
select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000002', 1)$$,
  'confirming a second draft assigns the second number'
);
select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000003', 1)$$,
  'confirming a third draft assigns the third number'
);

reset role;

select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000001'),
  1,
  'first contract gets number 1'
);
select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000002'),
  2,
  'second contract gets number 2'
);
select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000003'),
  3,
  'third contract gets number 3'
);
select is(
  (
    select status::text
    from public.contracts
    where id = 'd0000000-0000-0000-0000-000000000001'
  ),
  'pending_signature',
  'confirmation moves the contract to pending_signature'
);
select is(
  (select version from public.contracts where id = 'd0000000-0000-0000-0000-000000000001'),
  2,
  'confirmation increments the version'
);
select isnt(
  (select confirmed_at from public.contracts where id = 'd0000000-0000-0000-0000-000000000001'),
  null,
  'confirmation sets confirmed_at'
);
select isnt(
  (
    select template_snapshot
    from public.contracts
    where id = 'd0000000-0000-0000-0000-000000000001'
  ),
  null,
  'confirmation stores the template snapshot'
);
select is(
  (
    select template_snapshot->'template'->>'version'
    from public.contracts
    where id = 'd0000000-0000-0000-0000-000000000001'
  ),
  '1',
  'snapshot captures the template version'
);
select is(
  (
    select template_snapshot->'brand'->>'business_name'
    from public.contracts
    where id = 'd0000000-0000-0000-0000-000000000001'
  ),
  'Marca Test',
  'snapshot captures the brand name'
);
select is(
  (
    select template_snapshot->'contract'->>'description'
    from public.contracts
    where id = 'd0000000-0000-0000-0000-000000000001'
  ),
  'Contrato uno',
  'snapshot captures the contract description'
);
select is(
  (
    select count(*)::int
    from public.contract_audit_log
    where contract_id = 'd0000000-0000-0000-0000-000000000001'
      and action = 'contract.confirmed'
  ),
  1,
  'confirmation writes a single semantic audit entry'
);

-- Version conflict.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000004', 99)$$,
  null,
  'contract_version_mismatch',
  'confirming with the wrong version is rejected'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000004'),
  'draft',
  'a version conflict leaves the contract untouched'
);

-- Missing active template.
update public.contract_templates
set is_active = false
where id = 'f1111111-1111-1111-1111-111111111111';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000004', 1)$$,
  null,
  'contract_template_unavailable',
  'confirmation requires an active template'
);

reset role;

update public.contract_templates
set is_active = true
where id = 'f1111111-1111-1111-1111-111111111111';

-- Missing brand settings.
delete from public.brand_settings where id = 1;

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000004', 1)$$,
  null,
  'contract_brand_unavailable',
  'confirmation requires brand settings'
);

reset role;

insert into public.brand_settings (id, owner_id, business_name, phone, whatsapp)
values (1, 'a1111111-1111-1111-1111-111111111111', 'Marca Test', '+51900000000', '+51900000000')
on conflict (id) do update
set owner_id = excluded.owner_id,
    business_name = excluded.business_name,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp;

-- Invalid transition.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000005', 1)$$,
  'confirming a draft once succeeds'
);
select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000005', 2)$$,
  null,
  'contract_invalid_transition',
  'confirming a non-draft contract is rejected'
);

reset role;

select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000005'),
  4,
  'the fourth confirmed contract gets number 4'
);

-- Rollback must not consume a number.
do $$
begin
  perform public.next_contract_number('a1111111-1111-1111-1111-111111111111');
  raise exception 'forced rollback';
exception
  when others then null;
end;
$$;

select is(
  (
    select next_value
    from public.contract_counters
    where owner_id = 'a1111111-1111-1111-1111-111111111111'
      and series = 'default'
  ),
  5,
  'a rolled back counter increment is not consumed'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000004', 1)$$,
  'the next confirmation reuses the rolled back number'
);

reset role;

select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000004'),
  5,
  'rollback does not skip a number'
);

-- Incomplete contract.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000006', 1)$$,
  null,
  'contract_incomplete',
  'confirmation rejects an empty description'
);
select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000018', 1)$$,
  null,
  'contract_incomplete',
  'confirmation rejects a zero total'
);

-- Signature.
select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000008', 1)$$,
  'confirming the signature fixture succeeds'
);
select lives_ok(
  $$select public.sign_contract(
      'd0000000-0000-0000-0000-000000000008',
      2,
      'María Cliente',
      '2026-11-05T12:00:00Z'
    )$$,
  'signing a pending contract succeeds'
);
select throws_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000011', 1, 'Otro')$$,
  null,
  'contract_invalid_transition',
  'signing a draft is rejected'
);
select throws_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000008', 3, 'Otro')$$,
  null,
  'contract_invalid_transition',
  'signing an already signed contract is rejected'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000008'),
  'signed',
  'signing moves the contract to signed'
);
select is(
  (select signed_by_name from public.contracts where id = 'd0000000-0000-0000-0000-000000000008'),
  'María Cliente',
  'signing stores the signer name'
);
select isnt(
  (select signed_at from public.contracts where id = 'd0000000-0000-0000-0000-000000000008'),
  null,
  'signing stores the signature date'
);
select is(
  (
    select count(*)::int
    from public.contract_audit_log
    where contract_id = 'd0000000-0000-0000-0000-000000000008'
      and action = 'contract.signed'
  ),
  1,
  'signing writes a semantic audit entry'
);

-- Cancellation.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.cancel_contract(
      'd0000000-0000-0000-0000-000000000009',
      1,
      'Cliente desistió',
      '2026-11-06T10:00:00Z'
    )$$,
  'cancelling a draft succeeds'
);
select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000010', 1)$$,
  'confirming the pending cancellation fixture succeeds'
);
select lives_ok(
  $$select public.cancel_contract(
      'd0000000-0000-0000-0000-000000000010',
      2,
      'Sin respuesta'
    )$$,
  'cancelling a pending contract succeeds'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000009'),
  'cancelled',
  'cancelling a draft moves it to cancelled'
);
select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000009'),
  null::integer,
  'a cancelled draft keeps a null number'
);
select is(
  (select cancellation_reason from public.contracts where id = 'd0000000-0000-0000-0000-000000000009'),
  'Cliente desistió',
  'cancellation stores the reason'
);
select is(
  (select contract_number from public.contracts where id = 'd0000000-0000-0000-0000-000000000010'),
  7,
  'a cancelled pending contract keeps its number'
);
select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000010'),
  'cancelled',
  'a pending contract can be cancelled'
);

-- Annulment with replacement.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000012', 1)$$,
  'confirming the replacement fixture succeeds'
);
select lives_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000012', 2, 'Cliente Doce')$$,
  'signing the replacement fixture succeeds'
);
select lives_ok(
  $$select public.annul_and_replace_contract(
      'd0000000-0000-0000-0000-000000000012',
      3,
      'Error en la fecha'
    )$$,
  'annulling a signed contract creates a replacement'
);
select throws_ok(
  $$select public.annul_and_replace_contract(
      'd0000000-0000-0000-0000-000000000009',
      2,
      'No firmado'
    )$$,
  null,
  'contract_invalid_transition',
  'annulling a non-signed contract is rejected'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000012'),
  'annulled',
  'annulment moves the original contract to annulled'
);
select is(
  (select count(*)::int from public.contracts where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'),
  1,
  'annulment creates exactly one replacement draft'
);
select is(
  (
    select status::text
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  'draft',
  'the replacement starts as a draft'
);
select is(
  (
    select contract_number
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  null::integer,
  'the replacement has no number yet'
);
select is(
  (
    select template_snapshot
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  null::jsonb,
  'the replacement has no frozen snapshot yet'
);
select is(
  (
    select total_amount_cents
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  20000,
  'the replacement copies the total amount'
);
select is(
  (
    select mobility_amount_cents
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  2000,
  'the replacement copies the mobility amount'
);
select is(
  (
    select client_visible_notes
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  'Nota pública 12',
  'the replacement copies visible notes'
);
select is(
  (
    select event_id
    from public.contracts
    where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
  ),
  'e1111111-1111-1111-1111-111111111111'::uuid,
  'the replacement reuses the original event by default'
);
select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = 'd0000000-0000-0000-0000-000000000012'
    order by id desc
    limit 1
  ),
  'contract.annulled',
  'annulment writes a semantic audit entry'
);
select is(
  (
    select action
    from public.contract_audit_log
    where contract_id = (
      select id
      from public.contracts
      where supersedes_contract_id = 'd0000000-0000-0000-0000-000000000012'
    )
    order by id desc
    limit 1
  ),
  'contract.replacement_created',
  'the replacement creation is audited distinctly'
);

-- Invalid replacement event.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000019', 1)$$,
  'confirming the invalid replacement fixture succeeds'
);
select lives_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000019', 2, 'Cliente Diecinueve')$$,
  'signing the invalid replacement fixture succeeds'
);
select throws_ok(
  $$select public.annul_and_replace_contract(
      'd0000000-0000-0000-0000-000000000019',
      3,
      'Evento ajeno',
      now(),
      'e2222222-2222-2222-2222-222222222222'
    )$$,
  null,
  'replacement_event_invalid',
  'annulment rejects a replacement event of another owner'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000019'),
  'signed',
  'a rejected replacement leaves the original signed'
);

-- Archival.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000013', 1)$$,
  'confirming the signed archive fixture succeeds'
);
select lives_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000013', 2, 'Cliente Trece')$$,
  'signing the signed archive fixture succeeds'
);
select lives_ok(
  $$select public.archive_contract('d0000000-0000-0000-0000-000000000013', 3)$$,
  'archiving a signed contract succeeds'
);
select lives_ok(
  $$select public.cancel_contract('d0000000-0000-0000-0000-000000000014', 1, 'Cancelado')$$,
  'cancelling the archive fixture succeeds'
);
select lives_ok(
  $$select public.archive_contract('d0000000-0000-0000-0000-000000000014', 2)$$,
  'archiving a cancelled contract succeeds'
);
select lives_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000015', 1)$$,
  'confirming the annulled archive fixture succeeds'
);
select lives_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000015', 2, 'Cliente Quince')$$,
  'signing the annulled archive fixture succeeds'
);
select lives_ok(
  $$select public.annul_and_replace_contract(
      'd0000000-0000-0000-0000-000000000015',
      3,
      'Reemplazo'
    )$$,
  'annulling the archive fixture succeeds'
);
select lives_ok(
  $$select public.archive_contract('d0000000-0000-0000-0000-000000000015', 4)$$,
  'archiving an annulled contract succeeds'
);
select throws_ok(
  $$select public.archive_contract('d0000000-0000-0000-0000-000000000016', 1)$$,
  null,
  'contract_invalid_transition',
  'archiving a draft is rejected'
);

reset role;

select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000013'),
  'archived',
  'a signed contract can be archived'
);
select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000014'),
  'archived',
  'a cancelled contract can be archived'
);
select is(
  (select cancellation_reason from public.contracts where id = 'd0000000-0000-0000-0000-000000000014'),
  'Cancelado',
  'archiving keeps the cancellation reason'
);
select is(
  (select status::text from public.contracts where id = 'd0000000-0000-0000-0000-000000000015'),
  'archived',
  'an annulled contract can be archived'
);
select is(
  (
    select count(*)::int
    from public.contract_audit_log
    where contract_id = 'd0000000-0000-0000-0000-000000000013'
      and action = 'contract.archived'
  ),
  1,
  'archival writes a semantic audit entry'
);

-- Payments.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select lives_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      5000,
      'deposit',
      'yape',
      '2026-11-08T10:00:00Z',
      'Adelanto'
    )$$,
  'recording a valid deposit succeeds'
);
select lives_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      5000,
      'balance',
      'cash'
    )$$,
  'recording a balance payment succeeds'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      20000,
      'balance',
      'cash'
    )$$,
  null,
  'payment_exceeds_total',
  'a payment above the remaining balance is rejected'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      0,
      'deposit',
      'cash'
    )$$,
  null,
  'invalid_input',
  'a zero payment is rejected'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000009',
      100,
      'deposit',
      'cash'
    )$$,
  null,
  'payment_state_not_allowed',
  'payments on a cancelled contract are rejected'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000012',
      100,
      'deposit',
      'cash'
    )$$,
  null,
  'payment_state_not_allowed',
  'payments on an annulled contract are rejected'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000013',
      100,
      'deposit',
      'cash'
    )$$,
  null,
  'payment_state_not_allowed',
  'payments on an archived contract are rejected'
);
select throws_ok(
  $$insert into public.contract_payments (contract_id, amount_cents, kind, method)
    values ('d0000000-0000-0000-0000-000000000017', 100, 'deposit', 'cash')$$,
  '42501',
  null,
  'authenticated cannot insert payments directly'
);
select throws_ok(
  $$select count(*) from public.contract_counters$$,
  '42501',
  null,
  'contract counters remain inaccessible to authenticated'
);

reset role;

select is(
  (
    select paid_amount_cents
    from public.contract_financials
    where contract_id = 'd0000000-0000-0000-0000-000000000017'
  ),
  10000,
  'the derived paid amount reflects recorded payments'
);
select is(
  (
    select balance_cents
    from public.contract_financials
    where contract_id = 'd0000000-0000-0000-0000-000000000017'
  ),
  15000,
  'the derived balance reflects recorded payments'
);
select is(
  (
    select count(*)::int
    from public.contract_audit_log
    where contract_id = 'd0000000-0000-0000-0000-000000000017'
      and action = 'payment.recorded'
  ),
  2,
  'each recorded payment is audited'
);

-- Another authenticated owner cannot operate on foreign contracts.
set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"b2222222-2222-2222-2222-222222222222","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000016', 1)$$,
  null,
  'contract_forbidden',
  'another owner cannot confirm a contract'
);
select throws_ok(
  $$select public.sign_contract('d0000000-0000-0000-0000-000000000008', 3, 'Otro')$$,
  null,
  'contract_forbidden',
  'another owner cannot sign a contract'
);
select throws_ok(
  $$select public.cancel_contract('d0000000-0000-0000-0000-000000000009', 2, 'Otro')$$,
  null,
  'contract_forbidden',
  'another owner cannot cancel a contract'
);
select throws_ok(
  $$select public.annul_and_replace_contract(
      'd0000000-0000-0000-0000-000000000019',
      3,
      'Otro'
    )$$,
  null,
  'contract_forbidden',
  'another owner cannot annul a contract'
);
select throws_ok(
  $$select public.archive_contract('d0000000-0000-0000-0000-000000000013', 4)$$,
  null,
  'contract_forbidden',
  'another owner cannot archive a contract'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      100,
      'deposit',
      'cash'
    )$$,
  null,
  'contract_forbidden',
  'another owner cannot record payments'
);

reset role;

-- Anonymous role cannot execute any RPC.
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}'::text, true);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000016', 1)$$,
  '42501',
  null,
  'anon cannot execute contract RPCs'
);
select throws_ok(
  $$select public.record_contract_payment(
      'd0000000-0000-0000-0000-000000000017',
      100,
      'deposit',
      'cash'
    )$$,
  '42501',
  null,
  'anon cannot record payments'
);

reset role;

-- Number exhaustion is tested last because it leaves the counter at 100000.
update public.contract_counters
set next_value = 100000
where owner_id = 'a1111111-1111-1111-1111-111111111111'
  and series = 'default';

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-1111-1111-111111111111","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$select public.confirm_contract('d0000000-0000-0000-0000-000000000007', 1)$$,
  null,
  'contract_number_exhausted',
  'confirming beyond 99999 is rejected'
);

reset role;

select is(
  (
    select next_value
    from public.contract_counters
    where owner_id = 'a1111111-1111-1111-1111-111111111111'
      and series = 'default'
  ),
  100000,
  'an exhausted counter does not advance'
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
