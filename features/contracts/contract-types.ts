import type { Database, Tables } from '@/types/database';

export type ContractStatus = Database['public']['Enums']['contract_status'];
export type EventType = Database['public']['Enums']['event_type'];
export type PaymentKind = Database['public']['Enums']['payment_kind'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

export type Contract = Tables<'contracts'>;
export type ContractOverview = Tables<'contract_overview'>;
export type ContractPayment = Tables<'contract_payments'>;
export type ContractAuditEntry = Tables<'contract_audit_log'>;
export type Client = Tables<'clients'>;
export type EventRecord = Tables<'events'>;
export type ServiceCatalogItem = Tables<'service_catalog'>;

export type DraftDetails = {
  contract: Contract;
  client: Client;
  event: EventRecord;
};

export type ContractListFilters = {
  search?: string;
  statuses?: ContractStatus[];
  includeArchived?: boolean;
  limit?: number;
};

export type DraftPayload = {
  clientId?: string | null;
  clientName: string;
  clientPhone: string;
  eventType: EventType;
  startsAt: string;
  venueName?: string | null;
  venueAddress: string;
  district?: string | null;
  city?: string | null;
  guestCount?: number | null;
  eventNotes?: string | null;
  description: string;
  totalAmountCents: number;
  mobilityAmountCents: number;
  clientVisibleNotes?: string | null;
  internalNotes?: string | null;
  templateId?: string | null;
};

export type UpdateDraftPayload = DraftPayload & {
  contractId: string;
  expectedVersion: number;
};

export type AuditStatusChange = {
  before?: {
    status?: ContractStatus;
    version?: number;
    contract_number?: number | null;
    signed_by_name?: string | null;
    cancellation_reason?: string | null;
  };
  after?: {
    status?: ContractStatus;
    version?: number;
    contract_number?: number | null;
    signed_by_name?: string | null;
    cancellation_reason?: string | null;
  };
};
