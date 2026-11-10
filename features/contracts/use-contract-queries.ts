import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listServiceCatalog } from '@/features/catalog/catalog-service';
import { listClients } from '@/features/clients/client-service';

import {
  annulAndReplaceContract,
  archiveContract,
  cancelContract,
  confirmContract,
  createDraft,
  deleteDraft,
  getContractOverview,
  getDraftDetails,
  listContractAudit,
  listContractPayments,
  listContracts,
  recordContractPayment,
  signContract,
  updateDraft,
} from './contract-service';
import type { ContractListFilters } from './contract-types';

export const contractKeys = {
  all: ['contracts'] as const,
  list: (filters: ContractListFilters) =>
    [...contractKeys.all, 'list', filters] as const,
  detail: (contractId: string) =>
    [...contractKeys.all, 'detail', contractId] as const,
  payments: (contractId: string) =>
    [...contractKeys.all, 'payments', contractId] as const,
  audit: (contractId: string) =>
    [...contractKeys.all, 'audit', contractId] as const,
  draft: (contractId: string) =>
    [...contractKeys.all, 'draft', contractId] as const,
  clients: ['clients'] as const,
  catalog: ['catalog'] as const,
};

function useInvalidateContract() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: contractKeys.all });
  };
}

export function useContracts(filters: ContractListFilters) {
  return useQuery({
    queryKey: contractKeys.list(filters),
    queryFn: () => listContracts(filters),
  });
}

export function useContractOverview(contractId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.detail(contractId ?? ''),
    queryFn: () => getContractOverview(contractId!),
    enabled: Boolean(contractId),
  });
}

export function useContractPayments(contractId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.payments(contractId ?? ''),
    queryFn: () => listContractPayments(contractId!),
    enabled: Boolean(contractId),
  });
}

export function useContractAudit(contractId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.audit(contractId ?? ''),
    queryFn: () => listContractAudit(contractId!),
    enabled: Boolean(contractId),
  });
}

export function useDraftDetails(contractId: string | undefined) {
  return useQuery({
    queryKey: contractKeys.draft(contractId ?? ''),
    queryFn: () => getDraftDetails(contractId!),
    enabled: Boolean(contractId),
  });
}

export function useClients() {
  return useQuery({
    queryKey: contractKeys.clients,
    queryFn: () => listClients(),
  });
}

export function useServiceCatalog() {
  return useQuery({
    queryKey: contractKeys.catalog,
    queryFn: listServiceCatalog,
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateContract();

  return useMutation({
    mutationFn: createDraft,
    onSuccess: () => {
      invalidate();
      void queryClient.invalidateQueries({ queryKey: contractKeys.clients });
    },
  });
}

export function useUpdateDraft() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: updateDraft,
    onSuccess: invalidate,
  });
}

export function useDeleteDraft() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: deleteDraft,
    onSuccess: invalidate,
  });
}

export function useConfirmContract() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: confirmContract,
    onSuccess: invalidate,
  });
}

export function useSignContract() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: signContract,
    onSuccess: invalidate,
  });
}

export function useCancelContract() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: cancelContract,
    onSuccess: invalidate,
  });
}

export function useAnnulAndReplaceContract() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: annulAndReplaceContract,
    onSuccess: invalidate,
  });
}

export function useArchiveContract() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: archiveContract,
    onSuccess: invalidate,
  });
}

export function useRecordContractPayment() {
  const invalidate = useInvalidateContract();
  return useMutation({
    mutationFn: recordContractPayment,
    onSuccess: invalidate,
  });
}
