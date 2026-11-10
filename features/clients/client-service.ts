import { toContractOperationError } from '@/features/contracts/contract-errors';
import type { Client } from '@/features/contracts/contract-types';
import { safeSearchTerm } from '@/lib/format';
import { getSupabase } from '@/lib/supabase';

export async function listClients(search?: string): Promise<Client[]> {
  let query = getSupabase()
    .from('clients')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(100);

  const term = safeSearchTerm(search ?? '');
  if (term) {
    query = query.or(`full_name.ilike.%${term}%,phone_e164.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw toContractOperationError(error);
  }

  return data ?? [];
}
