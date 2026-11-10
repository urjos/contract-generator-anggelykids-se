import { getSupabase } from '@/lib/supabase';

import { BrandSettingsError, toBrandSettingsError } from './brand-errors';
import { brandSettingsPayloadSchema } from './brand-schemas';
import type { BrandSettings, BrandSettingsPayload } from './brand-types';

export async function getBrandSettings(): Promise<BrandSettings | null> {
  const { data, error } = await getSupabase()
    .from('brand_settings')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toBrandSettingsError(error);
  }

  return data;
}

export async function saveBrandSettings(
  input: BrandSettingsPayload,
): Promise<BrandSettings> {
  const values = brandSettingsPayloadSchema.parse(input);
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError) {
    throw toBrandSettingsError(authError);
  }
  if (!authData.user) {
    throw new BrandSettingsError(
      'Tu sesión expiró. Vuelve a iniciar sesión.',
      'brand_unauthenticated',
    );
  }

  const { data: existing, error: readError } = await supabase
    .from('brand_settings')
    .select('id')
    .eq('owner_id', authData.user.id)
    .maybeSingle();

  if (readError) {
    throw toBrandSettingsError(readError);
  }

  if (existing) {
    const { data, error } = await supabase
      .from('brand_settings')
      .update({
        business_name: values.businessName,
        phone: values.phone,
        whatsapp: values.whatsapp,
        social_links: values.socialLinks,
      })
      .eq('id', existing.id)
      .eq('owner_id', authData.user.id)
      .select('*')
      .single();

    if (error) {
      throw toBrandSettingsError(error);
    }

    return data;
  }

  const { data, error } = await supabase
    .from('brand_settings')
    .insert({
      id: 1,
      owner_id: authData.user.id,
      business_name: values.businessName,
      phone: values.phone,
      whatsapp: values.whatsapp,
      social_links: values.socialLinks,
    })
    .select('*')
    .single();

  if (error) {
    throw toBrandSettingsError(error);
  }

  return data;
}
