import { safeSearchTerm } from '@/lib/format';
import { getSupabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

import { toContractOperationError, ContractOperationError } from './contract-errors';
import {
  annulAndReplaceContractSchema,
  annulAndReplaceResultSchema,
  archiveContractSchema,
  cancelContractSchema,
  confirmContractSchema,
  contractListFiltersSchema,
  draftPayloadSchema,
  recordContractPaymentSchema,
  signContractSchema,
  updateDraftSchema,
  type AnnulAndReplaceContractInput,
  type AnnulAndReplaceContractResult,
  type ArchiveContractInput,
  type CancelContractInput,
  type ConfirmContractInput,
  type RecordContractPaymentInput,
  type SignContractInput,
} from './contract-schemas';
import type {
  Client,
  ContractAuditEntry,
  ContractListFilters,
  ContractOverview,
  DraftDetails,
  DraftPayload,
  EventRecord,
  UpdateDraftPayload,
} from './contract-types';

export type Contract = Tables<'contracts'>;
export type ContractPayment = Tables<'contract_payments'>;

function emptyDataError() {
  return toContractOperationError(new Error('Sin datos'));
}

export async function confirmContract(
  input: ConfirmContractInput,
): Promise<Contract> {
  const values = confirmContractSchema.parse(input);
  const { data, error } = await getSupabase().rpc('confirm_contract', {
    p_contract_id: values.contractId,
    p_expected_version: values.expectedVersion,
  });

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw emptyDataError();
  }

  return data;
}

export async function signContract(input: SignContractInput): Promise<Contract> {
  const values = signContractSchema.parse(input);
  const { data, error } = await getSupabase().rpc('sign_contract', {
    p_contract_id: values.contractId,
    p_expected_version: values.expectedVersion,
    p_signed_by_name: values.signedByName,
    p_signed_at: values.signedAt,
  });

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw emptyDataError();
  }

  return data;
}

export async function cancelContract(
  input: CancelContractInput,
): Promise<Contract> {
  const values = cancelContractSchema.parse(input);
  const { data, error } = await getSupabase().rpc('cancel_contract', {
    p_contract_id: values.contractId,
    p_expected_version: values.expectedVersion,
    p_reason: values.reason,
    p_cancelled_at: values.cancelledAt,
  });

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw emptyDataError();
  }

  return data;
}

export async function annulAndReplaceContract(
  input: AnnulAndReplaceContractInput,
): Promise<AnnulAndReplaceContractResult> {
  const values = annulAndReplaceContractSchema.parse(input);
  const { data, error } = await getSupabase().rpc(
    'annul_and_replace_contract',
    {
      p_contract_id: values.contractId,
      p_expected_version: values.expectedVersion,
      p_reason: values.reason,
      p_cancelled_at: values.cancelledAt,
      p_replacement_event_id: values.replacementEventId ?? undefined,
    },
  );

  if (error) {
    throw toContractOperationError(error);
  }
  if (data === null) {
    throw emptyDataError();
  }

  const parsed = annulAndReplaceResultSchema.safeParse(data);
  if (!parsed.success) {
    throw emptyDataError();
  }

  return parsed.data;
}

export async function archiveContract(
  input: ArchiveContractInput,
): Promise<Contract> {
  const values = archiveContractSchema.parse(input);
  const { data, error } = await getSupabase().rpc('archive_contract', {
    p_contract_id: values.contractId,
    p_expected_version: values.expectedVersion,
  });

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw emptyDataError();
  }

  return data;
}

export async function recordContractPayment(
  input: RecordContractPaymentInput,
): Promise<ContractPayment> {
  const values = recordContractPaymentSchema.parse(input);
  const { data, error } = await getSupabase().rpc('record_contract_payment', {
    p_contract_id: values.contractId,
    p_amount_cents: values.amountCents,
    p_kind: values.kind,
    p_method: values.method,
    p_paid_at: values.paidAt,
    p_note: values.note ?? undefined,
  });

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw emptyDataError();
  }

  return data;
}

function contractNotFoundError() {
  return new ContractOperationError('El contrato ya no existe.', 'contract_not_found');
}

function invalidTransitionError() {
  return new ContractOperationError(
    'El contrato cambió de estado. Actualiza la pantalla.',
    'contract_invalid_transition',
  );
}

function versionMismatchError() {
  return new ContractOperationError(
    'El contrato fue modificado en otro dispositivo. Recarga e inténtalo de nuevo.',
    'contract_version_mismatch',
  );
}

export async function listContracts(
  filters: ContractListFilters = {},
): Promise<ContractOverview[]> {
  const values = contractListFiltersSchema.parse(filters);
  let query = getSupabase().from('contract_overview').select('*');

  if (values.statuses && values.statuses.length > 0) {
    query = query.in('status', values.statuses);
  } else if (!values.includeArchived) {
    query = query.neq('status', 'archived');
  }

  const term = safeSearchTerm(values.search ?? '');
  if (term) {
    const searchFilters = [
      `client_name.ilike.%${term}%`,
      `client_phone.ilike.%${term}%`,
      `description.ilike.%${term}%`,
    ];

    if (/^\d+$/.test(term)) {
      searchFilters.push(`contract_number.eq.${Number(term)}`);
    }

    query = query.or(searchFilters.join(','));
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(values.limit ?? 50);

  if (error) {
    throw toContractOperationError(error);
  }

  return data ?? [];
}

export async function getContractOverview(
  contractId: string,
): Promise<ContractOverview> {
  const { data, error } = await getSupabase()
    .from('contract_overview')
    .select('*')
    .eq('contract_id', contractId)
    .maybeSingle();

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw contractNotFoundError();
  }

  return data;
}

export async function listContractPayments(
  contractId: string,
): Promise<ContractPayment[]> {
  const { data, error } = await getSupabase()
    .from('contract_payments')
    .select('*')
    .eq('contract_id', contractId)
    .order('paid_at', { ascending: false });

  if (error) {
    throw toContractOperationError(error);
  }

  return data ?? [];
}

export async function listContractAudit(
  contractId: string,
): Promise<ContractAuditEntry[]> {
  const { data, error } = await getSupabase()
    .from('contract_audit_log')
    .select('*')
    .eq('contract_id', contractId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    throw toContractOperationError(error);
  }

  return data ?? [];
}

export async function getDraftDetails(contractId: string): Promise<DraftDetails> {
  const { data: contract, error: contractError } = await getSupabase()
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .maybeSingle();

  if (contractError) {
    throw toContractOperationError(contractError);
  }
  if (!contract) {
    throw contractNotFoundError();
  }

  const [{ data: client, error: clientError }, { data: event, error: eventError }] =
    await Promise.all([
      getSupabase().from('clients').select('*').eq('id', contract.client_id).maybeSingle(),
      getSupabase().from('events').select('*').eq('id', contract.event_id).maybeSingle(),
    ]);

  if (clientError) {
    throw toContractOperationError(clientError);
  }
  if (eventError) {
    throw toContractOperationError(eventError);
  }
  if (!client || !event) {
    throw new ContractOperationError(
      'El cliente o el evento del borrador ya no existen.',
      'contract_incomplete',
    );
  }

  return { contract, client, event };
}

async function deleteQuietly(
  table: 'clients' | 'events',
  id: string,
): Promise<void> {
  await getSupabase().from(table).delete().eq('id', id);
}

export async function createDraft(input: DraftPayload): Promise<Contract> {
  const values = draftPayloadSchema.parse(input);
  let clientId = values.clientId ?? null;
  let createdClientId: string | null = null;
  let eventId: string | null = null;

  if (!clientId) {
    const { data: client, error: clientError } = await getSupabase()
      .from('clients')
      .insert({
        full_name: values.clientName,
        phone_e164: values.clientPhone,
      })
      .select()
      .single();

    if (clientError) {
      throw toContractOperationError(clientError);
    }
    clientId = client.id;
    createdClientId = client.id;
  }

  const { data: event, error: eventError } = await getSupabase()
    .from('events')
    .insert({
      client_id: clientId,
      event_type: values.eventType,
      starts_at: values.startsAt,
      venue_name: values.venueName ?? null,
      venue_address: values.venueAddress,
      district: values.district ?? null,
      city: values.city ?? null,
      guest_count: values.guestCount ?? null,
      notes: values.eventNotes ?? null,
    })
    .select()
    .single();

  if (eventError) {
    if (createdClientId) {
      await deleteQuietly('clients', createdClientId);
    }
    throw toContractOperationError(eventError);
  }
  eventId = event.id;

  const { data: contract, error: contractError } = await getSupabase()
    .from('contracts')
    .insert({
      client_id: clientId,
      event_id: event.id,
      template_id: values.templateId ?? null,
      description: values.description,
      total_amount_cents: values.totalAmountCents,
      mobility_amount_cents: values.mobilityAmountCents,
      client_visible_notes: values.clientVisibleNotes ?? null,
      internal_notes: values.internalNotes ?? null,
    })
    .select()
    .single();

  if (contractError) {
    if (eventId) {
      await deleteQuietly('events', eventId);
    }
    if (createdClientId) {
      await deleteQuietly('clients', createdClientId);
    }
    throw toContractOperationError(contractError);
  }

  return contract;
}

export async function updateDraft(input: UpdateDraftPayload): Promise<Contract> {
  const values = updateDraftSchema.parse(input);
  const { data: contract, error: contractReadError } = await getSupabase()
    .from('contracts')
    .select('*')
    .eq('id', values.contractId)
    .maybeSingle();

  if (contractReadError) {
    throw toContractOperationError(contractReadError);
  }
  if (!contract) {
    throw contractNotFoundError();
  }
  if (contract.status !== 'draft') {
    throw invalidTransitionError();
  }
  if (contract.version !== values.expectedVersion) {
    throw versionMismatchError();
  }

  const [
    { data: originalClient, error: clientReadError },
    { data: originalEvent, error: eventReadError },
  ] = await Promise.all([
    getSupabase().from('clients').select('*').eq('id', contract.client_id).maybeSingle(),
    getSupabase().from('events').select('*').eq('id', contract.event_id).maybeSingle(),
  ]);

  if (clientReadError) {
    throw toContractOperationError(clientReadError);
  }
  if (eventReadError) {
    throw toContractOperationError(eventReadError);
  }
  if (!originalClient || !originalEvent) {
    throw new ContractOperationError(
      'El cliente o el evento del borrador ya no existen.',
      'contract_incomplete',
    );
  }

  const { error: clientUpdateError } = await getSupabase()
    .from('clients')
    .update({
      full_name: values.clientName,
      phone_e164: values.clientPhone,
    })
    .eq('id', contract.client_id);

  if (clientUpdateError) {
    throw toContractOperationError(clientUpdateError);
  }

  const { error: eventUpdateError } = await getSupabase()
    .from('events')
    .update({
      event_type: values.eventType,
      starts_at: values.startsAt,
      venue_name: values.venueName ?? null,
      venue_address: values.venueAddress,
      district: values.district ?? null,
      city: values.city ?? null,
      guest_count: values.guestCount ?? null,
      notes: values.eventNotes ?? null,
    })
    .eq('id', contract.event_id);

  if (eventUpdateError) {
    await getSupabase()
      .from('clients')
      .update({
        full_name: originalClient.full_name,
        phone_e164: originalClient.phone_e164,
      })
      .eq('id', originalClient.id);
    throw toContractOperationError(eventUpdateError);
  }

  const { data: updated, error: contractUpdateError } = await getSupabase()
    .from('contracts')
    .update({
      template_id: values.templateId ?? null,
      description: values.description,
      total_amount_cents: values.totalAmountCents,
      mobility_amount_cents: values.mobilityAmountCents,
      client_visible_notes: values.clientVisibleNotes ?? null,
      internal_notes: values.internalNotes ?? null,
      version: values.expectedVersion + 1,
    })
    .eq('id', values.contractId)
    .eq('version', values.expectedVersion)
    .select()
    .maybeSingle();

  if (contractUpdateError) {
    await getSupabase()
      .from('events')
      .update({
        event_type: originalEvent.event_type,
        starts_at: originalEvent.starts_at,
        venue_name: originalEvent.venue_name,
        venue_address: originalEvent.venue_address,
        district: originalEvent.district,
        city: originalEvent.city,
        guest_count: originalEvent.guest_count,
        notes: originalEvent.notes,
      })
      .eq('id', originalEvent.id);
    await getSupabase()
      .from('clients')
      .update({
        full_name: originalClient.full_name,
        phone_e164: originalClient.phone_e164,
      })
      .eq('id', originalClient.id);
    throw toContractOperationError(contractUpdateError);
  }

  if (!updated) {
    await getSupabase()
      .from('events')
      .update({
        event_type: originalEvent.event_type,
        starts_at: originalEvent.starts_at,
        venue_name: originalEvent.venue_name,
        venue_address: originalEvent.venue_address,
        district: originalEvent.district,
        city: originalEvent.city,
        guest_count: originalEvent.guest_count,
        notes: originalEvent.notes,
      })
      .eq('id', originalEvent.id);
    await getSupabase()
      .from('clients')
      .update({
        full_name: originalClient.full_name,
        phone_e164: originalClient.phone_e164,
      })
      .eq('id', originalClient.id);
    throw versionMismatchError();
  }

  return updated;
}

export async function deleteDraft(contractId: string): Promise<void> {
  const { data, error } = await getSupabase()
    .from('contracts')
    .delete()
    .eq('id', contractId)
    .select('id')
    .maybeSingle();

  if (error) {
    throw toContractOperationError(error);
  }
  if (!data) {
    throw invalidTransitionError();
  }
}

export type { Client, ContractListFilters, EventRecord };
