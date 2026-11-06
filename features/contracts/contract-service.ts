import { getSupabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

import { toContractOperationError } from './contract-errors';
import {
  annulAndReplaceContractSchema,
  annulAndReplaceResultSchema,
  archiveContractSchema,
  cancelContractSchema,
  confirmContractSchema,
  recordContractPaymentSchema,
  signContractSchema,
  type AnnulAndReplaceContractInput,
  type AnnulAndReplaceContractResult,
  type ArchiveContractInput,
  type CancelContractInput,
  type ConfirmContractInput,
  type RecordContractPaymentInput,
  type SignContractInput,
} from './contract-schemas';

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
