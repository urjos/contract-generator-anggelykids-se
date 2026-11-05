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
    '12121212-1212-1212-1212-121212121212',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-a@example.test',
    '',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    '13131313-1313-1313-1313-131313131313',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'owner-b@example.test',
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
    '14141414-1414-1414-1414-141414141414',
    '12121212-1212-1212-1212-121212121212',
    'Cliente A',
    '+51987650001'
  ),
  (
    '15151515-1515-1515-1515-151515151515',
    '13131313-1313-1313-1313-131313131313',
    'Cliente B',
    '+51987650002'
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
    '16161616-1616-1616-1616-161616161616',
    '12121212-1212-1212-1212-121212121212',
    '14141414-1414-1414-1414-141414141414',
    'children_show',
    now() + interval '3 days',
    'Av. Propietario A 123'
  ),
  (
    '17171717-1717-1717-1717-171717171717',
    '13131313-1313-1313-1313-131313131313',
    '15151515-1515-1515-1515-151515151515',
    'private_show',
    now() + interval '4 days',
    'Av. Propietario B 456'
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
  '20202020-2020-2020-2020-202020202020',
  '12121212-1212-1212-1212-121212121212',
  1,
  '["Condición A"]'::jsonb,
  '{"business_name":"Marca A"}'::jsonb,
  true
);

insert into public.contracts (
  id,
  owner_id,
  client_id,
  event_id,
  total_amount_cents
)
values
  (
    '18181818-1818-1818-1818-181818181818',
    '12121212-1212-1212-1212-121212121212',
    '14141414-1414-1414-1414-141414141414',
    '16161616-1616-1616-1616-161616161616',
    10000
  ),
  (
    '19191919-1919-1919-1919-191919191919',
    '13131313-1313-1313-1313-131313131313',
    '15151515-1515-1515-1515-151515151515',
    '17171717-1717-1717-1717-171717171717',
    20000
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
  '23232323-2323-2323-2323-232323232323',
  '12121212-1212-1212-1212-121212121212',
  '18181818-1818-1818-1818-181818181818',
  1000,
  'deposit',
  'cash'
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
  '21212121-2121-2121-2121-212121212121',
  '12121212-1212-1212-1212-121212121212',
  '18181818-1818-1818-1818-181818181818',
  '18181818-1818-1818-1818-181818181818/1/documento.pdf',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  1
);

insert into storage.objects (bucket_id, name)
values
  (
    'contract-documents',
    '18181818-1818-1818-1818-181818181818/1/documento.pdf'
  ),
  (
    'contract-documents',
    '19191919-1919-1919-1919-191919191919/1/documento.pdf'
  ),
  (
    'contract-documents',
    'not-a-uuid/1/documento.pdf'
  );

select is(
  (
    select public
    from storage.buckets
    where id = 'contract-documents'
  ),
  false,
  'contract-documents is a private bucket'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"12121212-1212-1212-1212-121212121212","role":"authenticated"}'::text,
  true
);

select is(
  (select count(*)::int from public.clients),
  1,
  'owner sees own clients only'
);

select is(
  (
    select count(*)::int
    from public.clients
    where id = '15151515-1515-1515-1515-151515151515'
  ),
  0,
  'owner cannot see another owners client'
);

select is(
  (
    select count(*)::int
    from public.contract_financials
    where contract_id = '18181818-1818-1818-1818-181818181818'
  ),
  1,
  'owner sees own contract financials'
);

select is(
  (
    select count(*)::int
    from public.contract_financials
    where contract_id = '19191919-1919-1919-1919-191919191919'
  ),
  0,
  'owner cannot see another owners financials'
);

select is(
  (
    select count(*)::int
    from storage.objects
    where name = '18181818-1818-1818-1818-181818181818/1/documento.pdf'
  ),
  1,
  'owner can read own storage object'
);

select is(
  (
    select count(*)::int
    from storage.objects
    where name = 'not-a-uuid/1/documento.pdf'
  ),
  0,
  'storage paths without a valid contract UUID are not visible'
);

select is(
  (
    select count(*)::int
    from storage.objects
  ),
  1,
  'owner sees only storage objects of own contracts'
);

select lives_ok(
  $$insert into public.service_catalog (category, name, price_cents)
    values ('other', 'Servicio A', 1000)$$,
  'owner can insert a catalog item'
);

select is(
  (select count(*)::int from public.service_catalog),
  1,
  'owner sees own catalog items'
);

select throws_ok(
  $$delete from public.contract_documents
    where id = '21212121-2121-2121-2121-212121212121'$$,
  '42501',
  null,
  'client cannot delete document metadata'
);

select throws_ok(
  $$delete from public.contract_audit_log
    where contract_id = '18181818-1818-1818-1818-181818181818'$$,
  '42501',
  null,
  'client cannot delete audit rows directly'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"13131313-1313-1313-1313-131313131313","role":"authenticated"}'::text,
  true
);

select is(
  (select count(*)::int from public.clients),
  1,
  'other owner sees own clients only'
);

select is(
  (
    select count(*)::int
    from public.clients
    where id = '14141414-1414-1414-1414-141414141414'
  ),
  0,
  'other owner cannot see the first owners client'
);

select is(
  (select count(*)::int from public.service_catalog),
  0,
  'other owner cannot see the first owners catalog'
);

select is(
  (
    select count(*)::int
    from storage.objects
    where name like '18181818-1818-1818-1818-181818181818/%'
  ),
  0,
  'other owner cannot read the first owners storage object'
);

select is(
  (
    select count(*)::int
    from storage.objects
    where name like '19191919-1919-1919-1919-191919191919/%'
  ),
  1,
  'other owner can read own storage object'
);

with updated as (
  update public.clients
  set full_name = 'Intento de cambio'
  where id = '14141414-1414-1414-1414-141414141414'
  returning 1
)
select is(
  (select count(*) from updated),
  0::bigint,
  'other owner cannot update the first owners client'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"12121212-1212-1212-1212-121212121212","role":"authenticated"}'::text,
  true
);

select throws_ok(
  $$update public.contract_templates
    set brand_snapshot = '{"business_name":"Marca alterada"}'::jsonb
    where id = '20202020-2020-2020-2020-202020202020'$$,
  '42501',
  'contract_template_immutable',
  'template brand snapshot is immutable'
);

reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}'::text, true);

select is(
  (select count(*)::int from storage.objects),
  0,
  'anon cannot read storage objects'
);

select throws_ok(
  $$insert into public.clients (full_name, phone_e164)
    values ('Anon', '+51900000000')$$,
  '42501',
  null,
  'anon cannot insert clients'
);

reset role;

select throws_ok(
  $$insert into public.contracts (owner_id, client_id, event_id, total_amount_cents)
    values (
      '12121212-1212-1212-1212-121212121212',
      '15151515-1515-1515-1515-151515151515',
      '17171717-1717-1717-1717-171717171717',
      1000
    )$$,
  '23503',
  null,
  'a contract cannot mix client, event and owner'
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
