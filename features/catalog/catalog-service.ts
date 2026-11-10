import { toContractOperationError } from '@/features/contracts/contract-errors';
import type { ServiceCatalogItem } from '@/features/contracts/contract-types';
import { getSupabase } from '@/lib/supabase';

export async function listServiceCatalog(): Promise<ServiceCatalogItem[]> {
  const { data, error } = await getSupabase()
    .from('service_catalog')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    throw toContractOperationError(error);
  }

  return data ?? [];
}
