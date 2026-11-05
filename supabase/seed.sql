do $$
declare
  v_owner_id uuid;
begin
  select id
  into v_owner_id
  from auth.users
  order by created_at
  limit 1;

  if v_owner_id is null then
    raise notice 'Seed omitido: no hay una cuenta propietaria en auth.users.';
    return;
  end if;

  insert into public.contract_templates (
    owner_id,
    version,
    conditions,
    brand_snapshot,
    is_active
  )
  values (
    v_owner_id,
    1,
    jsonb_build_array(
      'Nota: La movilidad corre por cuenta del cliente (ida y vuelta).',
      'En caso de suspensión o cancelación la productora no se hace responsable por el cambio de fecha ni por el dinero adelantado.',
      'Estando ambas partes de acuerdo para mayor constancia pasan a firmar.'
    ),
    '{}'::jsonb,
    true
  )
  on conflict do nothing;

  insert into public.service_catalog (
    owner_id,
    category,
    name,
    description,
    price_cents,
    sort_order
  )
  values
    (v_owner_id, 'classic_themed', 'Básico', '', 25000, 1),
    (v_owner_id, 'classic_themed', 'Mi Fiesta', '', 39900, 2),
    (v_owner_id, 'classic_themed', 'Super Fiesta', '', 55900, 3),
    (v_owner_id, 'classic_themed', 'Mega Fiesta', '', 69900, 4),
    (v_owner_id, 'classic_themed', 'Fiesta Premium', '', 89900, 5),
    (v_owner_id, 'classic_themed', 'Mega Fiesta Premium', '', 129900, 6)
  on conflict do nothing;

  raise notice 'Seed aplicado para owner_id=%', v_owner_id;
end;
$$;
